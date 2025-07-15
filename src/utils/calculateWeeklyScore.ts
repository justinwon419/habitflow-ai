import { Habit } from '@/types/db'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export async function calculateWeeklyScore(supabase: any, userId: string, weekStart?: Date) {
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
  
  const habitIds = habits.map((h:Habit) => h.id)

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
