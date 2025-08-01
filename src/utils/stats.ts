import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { Habit, Completion } from '@/types/db'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export function getWeeklyStats(
  habits: Habit[],
  completions: Completion[],
  weekDates: string[]
) {
  const total = habits.length * weekDates.length
  let completed = 0
  const streaks: Record<string, number> = {}

  for (const habit of habits) {
    let streak = 0
    for (const date of weekDates) {
      const isCompleted = completions.some(
        c => c.habit_id === habit.id && c.date.startsWith(date)
      )
      if (isCompleted) {
        completed++
        streak++
      } else {
        streak = 0
      }
      streaks[habit.id] = Math.max(streaks[habit.id] || 0, streak)
    }
  }

  const completionRate = total ? Math.round((completed / total) * 100) : 0
  const biggestStreak = Math.max(...Object.values(streaks), 0)

  return {
    completionRate,
    totalCompletions: completed,
    maxPossible: total,
    biggestStreak,
  }
}

export async function calculateWeeklyScore(supabase: SupabaseClient <Database>, userId: string, weekStart?: Date) {
  const start = startOfWeek(weekStart ?? new Date(), { weekStartsOn: 0 })
  const end = endOfWeek(start, { weekStartsOn: 0 })

  const startDate = format(start, 'yyyy-MM-dd')
  const endDate = format(end, 'yyyy-MM-dd')

  // Fetch habits
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)

  if (habitsError || !habits) {
    throw new Error('Failed to fetch habits')
  }
  
  const habitIds = habits.map(h => h.id)

  if (habitIds.length === 0) return 0
  
  // Fetch completions
  const { data: completions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('habit_id, date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (completionsError || !completions) {
    throw new Error('Failed to fetch completions')
  }

  const totalPossible = habitIds.length * 7
  const completed = completions.length
  const score = Math.round((completed / totalPossible) * 100)

  return Math.min(score, 100)
}
