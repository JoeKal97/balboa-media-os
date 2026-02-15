'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  sendDateTime: string
}

export default function CountdownTimer({ sendDateTime }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const target = new Date(sendDateTime)
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [sendDateTime])

  return (
    <div className="my-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
      <p className="mb-3 text-sm font-medium text-slate-700">
        Send in:
      </p>
      <div className="flex gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">
            {countdown.days}
          </div>
          <div className="text-xs font-medium text-slate-600">DAYS</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">
            {String(countdown.hours).padStart(2, '0')}
          </div>
          <div className="text-xs font-medium text-slate-600">HOURS</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">
            {String(countdown.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs font-medium text-slate-600">MINS</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">
            {String(countdown.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs font-medium text-slate-600">SECS</div>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Send scheduled for: {new Date(sendDateTime).toLocaleString()}
      </p>
    </div>
  )
}
