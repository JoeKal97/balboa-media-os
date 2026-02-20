import { NextRequest, NextResponse } from 'next/server'
import { exportTrackingData } from '@/lib/actions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') as 'keywords' | 'traffic' | 'backlinks' | null

  if (!type) {
    return NextResponse.json({ error: 'Type parameter required' }, { status: 400 })
  }

  try {
    const csv = await exportTrackingData(type)
    
    // Return as downloadable CSV
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-tracking.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
