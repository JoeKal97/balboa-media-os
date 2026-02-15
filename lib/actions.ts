'use server'

import { supabase } from './supabaseClient'
import { Issue, IssueStatus, Publication } from './schema'
import { addDays, setHours, setMinutes, format, parseISO, nextDay, getDay } from 'date-fns'
import { toDate } from 'date-fns-tz'

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

  if (error) throw error
  return data || []
}

/**
 * Get next send datetime for a publication in America/Denver
 */
function computeNextSendDateTime(pub: Publication): Date {
  const now = new Date()
  const [hours, minutes] = pub.send_time_local.split(':').map(Number)

  // Start from today in Denver timezone
  let candidate = new Date(now)
  candidate = setHours(candidate, hours, minutes, 0, 0)

  // If this time has passed, start from tomorrow
  if (candidate <= now) {
    candidate = addDays(candidate, 1)
  }

  // Find the next occurrence of the target day of week
  const targetDayOfWeek = pub.send_day_of_week
  let currentDayOfWeek = getDay(candidate)

  let daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7
  if (daysToAdd === 0 && candidate <= now) {
    daysToAdd = 7
  }

  candidate = addDays(candidate, daysToAdd)
  candidate = setHours(candidate, hours, minutes, 0, 0)

  return candidate
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

  if (pubError) throw pubError

  const pub: Publication = pubData

  // Check if next issue already exists
  const nextSendDateTime = computeNextSendDateTime(pub)
  const issueDateLocal = format(nextSendDateTime, 'yyyy-MM-dd')

  const { data: existingIssue } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', publicationId)
    .gte('send_datetime_local', new Date().toISOString())
    .order('send_datetime_local', { ascending: true })
    .limit(1)

  if (existingIssue && existingIssue.length > 0) {
    return existingIssue[0]
  }

  // Create new issue in a transaction-like manner
  // 1. Create issue
  const { data: issueData, error: issueError } = await supabase
    .from('issues')
    .insert({
      publication_id: publicationId,
      issue_date: issueDateLocal,
      send_datetime_local: nextSendDateTime.toISOString(),
      status: 'draft',
      risk_score: pub.articles_required_per_issue * 2, // All slots missing = full risk
    })
    .select()
    .single()

  if (issueError) throw issueError

  const issue: Issue = issueData

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

  if (slotsError) throw slotsError

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

  if (checklistError) throw checklistError

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

  if (error) throw error

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

  if (error) throw error

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
  const sendTime = new Date(issue.send_datetime_local)
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

  if (error) throw error
}

/**
 * Set issue status
 */
export async function setIssueStatus(issueId: string, status: IssueStatus) {
  const { error } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issueId)

  if (error) throw error

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
    issue,
    slots,
    checklist,
  }
}

/**
 * Fetch issue history for a publication
 */
export async function getIssueHistory(publicationId: string, limit: number = 8) {
  const { data } = await supabase
    .from('issues')
    .select('*')
    .eq('publication_id', publicationId)
    .order('send_datetime_local', { ascending: false })
    .limit(limit)

  return data || []
}
