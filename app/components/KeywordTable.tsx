import { ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react'
import { KeywordRanking } from '@/lib/actions'

interface KeywordTableProps {
  keywords: KeywordRanking[]
}

export default function KeywordTable({ keywords }: KeywordTableProps) {
  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-slate-400" />
    if (change < 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (change > 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-slate-400" />
  }

  const getChangeText = (change: number | null) => {
    if (change === null) return '—'
    if (change < 0) return `${change}` // Already negative
    if (change > 0) return `+${change}`
    return '0'
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">Keyword Rankings</h3>
        <p className="text-sm text-slate-600">Track target keyword positions in Google SERP</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Keyword
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Target Page
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Position
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Volume
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Article
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {keywords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No keyword data yet. Add target keywords to start tracking.
                  <div className="mt-2 text-sm">
                    <a 
                      href="/api/analytics/file?type=keywords" 
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Open keywords spreadsheet →
                    </a>
                  </div>
                </td>
              </tr>
            ) : (
              keywords.map((kw) => (
                <tr key={kw.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {kw.keyword}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {kw.targetPage}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {kw.position ? (
                      <span className={`font-semibold ${
                        kw.position <= 3 ? 'text-green-600' :
                        kw.position <= 10 ? 'text-blue-600' :
                        'text-slate-700'
                      }`}>
                        #{kw.position}
                      </span>
                    ) : (
                      <span className="text-slate-400">Not ranked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getChangeIcon(kw.change)}
                      <span className={
                        kw.change && kw.change < 0 ? 'text-green-600' :
                        kw.change && kw.change > 0 ? 'text-red-600' :
                        'text-slate-400'
                      }>
                        {getChangeText(kw.change)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-700">
                    {kw.searchVolume?.toLocaleString() || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {kw.articleUrl ? (
                      <a
                        href={kw.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">Not linked</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
