export type IssueStatus = 'draft' | 'in_progress' | 'ready' | 'sent'
export type SlotStatus = 'missing' | 'draft' | 'published'

export interface Publication {
  id: string
  name: string
  send_day_of_week: number // 0-6 (Sunday-Saturday)
  send_time_local: string // HH:MM
  articles_required_per_issue: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Issue {
  id: string
  publication_id: string
  issue_date: string // YYYY-MM-DD
  send_datetime_utc: string // ISO timestamp in UTC (the actual moment to send)
  status: IssueStatus
  risk_score: number
  created_at: string
  updated_at: string
}

export interface IssueArticleSlot {
  id: string
  issue_id: string
  slot_index: number
  article_title: string | null
  article_url: string | null
  status: SlotStatus
  created_at: string
  updated_at: string
}

export interface IssueChecklist {
  issue_id: string
  articles_complete: boolean
  seo_verified: boolean
  internal_links_verified: boolean
  formatted: boolean
  sent: boolean
  created_at: string
  updated_at: string
}
