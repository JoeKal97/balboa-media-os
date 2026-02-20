import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PublicationMetric } from '@/lib/actions'

interface PublicationTableProps {
  publications: PublicationMetric[]
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus
}

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  flat: 'text-slate-400'
}

export default function PublicationTable({ publications }: PublicationTableProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">Newsletter Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Newsletter
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Subscribers
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Organic Traffic
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                New This Week
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Open Rate
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {publications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No publication data yet. Metrics will appear here after first weekly tracking session.
                </td>
              </tr>
            ) : (
              publications.map((pub) => {
                const TrendIcon = trendIcons[pub.trend]
                return (
                  <tr key={pub.publicationId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {pub.publicationName}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700">
                      {formatNumber(pub.totalSubscribers)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700">
                      {formatNumber(pub.organicTraffic)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700">
                      {pub.newSubscribers > 0 ? '+' : ''}{pub.newSubscribers}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700">
                      {pub.openRate ? `${pub.openRate}%` : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TrendIcon className={`mx-auto h-4 w-4 ${trendColors[pub.trend]}`} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
