import { TrendingUp, TrendingDown, Minus, Users, DollarSign, BarChart3, Globe } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  trend: 'up' | 'down' | 'flat'
  icon: 'users' | 'dollar' | 'traffic' | 'authority'
}

const icons = {
  users: Users,
  dollar: DollarSign,
  traffic: BarChart3,
  authority: Globe
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus
}

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  flat: 'text-slate-500'
}

export default function KPICard({ title, value, subtitle, trend, icon }: KPICardProps) {
  const Icon = icons[icon]
  const TrendIcon = trendIcons[trend]

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <TrendIcon className={`h-4 w-4 ${trendColors[trend]}`} />
        <span className={`text-sm ${trendColors[trend]}`}>{subtitle}</span>
      </div>
    </div>
  )
}
