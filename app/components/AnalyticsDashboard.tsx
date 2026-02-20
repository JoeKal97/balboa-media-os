'use client'

import { useState, useCallback, useEffect } from 'react'
import { KPIData, PublicationMetric, KeywordRanking, getKPISummary, getPublicationMetrics, getKeywordRankings } from '@/lib/actions'
import KPICard from './KPICard'
import PublicationTable from './PublicationTable'
import KeywordTable from './KeywordTable'
import { TrendingUp, TrendingDown, Minus, Download, ExternalLink } from 'lucide-react'

interface AnalyticsDashboardProps {
  initialKPI: KPIData
  initialPublications: PublicationMetric[]
  initialKeywords: KeywordRanking[]
}

export default function AnalyticsDashboard({
  initialKPI,
  initialPublications,
  initialKeywords
}: AnalyticsDashboardProps) {
  const [kpi, setKpi] = useState<KPIData>(initialKPI)
  const [publications, setPublications] = useState<PublicationMetric[]>(initialPublications)
  const [keywords, setKeywords] = useState<KeywordRanking[]>(initialKeywords)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'revenue'>('overview')

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    try {
      const [kpiData, pubData, keywordData] = await Promise.all([
        getKPISummary(),
        getPublicationMetrics(),
        getKeywordRankings()
      ])
      setKpi(kpiData)
      setPublications(pubData)
      setKeywords(keywordData)
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Analytics & KPI Dashboard</h2>
          <p className="text-sm text-slate-600">Business Goal: $10K/month recurring revenue</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
          <a
            href="/api/analytics/export"
            className="flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {(['overview', 'keywords', 'revenue'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Subscribers"
              value={formatNumber(kpi.totalSubscribers)}
              subtitle={`${kpi.subscriberGrowth >= 0 ? '+' : ''}${kpi.subscriberGrowth} this week`}
              trend={kpi.subscriberGrowthPercent > 0 ? 'up' : kpi.subscriberGrowthPercent < 0 ? 'down' : 'flat'}
              icon="users"
            />
            <KPICard
              title="Monthly Revenue"
              value={formatCurrency(kpi.monthlyRevenue)}
              subtitle={`${formatCurrency(kpi.revenueGap)} to $10K goal`}
              trend={kpi.monthlyRevenue > 0 ? 'up' : 'flat'}
              icon="dollar"
            />
            <KPICard
              title="Organic Traffic"
              value={formatNumber(kpi.organicTraffic)}
              subtitle={`${kpi.trafficGrowth >= 0 ? '+' : ''}${formatNumber(kpi.trafficGrowth)} this week`}
              trend={kpi.trafficGrowth > 0 ? 'up' : kpi.trafficGrowth < 0 ? 'down' : 'flat'}
              icon="traffic"
            />
            <KPICard
              title="Domain Authority"
              value={kpi.domainAuthority?.toString() || '—'}
              subtitle={`${kpi.referringDomains || 0} referring domains`}
              trend="flat"
              icon="authority"
            />
          </div>

          {/* Revenue Pipeline */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Revenue Pipeline to $10K/month</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Current: {formatCurrency(kpi.monthlyRevenue)}/mo</span>
                <span className="text-slate-600">Goal: {formatCurrency(kpi.revenueTarget)}/mo</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min((kpi.monthlyRevenue / kpi.revenueTarget) * 100, 100)}%` }}
                />
              </div>
              <div className="text-sm text-slate-600">
                {((kpi.monthlyRevenue / kpi.revenueTarget) * 100).toFixed(1)}% to goal • Need {formatCurrency(kpi.revenueGap)} more
              </div>
            </div>
          </div>

          {/* Publication Breakdown */}
          <PublicationTable publications={publications} />
        </>
      )}

      {activeTab === 'keywords' && (
        <KeywordTable keywords={keywords} />
      )}

      {activeTab === 'revenue' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Revenue Breakdown</h3>
          <p className="text-slate-600">Revenue tracking will be populated as sponsor deals close.</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-slate-700">Sponsor Revenue</span>
              <span className="font-semibold text-slate-900">{formatCurrency(0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-slate-700">Affiliate Revenue</span>
              <span className="font-semibold text-slate-900">{formatCurrency(0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-slate-700">Other Revenue</span>
              <span className="font-semibold text-slate-900">{formatCurrency(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Files Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Raw Data Files</h3>
        <p className="mb-4 text-sm text-slate-600">
          Click to view the underlying tracking spreadsheets. Update these weekly for trend analysis.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <a
            href="/api/analytics/file?type=keywords"
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50"
          >
            <div>
              <p className="font-medium text-slate-900">Keyword Rankings</p>
              <p className="text-sm text-slate-500">Weekly SERP positions</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </a>
          <a
            href="/api/analytics/file?type=traffic"
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50"
          >
            <div>
              <p className="font-medium text-slate-900">Traffic & Subscribers</p>
              <p className="text-sm text-slate-500">Growth metrics by newsletter</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </a>
          <a
            href="/api/analytics/file?type=backlinks"
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50"
          >
            <div>
              <p className="font-medium text-slate-900">SEO Health</p>
              <p className="text-sm text-slate-500">Backlinks & authority</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  )
}
