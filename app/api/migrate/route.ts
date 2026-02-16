/**
 * Migration API Endpoint
 * POST /api/migrate?token=<service-role-key>
 * 
 * Securely executes pending database migrations.
 * Requires the Supabase service role key as a query parameter.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing migration token' },
        { status: 401 }
      )
    }
    
    // Security: Only accept service role key (contains "service_role" in payload)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    if (payload.role !== 'service_role') {
      return NextResponse.json({ error: 'Invalid token role' }, { status: 401 })
    }

    // Create client with service role
    const supabase = createClient(supabaseUrl, token)
    
    console.log('🔄 Running migration via API endpoint...')
    
    // Try direct RPC execution first
    try {
      // Some Supabase instances have sql execution functions available
      const { data, error } = await supabase.rpc('sql', {
        query: `ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;`
      })
      
      if (!error) {
        console.log('✅ Migration executed via RPC')
        return NextResponse.json({ 
          success: true, 
          message: 'Column renamed: send_datetime_local → send_datetime_utc'
        })
      }
    } catch (e) {
      // RPC not available, try next approach
    }
    
    // Try to verify the column already exists with the new name
    const { data: testData, error: testError } = await supabase
      .from('issues')
      .select('send_datetime_utc')
      .limit(1)
    
    if (!testError) {
      // Migration already completed
      return NextResponse.json({
        success: true,
        message: 'Migration already applied - column send_datetime_utc exists',
        alreadyDone: true
      })
    }
    
    // If we get here, we couldn't execute the migration via available APIs
    return NextResponse.json(
      {
        error: 'Migration requires manual DDL execution',
        instructions: 'Go to Supabase SQL editor and run: ALTER TABLE issues RENAME COLUMN send_datetime_local TO send_datetime_utc;',
        url: 'https://app.supabase.com/project/cbjjskzwcufpjceygimf/sql/new'
      },
      { status: 503 }
    )
    
  } catch (error) {
    console.error('Migration endpoint error:', error)
    return NextResponse.json(
      { error: 'Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
