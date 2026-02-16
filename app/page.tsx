import { listPublications, getOrCreateNextIssue, getIssueWithDetails, getIssueHistory } from '@/lib/actions'
import CommandCenter from '@/app/components/CommandCenter'
import { detectSendDatetimeColumn } from '@/lib/schemaAdapter'

// Force dynamic rendering - ALWAYS fetch fresh data from Supabase
// No ISR, no caching, no pre-rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  try {
    // Initialize schema detection
    await detectSendDatetimeColumn()
    
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

    // Use Zootown Lowdown as default, fallback to first publication if not found
    const defaultPub = publications.find(p => p.name === 'Zootown Lowdown') || publications[0]
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
    let errorMessage = 'Unknown error'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message
      } else {
        errorMessage = JSON.stringify(error, null, 2)
      }
    }
    
    console.error('Dashboard error:', error)
    
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          Error loading dashboard
        </h2>
        <p className="mt-2 text-sm text-red-700 font-mono whitespace-pre-wrap break-words">
          {errorMessage}
        </p>
      </div>
    )
  }
}
