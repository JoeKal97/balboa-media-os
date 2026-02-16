/**
 * App Initialization
 * 
 * Runs once at startup to detect the database schema
 * and initialize the schema adapter.
 */

import { detectSendDatetimeColumn } from '@/lib/schemaAdapter'

/**
 * Initialize the app by detecting the schema
 * Call this early in the app lifecycle
 */
export async function initializeApp() {
  try {
    console.log('🚀 Initializing Balboa Media OS...')
    const column = await detectSendDatetimeColumn()
    console.log(`✅ Database schema initialized (column: ${column})`)
  } catch (error) {
    console.warn('⚠️  Schema initialization warning:', error)
    // Don't block app startup if detection fails, will use default
  }
}
