import { listPublications, getOrCreateNextIssue, getIssueWithDetails } from '@/lib/actions'
import PlanningView from '@/app/components/PlanningView'

// Force dynamic rendering - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PlanningPage() {
  try {
    const publications = await listPublications()

    const data = await Promise.all(
      publications.map(async (pub) => {
        const issue = await getOrCreateNextIssue(pub.id)
        const details = await getIssueWithDetails(issue.id)
        return {
          publication: pub,
          issue,
          details,
        }
      })
    )

    return <PlanningView data={data} />
  } catch (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          Error loading planning view
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    )
  }
}
