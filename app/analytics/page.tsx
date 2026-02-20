import { getKPISummary, getPublicationMetrics, getKeywordRankings } from '@/lib/actions'
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsPage() {
  // Fetch initial data
  const [kpi, publications, keywords] = await Promise.all([
    getKPISummary(),
    getPublicationMetrics(),
    getKeywordRankings()
  ])

  return (
    <AnalyticsDashboard
      initialKPI={kpi}
      initialPublications={publications}
      initialKeywords={keywords}
    />
  )
}
