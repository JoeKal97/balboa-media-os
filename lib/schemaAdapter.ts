/**
 * Schema Adapter
 * 
 * Handles graceful schema migration by detecting which column exists
 * in the issues table and providing a unified interface.
 * 
 * This allows the app to work with either:
 * - Old schema: send_datetime_local
 * - New schema: send_datetime_utc
 * 
 * No manual migration required - the app auto-adapts.
 */

import { supabase } from './supabaseClient'

let cachedColumnName: string | null = null

/**
 * Detect which column name exists in the issues table
 * Returns: 'send_datetime_utc' (new) or 'send_datetime_local' (old)
 */
export async function detectSendDatetimeColumn(): Promise<string> {
  // Return cached result if available
  if (cachedColumnName) {
    return cachedColumnName
  }

  try {
    // Try to query with the new column name first
    const { error: newError } = await supabase
      .from('issues')
      .select('send_datetime_utc')
      .limit(1)

    if (!newError) {
      cachedColumnName = 'send_datetime_utc'
      console.log('✅ Schema: Using send_datetime_utc (new)')
      return 'send_datetime_utc'
    }

    // Fall back to old column name
    const { error: oldError } = await supabase
      .from('issues')
      .select('send_datetime_local')
      .limit(1)

    if (!oldError) {
      cachedColumnName = 'send_datetime_local'
      console.log('✅ Schema: Using send_datetime_local (old)')
      return 'send_datetime_local'
    }

    // If both fail, default to new but log warning
    console.warn('⚠️  Could not detect column, defaulting to send_datetime_utc')
    cachedColumnName = 'send_datetime_utc'
    return 'send_datetime_utc'
  } catch (error) {
    console.error('Schema detection error:', error)
    cachedColumnName = 'send_datetime_utc'
    return 'send_datetime_utc'
  }
}

/**
 * Build a select statement with the correct column name
 * Usage: `supabase.from('issues').select(selectWithDatetimeColumn())`
 */
export async function selectWithDatetimeColumn(): Promise<string> {
  const column = await detectSendDatetimeColumn()
  // Return the column name, which will be used in select()
  return `*, ${column}`
}

/**
 * Get the correct column name for this database
 */
export async function getDatetimeColumnName(): Promise<string> {
  return detectSendDatetimeColumn()
}

/**
 * Normalize issue data to always use send_datetime_utc in the object
 * This ensures consistent field names throughout the app
 */
export function normalizeIssueData(issue: any): any {
  if (!issue) return issue

  const column = cachedColumnName || 'send_datetime_utc'
  
  // If the issue has the old column name, rename it
  if ('send_datetime_local' in issue && !('send_datetime_utc' in issue)) {
    return {
      ...issue,
      send_datetime_utc: issue.send_datetime_local,
      // Keep old field for debugging if needed
      _original_column: 'send_datetime_local'
    }
  }

  return issue
}

/**
 * Normalize an array of issues
 */
export function normalizeIssuesArray(issues: any[]): any[] {
  return issues.map(normalizeIssueData)
}
