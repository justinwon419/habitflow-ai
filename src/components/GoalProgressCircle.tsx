'use client'

import { differenceInWeeks, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'

interface GoalProgressCircleProps {
  createdAt: string // ISO string from Supabase
  timeline: string // e.g. '3 months', '6 weeks', '90 days'
}

export default function GoalProgressCircle({ createdAt, timeline }: GoalProgressCircleProps) {
  const [currentWeek, setCurrentWeek] = useState(0)
  const [totalWeeks, setTotalWeeks] = useState(1)

  useEffect(() => {
    const start = parseISO(createdAt)
    const now = new Date()
    const weeksElapsed = differenceInWeeks(now, start) + 1
    setCurrentWeek(weeksElapsed)

    const weeks = parseTimelineToWeeks(timeline)
    setTotalWeeks(weeks)
  }, [createdAt, timeline])

  const progress = Math.min((currentWeek / totalWeeks) * 100, 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#367BDB"
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${(progress * 282.6) / 100}, 282.6`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-sm">
          <span className="font-bold text-m text-[#367BDB]">Week {currentWeek}</span>
          <span className="text-gray-600 text-xs">of {totalWeeks}</span>
        </div>
      </div>
    </div>
  )
}

// Converts timeline string into estimated weeks
function parseTimelineToWeeks(timeline: string): number {
  const lower = timeline.toLowerCase()
  const match = lower.match(/(\d+)\s*(week|month|day|year)s?/)

  if (!match) return 1

  const amount = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 'day': return Math.ceil(amount / 7)
    case 'week': return amount
    case 'month': return amount * 4
    case 'year': return amount * 52
    default: return 1
  }
}
