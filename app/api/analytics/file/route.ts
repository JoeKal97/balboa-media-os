import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') as 'keywords' | 'traffic' | 'backlinks' | null

  if (!type) {
    return NextResponse.json({ error: 'Type parameter required' }, { status: 400 })
  }

  const fileMap = {
    keywords: 'keywords-weekly.csv',
    traffic: 'traffic-weekly.csv',
    backlinks: 'backlinks-monthly.csv'
  }

  const filename = fileMap[type]
  const filePath = join(process.cwd(), '..', '..', 'tracking', filename)

  try {
    const content = readFileSync(filePath, 'utf-8')
    
    // Return as plain text (can be opened in browser or downloaded)
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })
  } catch (error) {
    // If file doesn't exist, return empty CSV with headers
    const headers = {
      keywords: 'keyword,article_url,target_page,position,notes\n',
      traffic: 'date,publication,organic_traffic,new_subscribers,total_subscribers\n',
      backlinks: 'month,referring_domains,domain_authority,dfy_campaigns_run\n'
    }
    
    return new NextResponse(headers[type], {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })
  }
}
