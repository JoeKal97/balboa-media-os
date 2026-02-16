'use client'

import { useState, useCallback, useEffect } from 'react'
import { Publication, Issue, IssueArticleSlot, IssueChecklist } from '@/lib/schema'
import { formatDistanceToNow } from 'date-fns'
import {
  updateSlot,
  updateChecklist,
  setIssueStatus,
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

  const handleSlotChange = useCallback(
    async (slotId: string, field: string, value: any) => {
      setSaving(true)
      try {
        await updateSlot(slotId, { [field]: value })
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId ? { ...s, [field]: value } : s
          )
        )
        await onRefresh()
      } catch (error) {
        console.error('Error updating slot:', error)
      } finally {
        setSaving(false)
      }
    },
    [onRefresh]
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
      {/* Next Issue Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Next Issue: {publication.name}
            </h2>
            <p className="text-sm text-slate-600">
              Issue date: {currentIssue.issue_date}
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
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Articles ({publication.articles_required_per_issue} required, {missingCount} missing)
        </h3>

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
