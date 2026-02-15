'use client'

import { Issue } from '@/lib/schema'
import { formatDistanceToNow, format } from 'date-fns'

interface IssueHistoryProps {
  issues: Issue[]
}

export default function IssueHistory({ issues }: IssueHistoryProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Issue History (Last 8)
      </h3>

      {issues.length === 0 ? (
        <p className="text-sm text-slate-600">No previous issues</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Issue Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Send DateTime
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Risk
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {issue.issue_date}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {format(new Date(issue.send_datetime_local), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
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
                  <td className="px-4 py-2">
                    <span
                      className={`font-medium ${
                        issue.risk_score >= 4
                          ? 'text-red-600'
                          : issue.risk_score >= 2
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {issue.risk_score}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {formatDistanceToNow(new Date(issue.updated_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
