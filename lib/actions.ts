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
 * CRITICAL: Will NOT create a new issue if there's an unsent past issue
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

  // 🚨 CRITICAL FIX: Check for unsent past issues FIRST
  // If the send date has passed but issue wasn't marked "sent", return that issue
  const nowUtc = new Date().toISOString()
  const { data: unsentPastIssues } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', publicationId)
    .lt(dateTimeColumnName, nowUtc)  // Send datetime is in the past
    .neq('status', 'sent')  // Not marked as sent
    .order('issue_date', { ascending: false })  // Most recent first
    .limit(1)

  if (unsentPastIssues && unsentPastIssues.length > 0) {
    // Found an unsent past issue - return it with overdue flag
    const issue = unsentPastIssues[0]
    const normalized = normalizeIssueData(issue)
    // Add overdue flag to indicate this issue is past due
    return { ...normalized, is_overdue: true }
  }

  // Compute the next send date
  const nextSendDateTime = computeNextSendDateTime(pub)
  const issueDateLocal = format(
    toZonedTime(nextSendDateTime, TIMEZONE),
    'yyyy-MM-dd'
  )

  // Check if next issue already exists
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
 * NEW LOGIC: Only show risk if within 3 days (72 hours) of deadline
 * AND 2+ conditions are met
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

  const now = new Date()
  const normalizedIssue = normalizeIssueData(issue)
  const sendTime = new Date(normalizedIssue.send_datetime_utc)
  const hoursUntilSend = (sendTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  const daysUntilSend = hoursUntilSend / 24

  // 🎯 NEW LOGIC: If more than 3 days away, always GREEN (risk = 0)
  if (daysUntilSend > 3) {
    // Update risk score to 0 (green)
    const { error } = await supabase
      .from('issues')
      .update({ risk_score: 0 })
      .eq('id', issueId)
    if (error) throw new Error(`Failed to update risk score: ${error.message}`)
    return
  }

  // Count conditions (only calculate if within 3 days)
  let conditionsMet = 0
  
  // Missing slots condition
  const missingSlots = slots?.filter(s => s.status === 'missing').length || 0
  if (missingSlots > 0) conditionsMet++
  
  // Draft slots condition
  const draftSlots = slots?.filter(s => s.status === 'draft').length || 0
  if (draftSlots > 0) conditionsMet++
  
  // Checklist conditions
  if (!checklist?.articles_complete) conditionsMet++
  if (!checklist?.seo_verified) conditionsMet++
  if (!checklist?.internal_links_verified) conditionsMet++
  if (!checklist?.formatted) conditionsMet++

  // Calculate base risk score
  let risk = 0

  // Only apply risk if 2+ conditions are met AND within 3 days
  if (conditionsMet >= 2) {
    // +2 for each missing slot
    risk += missingSlots * 2
    // +1 for each draft slot
    risk += draftSlots * 1
  }

  // Time-based escalations (only if within 3 days and has problems)
  if (conditionsMet >= 2) {
    // Within 24 hours: +2 risk
    if (hoursUntilSend < 24) {
      risk += 2
    }
    // Within 48 hours: +1 risk
    else if (hoursUntilSend < 48) {
      risk += 1
    }
    // Within 72 hours (3 days): +0 but still show yellow/red from base
  }

  // 🚨 AUTO-ARTICLE CREATION TRIGGER
  // If risk is high (RED) and within 3 days, trigger article creation
  const isHighRisk = risk >= 6  // Threshold for RED
  if (isHighRisk && daysUntilSend <= 3 && !normalizedIssue.auto_articles_triggered) {
    // Mark that auto-creation was triggered to prevent duplicates
    await supabase
      .from('issues')
      .update({ auto_articles_triggered: true })
      .eq('id', issueId)
    
    // Trigger article creation (async, don't block risk update)
    createDraftArticlesForIssue(issueId, missingSlots).catch(console.error)
  }

  // Update risk score
  const { error } = await supabase
    .from('issues')
    .update({ risk_score: risk })
    .eq('id', issueId)

  if (error) throw new Error(`Failed to update risk score: ${error.message}`)
}

