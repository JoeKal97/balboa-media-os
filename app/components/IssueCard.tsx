'use client'

import { useState, useCallback, useEffect } from 'react'
import { Publication, Issue, IssueArticleSlot, IssueChecklist } from '@/lib/schema'
import { formatDistanceToNow } from 'date-fns'
import {
  updateSlot,
  updateChecklist,
  setIssueStatus,
  syncFromLetterman,
} from '@/lib/actions'
import CountdownTimer from './CountdownTimer'
import RiskBadge from './RiskBadge'

interface IssueCardProps {
  publication: Publication
  issue: Issue
  issueDetails: any
  onRefresh: () => Promise<void>
}

export default function IssueCard({
  publication,
  issue,
  issueDetails,
  onRefresh,
}: IssueCardProps) {
  const [slots, setSlots] = useState<IssueArticleSlot[]>(issueDetails.slots || [])
  const [checklist, setChecklist] = useState<IssueChecklist>(issueDetails.checklist || {})
  const [currentIssue, setCurrentIssue] = useState(issue)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // Sync internal state when props change (e.g., user selects different publication)
  useEffect(() => {
    setCurrentIssue(issue)
    setSlots(issueDetails.slots || [])
    setChecklist(issueDetails.checklist || {})
  }, [issue, issueDetails])

  const handleSlotChange = useCallback(
    async (slotId: string, field: string, value: any) => {
      setSaving(true)
      try {
        const updates: any = { [field]: value }
        
        // Auto-set to "draft" when URL is pasted and status is "missing"
        if (field === 'article_url' && value && value.trim()) {
          const slot = slots.find(s => s.id === slotId)
          if (slot?.status === 'missing') {
            updates.status = 'draft'
          }
        }
        
        await updateSlot(slotId, updates)
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId ? { ...s, ...updates } : s
          )
        )
        await onRefresh()
      } catch (error) {
        console.error('Error updating slot:', error)
      } finally {
        setSaving(false)
      }
    },
    [onRefresh, slots]
  )

  const handleChecklistChange = useCallback(
    async (field: string, value: boolean) => {
      setSaving(true)
      try {
        await updateChecklist(currentIssue.id, { [field]: value })
        setChecklist((prev: IssueChecklist) => ({ ...prev, [field]: value }))
        await onRefresh()
      } catch (error) {
        console.error('Error updating checklist:', error)
      } finally {
        setSaving(false)
      }
    },
    [currentIssue.id, onRefresh]
  )

  const handleMarkReady = useCallback(async () => {
    const hasAllChecks =
      checklist.articles_complete &&
      checklist.seo_verified &&
      checklist.internal_links_verified &&
      checklist.formatted

    const hasNoMissing = slots.every((s) => s.status !== 'missing')

    if (!hasAllChecks || !hasNoMissing) {
      alert('Cannot mark ready: Complete checklist and fill all slots')
      return
    }

    setSaving(true)
    try {
      await setIssueStatus(currentIssue.id, 'ready')
      setCurrentIssue({ ...currentIssue, status: 'ready' })
      await onRefresh()
    } catch (error) {
      console.error('Error marking ready:', error)
    } finally {
      setSaving(false)
    }
  }, [checklist, slots, currentIssue, onRefresh])

  const handleMarkSent = useCallback(async () => {
    if (currentIssue.status !== 'ready') {
      alert('Issue must be marked "ready" before sending')
      return
    }

    setSaving(true)
    try {
      await setIssueStatus(currentIssue.id, 'sent')
      setCurrentIssue({ ...currentIssue, status: 'sent' })
      await onRefresh()
    } catch (error) {
      console.error('Error marking sent:', error)
    } finally {
      setSaving(false)
    }
  }, [currentIssue, onRefresh])

  const handleSyncLetterman = useCallback(async () => {
    setSyncing(true)
    setSyncMessage('')
    try {
      const result = await syncFromLetterman(currentIssue.id)
      setSyncMessage(result.message)
      await onRefresh()
      
      // Clear message after 3 seconds
      setTimeout(() => setSyncMessage(''), 3000)
    } catch (error) {
      console.error('Error syncing from Letterman:', error)
      setSyncMessage('Error syncing from Letterman')
      setTimeout(() => setSyncMessage(''), 3000)
    } finally {
      setSyncing(false)
    }
  }, [currentIssue.id, onRefresh])

  const canMarkReady =
    currentIssue.status === 'draft' &&
    checklist.articles_complete &&
    checklist.seo_verified &&
    checklist.internal_links_verified &&
    checklist.formatted &&
    slots.every((s) => s.status !== 'missing')

  const canMarkSent = currentIssue.status === 'ready'

  const missingCount = slots.filter((s) => s.status === 'missing').length

  return (
    <div className="space-y-6">
      {/* 🚨 OVERDUE WARNING */}
      {currentIssue.is_overdue && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-red-800">
              ⚠️ OVERDUE: This issue's send date has passed!
            </span>
          </div>
          <p className="mt-1 text-sm text-red-700">
            The scheduled send time ({currentIssue.issue_date}) has passed, but this issue was not marked as "Sent". 
            Click "Mark Sent" once sent, or update the status if this was sent through another method.
          </p>
        </div>
      )}

      {/* Next Issue Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Next Issue: {publication.name}
            </h2>
            <p className="text-sm text-slate-600">
              Issue date: {currentIssue.issue_date}
              {currentIssue.is_overdue && (
                <span className="ml-2 font-bold text-red-600">(OVERDUE)</span>
              )}
            </p>
          </div>
          <RiskBadge risk={currentIssue.risk_score} />
        </div>

        {/* Countdown */}
        <CountdownTimer sendDatetimeUtc={currentIssue.send_datetime_utc} />

        {/* Status Badge */}
        <div className="mt-4">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
              currentIssue.status === 'sent'
                ? 'bg-green-100 text-green-800'
                : currentIssue.status === 'ready'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {currentIssue.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Slots Panel */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Articles ({publication.articles_required_per_issue} required, {missingCount} missing)
          </h3>
          <button
            onClick={handleSyncLetterman}
            disabled={syncing || saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync from Letterman'}
          </button>
        </div>

        {syncMessage && (
          <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-900">
            {syncMessage}
          </div>
        )}

        <div className="space-y-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">
                  Slot {slot.slot_index}
                </span>
                <select
                  value={slot.status}
                  onChange={(e) =>
                    handleSlotChange(slot.id, 'status', e.target.value)
                  }
                  disabled={saving}
                  className={`rounded border px-2 py-1 text-sm ${
                    slot.status === 'missing'
                      ? 'border-red-300 bg-red-50'
                      : slot.status === 'draft'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-green-300 bg-green-50'
                  } disabled:opacity-50`}
                >
                  <option value="missing">Missing</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Article title"
                  value={slot.article_title || ''}
                  onChange={(e) =>
                    handleSlotChange(slot.id, 'article_title', e.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                />
                <input
                  type="url"
                  placeholder="Article URL"
                  value={slot.article_url || ''}
                  onChange={(e) =>
                    handleSlotChange(slot.id, 'article_url', e.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist Panel */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Completion Checklist
        </h3>

        <div className="space-y-3">
          {[
            {
              key: 'articles_complete',
              label: 'All articles created & uploaded',
            },
            { key: 'seo_verified', label: 'SEO verified (keywords, links, etc)' },
            {
              key: 'internal_links_verified',
              label: 'Internal links verified',
            },
            { key: 'formatted', label: 'Formatted & ready to send' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(checklist[key as keyof IssueChecklist])}
                onChange={(e) => handleChecklistChange(key, e.target.checked)}
                disabled={saving || currentIssue.status === 'sent'}
                className="h-4 w-4 rounded border-slate-300 disabled:opacity-50"
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleMarkReady}
          disabled={!canMarkReady || saving}
          className={`rounded-lg px-4 py-2 font-medium text-white ${
            canMarkReady
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-slate-300 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {saving ? 'Saving...' : 'Mark Ready'}
        </button>

        <button
          onClick={handleMarkSent}
          disabled={!canMarkSent || saving}
          className={`rounded-lg px-4 py-2 font-medium text-white ${
            canMarkSent
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-slate-300 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {saving ? 'Saving...' : 'Mark Sent'}
        </button>
      </div>
    </div>
  )
}
