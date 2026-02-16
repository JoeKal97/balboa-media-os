'use client'

import { Publication, Issue } from '@/lib/schema'
import { format, formatDistance } from 'date-fns'
import RiskBadge from './RiskBadge'

interface PlanningData {
  publication: Publication
  issue: Issue
  details: any
}

interface PlanningViewProps {
  data: PlanningData[]
}

export default function PlanningView({ data }: PlanningViewProps) {
  const sortedData = [...data].sort((a, b) => {
    const aTime = new Date(a.issue.send_datetime_utc).getTime()
    const bTime = new Date(b.issue.send_datetime_utc).getTime()
    return aTime - bTime
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Weekly Planning</h1>
        <p className="mt-1 text-slate-600">
          Overview of all publication send schedules and their completion status
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left font-semibold text-slate-900">
                Publication
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">
                Next Send
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">
                Countdown
              </th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">
                Missing Slots
              </th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">
                Status
              </th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(({ publication, issue, details }) => {
              const missingSlots = (details.slots || []).filter(
                (s: any) => s.status === 'missing'
              ).length

              return (
                <tr
                  key={issue.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {publication.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(issue.send_datetime_utc), 'EEE, MMM dd @ HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDistance(new Date(issue.send_datetime_utc), new Date(), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        missingSlots > 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {missingSlots} / {publication.articles_required_per_issue}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        issue.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : issue.status === 'ready'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {issue.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <RiskBadge risk={issue.risk_score} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-3 font-semibold text-slate-900">Status Guide</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="font-medium text-slate-900">Status Badges</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>
                <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                  DRAFT
                </span>{' '}
                — Work in progress
              </li>
              <li>
                <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  READY
                </span>{' '}
                — All items complete
              </li>
              <li>
                <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                  SENT
                </span>{' '}
                — Newsletter published
              </li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900">Risk Levels</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>
                <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                  GREEN
                </span>{' '}
                — All good (0-1)
              </li>
              <li>
                <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                  YELLOW
                </span>{' '}
                — Warning (2-3)
              </li>
              <li>
                <span className="inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                  RED
                </span>{' '}
                — Critical (4+)
              </li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900">Missing Slots</p>
            <p className="mt-2 text-sm text-slate-600">
              Indicates how many article slots still need content. A publication is "at
              risk" if any articles are missing &lt;24 hours before send.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