/**
 * Auto-create draft articles when risk turns red
 * This gets triggered when within 3 days and high risk
 */
async function createDraftArticlesForIssue(issueId: string, missingCount: number) {
  try {
    // Get issue and publication details
    const { data: issue } = await supabase
      .from('issues')
      .select('*, publications(name)')  
      .eq('id', issueId)
      .single()

    if (!issue) return

    const publicationName = issue.publications?.name || 'Unknown'
    
    // TODO: Create articles based on publication's pillar content strategy
    // For now, log that this would create articles
    console.log(`🤖 AUTO-ARTICLE CREATION TRIGGERED for ${publicationName}`)
    console.log(`   Issue ID: ${issueId}`)
    console.log(`   Missing articles needed: ${missingCount}`)
    console.log(`   Action: Create ${missingCount} draft articles and post to Letterman`)
    
    // This is where we'd:
    // 1. Query the publication's content strategy/pillars
    // 2. Generate article outlines/topics
    // 3. Create articles in Letterman as drafts
    // 4. Update slots with article URLs
    // 5. Send alert to user
    
    // For now, we'll just update the issue with a note
    await supabase
      .from('issues')
      .update({ 
        auto_articles_status: 'pending_creation',
        auto_articles_requested_at: new Date().toISOString()
      })
      .eq('id', issueId)
      
  } catch (error) {
    console.error('Error in auto-article creation:', error)
  }
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

  // If marking as sent, update checklist and create next issue
  if (status === 'sent') {
    await updateChecklist(issueId, { sent: true })
    
    // 🎯 CRITICAL: Create the next issue now that this one is sent
    // Get the publication ID from the issue
    const { data: issue } = await supabase
      .from('issues')
      .select('publication_id')
      .eq('id', issueId)
      .single()
    
    if (issue) {
      // This will create the next issue for the following week
      await getOrCreateNextIssue(issue.publication_id)
    }
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
  // Hardcoded Letterman API key (from credentials file)
  const lettermanKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGM2MjVlODNlZGJjNTNmMWJmODc0YmIiLCJrZXkiOiIzMTBhOGU3MTEzMDQ1ODM3NmU0ZGM1M2M0ZDg5ZWNmMCIsImlkIjoiNjk4M2U0MjhlOGMwYjZmOTU4YTcwNTkzIiwiaWF0IjoxNzcwMjUxMzA1LCJleHAiOjE4MDE3ODczMDV9.9zHseu2Jo9BdrghX7e8q3vUYpqoeQhjXttwLOk6xyjs'

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
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lettermanKey}`,
        },
      })

      if (!pubsRes.ok) continue

      const pubs = await pubsRes.json()

      // Search each publication for the article
      for (const pub of pubs) {
        const articlesRes = await fetch(
          `https://api.letterman.ai/api/ai/newsletters-storage/${pub._id}/newsletters?type=ARTICLE`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${lettermanKey}`,
            },
          }
        )

        if (!articlesRes.ok) continue

        const articles = await articlesRes.json()

        // Extract slug from Balboa URL (last segment after final /)
        const slotSlug = slot.article_url.split('/').pop() || ''
        
        // Find article by slug match (handles missing domain and /a/ prefix)
        const article = articles.find((a: any) => {
          if (!a.urlPath) return false
          const lettermanSlug = a.urlPath.split('/').pop() || a.urlPath
          return lettermanSlug === slotSlug
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

  // After updates, check if all slots are now published
  if (updated > 0) {
    // Fetch all slots for this issue (fresh data)
    const { data: allSlots } = await supabase
      .from('issue_article_slots')
      .select('status')
      .eq('issue_id', issueId)

    const allPublished = allSlots?.every(s => s.status === 'published') || false

    // If all slots are published, auto-complete the "articles_complete" checklist
    if (allPublished) {
      await updateChecklist(issueId, { articles_complete: true })
    }

    // Recompute risk after checklist update
    await recomputeRisk(issueId)
  }

  return {
    updated,
    message: updated > 0
      ? `Updated ${updated} article${updated > 1 ? 's' : ''} to published`
      : 'No articles were published yet'
  }
}
