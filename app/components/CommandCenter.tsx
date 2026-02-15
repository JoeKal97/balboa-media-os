'use client'

import { useState, useCallback } from 'react'
import { Publication, Issue } from '@/lib/schema'
import { getOrCreateNextIssue, getIssueWithDetails, getIssueHistory } from '@/lib/actions'
import IssueCard from './IssueCard'
import IssueHistory from './IssueHistory'

interface CommandCenterProps {
  publications: Publication[]
  initialPublication: Publication
  initialIssue: Issue
  initialIssueDetails: any
  initialIssueHistory: Issue[]
}

export default function CommandCenter({
  publications,
  initialPublication,
  initialIssue,
  initialIssueDetails,
  initialIssueHistory,
}: CommandCenterProps) {
  const [selectedPub, setSelectedPub] = useState<Publication>(initialPublication)
  const [currentIssue, setCurrentIssue] = useState<Issue>(initialIssue)
  const [issueDetails, setIssueDetails] = useState(initialIssueDetails)
  const [issueHistory, setIssueHistory] = useState(initialIssueHistory)
  const [loading, setLoading] = useState(false)

  const handlePublicationChange = useCallback(async (pubId: string) => {
    const newPub = publications.find(p => p.id === pubId)
    if (!newPub) return

    setLoading(true)
    try {
      setSelectedPub(newPub)
      const issue = await getOrCreateNextIssue(pubId)
      const details = await getIssueWithDetails(issue.id)
      const history = await getIssueHistory(pubId)

      setCurrentIssue(issue)
      setIssueDetails(details)
      setIssueHistory(history)
    } catch (error) {
      console.error('Error loading publication:', error)
    } finally {
      setLoading(false)
    }
  }, [publications])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    try {
      const details = await getIssueWithDetails(currentIssue.id)
      const history = await getIssueHistory(selectedPub.id)

      setIssueDetails(details)
      setIssueHistory(history)
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setLoading(false)
    }
  }, [currentIssue.id, selectedPub.id])

  return (
    <div className="space-y-6">
      {/* Publication Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">
          Publication:
        </label>
        <select
          value={selectedPub.id}
          onChange={(e) => handlePublicationChange(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100"
        >
          {publications.map((pub) => (
            <option key={pub.id} value={pub.id}>
              {pub.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Next Issue Card */}
      <IssueCard
        publication={selectedPub}
        issue={currentIssue}
        issueDetails={issueDetails}
        onRefresh={handleRefresh}
      />

      {/* Issue History */}
      <IssueHistory issues={issueHistory} />
    </div>
  )
}
