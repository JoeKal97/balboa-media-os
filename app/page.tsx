import { listPublications, getOrCreateNextIssue, getIssueWithDetails, getIssueHistory } from '@/lib/actions'
import CommandCenter from '@/app/components/CommandCenter'

export default async function Home() {
  try {
    const publications = await listPublications()

    if (publications.length === 0) {
      return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-900">
            No publications configured
          </h2>
          <p className="mt-2 text-sm text-yellow-700">
            Please configure publications in your Supabase database first.
          </p>
        </div>
      )
    }

    const defaultPub = publications[0]
    const nextIssue = await getOrCreateNextIssue(defaultPub.id)
    const issueDetails = await getIssueWithDetails(nextIssue.id)
    const issueHistory = await getIssueHistory(defaultPub.id)

    return (
      <CommandCenter
        publications={publications}
        initialPublication={defaultPub}
        initialIssue={nextIssue}
        initialIssueDetails={issueDetails}
        initialIssueHistory={issueHistory}
      />
    )
  } catch (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          Error loading dashboard
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    )
  }
}
