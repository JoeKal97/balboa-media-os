'use client'

import { useState } from 'react'

interface RiskBadgeProps {
  risk: number
}

export default function RiskBadge({ risk }: RiskBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  let bgColor = 'bg-green-100'
  let textColor = 'text-green-800'
  let label = 'GREEN'
  let tooltip = 'No immediate risks'

  if (risk >= 4) {
    bgColor = 'bg-red-100'
    textColor = 'text-red-800'
    label = 'RED'
    tooltip = 'Critical: Missing slots or checklist items with <24h remaining'
  } else if (risk >= 2) {
    bgColor = 'bg-yellow-100'
    textColor = 'text-yellow-800'
    label = 'YELLOW'
    tooltip = 'Warning: Articles missing or draft, or formatting incomplete'
  }

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-block rounded-full px-4 py-2 font-semibold ${bgColor} ${textColor}`}
      >
        {label} · Risk {risk}
      </button>
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  )
}
