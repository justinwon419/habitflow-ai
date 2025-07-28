// src/utils/calculateWeeklyScore.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
} from 'date-fns'

/**
 * Calculates the % of habits completed so far this week.
 * Denominator = sum over each day from Sunday→today of (number of habits active on that day).
 * Numerator   = total completions in that span.
 */
export async function calculateWeeklyScore(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate?: Date
): Promise<number> {
  const today     = new Date()
  const weekStart = startOfWeek(weekStartDate ?? today, { weekStartsOn: 0 })
  const weekEnd   = endOfWeek(weekStart,     { weekStartsOn: 0 })
  const endDate   = today < weekEnd ? today : weekEnd

  // build an array ['2025-07-20','2025-07-21', …, '2025-07-26']
  const days   = eachDayOfInterval({ start: weekStart, end: endDate })
  const dayStrs = days.map(d => format(d, 'yyyy-MM-dd'))

  // 1) get all completions in [weekStart → today]
  const { data: compData, error: compErr } = await supabase
    .from('habit_completions')
    .select('date')
    .eq('user_id', userId)
    .gte('date', format(weekStart, 'yyyy-MM-dd'))
    .lte('date', format(endDate,   'yyyy-MM-dd'))
  if (compErr) throw compErr
  const completions = compData ?? []

  // 2) get all habits for this user
  const { data: habData, error: habErr } = await supabase
    .from('habits')
    .select('created_at')
    .eq('user_id', userId)
  if (habErr) throw habErr
  const habits = habData ?? []

  // 3) for each day, count how many habits existed on that date
  const totalPossible = dayStrs.reduce((sum, day) => {
    const activeCount = habits.filter(h => {
      const createdDay = format(parseISO(h.created_at!), 'yyyy-MM-dd')
      return createdDay <= day
    }).length
    return sum + activeCount
  }, 0)

  // 4) numerator = how many completions in that span
  const completed = completions.length

  // 5) compute %, clamp to [0,100]
  if (totalPossible === 0) return 0
  const pct = Math.round((completed / totalPossible) * 100)
  return Math.min(pct, 100)
}
