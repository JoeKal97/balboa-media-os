'use server'

import { supabase } from './supabaseClient'
import { Issue, IssueStatus, Publication } from './schema'
import { addDays, set, format } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { normalizeIssueData, normalizeIssuesArray, getDatetimeColumnName } from './schemaAdapter'

const TIMEZONE = 'America/Denver'

/**
 * List all active publications
 */
export async function listPublications(): Promise<Publication[]> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(`Failed to list publications: ${error.message}`)
  return data || []
}

/**
 * Get next send datetime for a publication in America/Denver
 */
function computeNextSendDateTime(pub: Publication): Date {
  const nowUtc = new Date()
  const nowDenver = toZonedTime(nowUtc, TIMEZONE)
  const parts = pub.send_time_local.split(':').map((p) => Number(p))
  const hours = parts[0] ?? 0
  const minutes = parts[1] ?? 0
  let candidateDenver = set(nowDenver, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  })

  if (candidateDenver <= nowDenver) {
    candidateDenver = addDays(candidateDenver, 1)
  }

  const targetDow = pub.send_day_of_week
  while (candidateDenver.getDay() !== targetDow) {
    candidateDenver = addDays(candidateDenver, 1)
  }

  return fromZonedTime(candidateDenver, TIMEZONE)
}

/**
 * Get or create the next issue for a publication
 */
export async function getOrCreateNextIssue(publicationId: string): Promise<Issue> {
  // Fetch the publication
  const { data: pubData, error: pubError } = await supabase
    .from('publications')
    .select('*')
    .eq('id', publicationId)
    .single()

  if (pubError) throw new Error(`Failed to fetch publication: ${pubError.message}`)

  const pub: Publication = pubData

  // Detect which column name to use
  const dateTimeColumnName = await getDatetimeColumnName()

  // Check if next issue already exists
  const nextSendDateTime = computeNextSendDateTime(pub)
  const issueDateLocal = format(
    toZonedTime(nextSendDateTime, TIMEZONE),
    'yyyy-MM-dd'
  )

  // Query for an issue matching the computed next send date
  const { data: existingIssue } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', publicationId)
    .eq('issue_date', issueDateLocal)
    .limit(1)

  if (existingIssue && existingIssue.length > 0) {
    const issue = existingIssue[0]
    const normalized = normalizeIssueData(issue)
    return normalized
  }

  // Create new issue in a transaction-like manner
  // 1. Create issue
  // The app auto-detects whether to use send_datetime_utc (new) or send_datetime_local (old)
  const issuePayload: any = {
    publication_id: publicationId,
    issue_date: issueDateLocal,
    status: 'draft',
    risk_score: pub.articles_required_per_issue * 2, // All slots missing = full risk
  }
  
  // Use the correct column name for this database
  issuePayload[dateTimeColumnName] = nextSendDateTime.toISOString()
  
  const { data: issueData, error: issueError } = await supabase
    .from('issues')
    .insert(issuePayload)
    .select()
    .single()

  if (issueError) throw new Error(`Failed to create issue: ${issueError.message}`)

  const issue: Issue = normalizeIssueData(issueData)

  // 2. Create article slots
  const slots = Array.from({ length: pub.articles_required_per_issue }, (_, i) => ({
    issue_id: issue.id,
    slot_index: i + 1,
    article_title: null,
    article_url: null,
    status: 'missing' as const,
  }))

  const { error: slotsError } = await supabase
    .from('issue_article_slots')
    .insert(slots)

  if (slotsError) throw new Error(`Failed to create article slots: ${slotsError.message}`)

  // 3. Create checklist
  const { error: checklistError } = await supabase
    .from('issue_checklists')
    .insert({
      issue_id: issue.id,
      articles_complete: false,
      seo_verified: false,
      internal_links_verified: false,
      formatted: false,
      sent: false,
    })

  if (checklistError) throw new Error(`Failed to create checklist: ${checklistError.message}`)

  return issue
}

/**
 * Update an article slot
 */
export async function updateSlot(
  slotId: string,
  fields: {
    article_title?: string | null
    article_url?: string | null
    status?: 'missing' | 'draft' | 'published'
  }
) {
  const { error } = await supabase
    .from('issue_article_slots')
    .update(fields)
    .eq('id', slotId)

  if (error) throw new Error(`Failed to update slot: ${error.message}`)

  // Recompute risk after slot update
  const { data: slot } = await supabase
    .from('issue_article_slots')
    .select('issue_id')
    .eq('id', slotId)
    .single()

  if (slot) {
    await recomputeRisk(slot.issue_id)
  }
}

/**
 * Update issue checklist
 */
export async function updateChecklist(
  issueId: string,
  fields: {
    articles_complete?: boolean
    seo_verified?: boolean
    internal_links_verified?: boolean
    formatted?: boolean
    sent?: boolean
  }
) {
  const { error } = await supabase
    .from('issue_checklists')
    .update(fields)
    .eq('issue_id', issueId)

  if (error) throw new Error(`Failed to update checklist: ${error.message}`)

  // Recompute risk after checklist update
  await recomputeRisk(issueId)
}

/**
 * Recompute risk score for an issue
 */
