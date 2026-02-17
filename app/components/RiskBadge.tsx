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

  if (risk >= 6) {
    bgColor = 'bg-red-100'
    textColor = 'text-red-800'
    label = 'RED'
    tooltip = 'Critical: 2+ conditions met within 3 days of deadline. Auto-creating articles...'
  } else if (risk >= 2) {
    bgColor = 'bg-yellow-100'
    textColor = 'text-yellow-800'
    label = 'YELLOW'
    tooltip = 'Warning: 2+ conditions met within 3 days. Review needed.'
  } else if (risk === 0) {
    tooltip = 'All good! More than 3 days until deadline or all conditions met.'
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
