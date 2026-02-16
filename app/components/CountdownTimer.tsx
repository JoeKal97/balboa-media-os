'use client'

import { useState, useEffect } from 'react'
import { toZonedTime } from 'date-fns-tz'

interface CountdownTimerProps {
  sendDatetimeUtc: string // ISO string in UTC
  timezone?: string
}

const TIMEZONE = 'America/Denver'

export default function CountdownTimer({ 
  sendDatetimeUtc, 
  timezone = TIMEZONE 
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [displayTime, setDisplayTime] = useState('')

  useEffect(() => {
    const updateCountdown = () => {
      try {
        // Parse the UTC time
        const targetUtc = new Date(sendDatetimeUtc)
        
        // Validate that we have a valid date
        if (isNaN(targetUtc.getTime())) {
          console.error('Invalid sendDatetimeUtc:', sendDatetimeUtc)
          return
        }
        
        // Get current time in UTC
        const nowUtc = new Date()
        
        // Calculate difference
        const diff = targetUtc.getTime() - nowUtc.getTime()

        if (diff <= 0) {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
          setDisplayTime('Send time has passed')
          return
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        setCountdown({ days, hours, minutes, seconds })
        
        // Convert UTC to local timezone for display
        const targetLocal = toZonedTime(targetUtc, timezone)
        const displayStr = targetLocal.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
        setDisplayTime(displayStr)
      } catch (err) {
        console.error('Error computing countdown:', err)
        setDisplayTime('Error calculating send time')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [sendDatetimeUtc, timezone])

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
        Send scheduled for: {displayTime}
      </p>
    </div>
  )
}