export async function recomputeRisk(issueId: string) {
  // Fetch issue and related data
  const { data: issue } = await supabase
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .single()

  if (!issue) return

  const { data: slots } = await supabase
    .from('issue_article_slots')
    .select('status')
    .eq('issue_id', issueId)

  const { data: checklist } = await supabase
    .from('issue_checklists')
    .select('*')
    .eq('issue_id', issueId)
    .single()

  // Compute risk
  let risk = 0

  // +2 for each missing slot
  const missingSlots = slots?.filter(s => s.status === 'missing').length || 0
  risk += missingSlots * 2

  // +1 for each draft slot
  const draftSlots = slots?.filter(s => s.status === 'draft').length || 0
  risk += draftSlots * 1

  const now = new Date()
  const normalizedIssue = normalizeIssueData(issue)
  const sendTime = new Date(normalizedIssue.send_datetime_utc)
  const hoursUntilSend = (sendTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  // +2 if < 24 hours AND (missing slots OR checklist false)
  if (hoursUntilSend < 24) {
    const hasProblems =
      missingSlots > 0 ||
      draftSlots > 0 ||
      !checklist?.articles_complete ||
      !checklist?.seo_verified ||
      !checklist?.internal_links_verified ||
      !checklist?.formatted

    if (hasProblems) {
      risk += 2
    }
  }

  // +1 if formatted=false AND < 48 hours
  if (hoursUntilSend < 48 && !checklist?.formatted) {
    risk += 1
  }

  // Update risk score
  const { error } = await supabase
    .from('issues')
    .update({ risk_score: risk })
    .eq('id', issueId)

  if (error) throw new Error(`Failed to update risk score: ${error.message}`)
}

/**
 * Set issue status
 */
export async function setIssueStatus(issueId: string, status: IssueStatus) {
  const { error } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issueId)

  if (error) throw new Error(`Failed to update issue status: ${error.message}`)

  // If marking as sent, update checklist
  if (status === 'sent') {
    await updateChecklist(issueId, { sent: true })
  }

  // Recompute risk
  await recomputeRisk(issueId)
}

/**
 * Fetch a single issue with slots and checklist
 */
export async function getIssueWithDetails(issueId: string) {
  const { data: issue } = await supabase
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .single()

  const { data: slots } = await supabase
    .from('issue_article_slots')
    .select('*')
    .eq('issue_id', issueId)
    .order('slot_index', { ascending: true })

  const { data: checklist } = await supabase
    .from('issue_checklists')
    .select('*')
    .eq('issue_id', issueId)
    .single()

  return {
    issue: normalizeIssueData(issue),
    slots,
    checklist,
  }
}

/**
 * Fetch issue history for a publication
 */
export async function getIssueHistory(publicationId: string, limit: number = 8) {
  const dateTimeColumnName = await getDatetimeColumnName()
  
  const { data } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', publicationId)
    .order(dateTimeColumnName, { ascending: false })
    .limit(limit)

  return normalizeIssuesArray(data || [])
}

/**
 * Sync article slots with Letterman to detect published articles
 * Matches by URL and updates status from "draft" to "published"
 */
export async function syncFromLetterman(issueId: string) {
  // Get Letterman API key from credentials file
  const fs = require('fs')
  const path = require('path')
  const credPath = path.join(process.cwd(), '..', 'credentials', 'titanium_software.txt')
  
  let lettermanKey = ''
  try {
    const creds = fs.readFileSync(credPath, 'utf-8')
    const match = creds.match(/Letterman:\s*(.+)/i)
    if (match) {
      lettermanKey = match[1].trim()
    }
  } catch (err) {
    throw new Error('Letterman API key not found in credentials/titanium_software.txt')
  }

  if (!lettermanKey) {
    throw new Error('Letterman API key not found in credentials')
  }

  // Get all slots for this issue
  const { data: slots, error: slotsError } = await supabase
    .from('issue_article_slots')
    .select('*')
    .eq('issue_id', issueId)
    .eq('status', 'draft')
    .not('article_url', 'is', null)

  if (slotsError) throw new Error(`Failed to fetch slots: ${slotsError.message}`)
  if (!slots || slots.length === 0) return { updated: 0, message: 'No draft articles to check' }

  let updated = 0

  // For each draft slot with a URL, check Letterman
  for (const slot of slots) {
    try {
      // Get all Letterman publications to search across
      const pubsRes = await fetch('https://api.letterman.ai/api/ai/newsletters-storage', {
        headers: {
          'Authorization': `Bearer ${lettermanKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!pubsRes.ok) continue

      const pubs = await pubsRes.json()

      // Search each publication for the article
      for (const pub of pubs) {
        const articlesRes = await fetch(
          `https://api.letterman.ai/api/ai/newsletters-storage/${pub._id}/newsletters?type=ARTICLE`,
          {
            headers: {
              'Authorization': `Bearer ${lettermanKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!articlesRes.ok) continue

        const articles = await articlesRes.json()

        // Find article by URL match
        const article = articles.find((a: any) => {
          const articleUrl = a.urlPath ? `https://${pub.domain}/${a.urlPath}` : null
          return articleUrl === slot.article_url
        })

        if (article && article.state === 'PUBLISHED') {
          // Update slot to published
          const { error: updateError } = await supabase
            .from('issue_article_slots')
            .update({ status: 'published' })
            .eq('id', slot.id)

          if (!updateError) {
            updated++
          }
          break // Found the article, no need to check other pubs
        }
      }
    } catch (err) {
      console.error(`Error checking slot ${slot.id}:`, err)
      // Continue with other slots
    }
  }

  // Recompute risk after updates
  if (updated > 0) {
    await recomputeRisk(issueId)
  }

  return {
    updated,
    message: updated > 0
      ? `Updated ${updated} article${updated > 1 ? 's' : ''} to published`
      : 'No articles were published yet'
  }
}
