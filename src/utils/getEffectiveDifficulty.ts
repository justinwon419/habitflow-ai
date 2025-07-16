import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { startOfWeek, format } from 'date-fns'
import { calculateWeeklyScore } from './stats'
import { getNextWeekDifficultyChange } from './nextDifficulty'

export async function getEffectiveDifficulty(
  supabase: SupabaseClient<Database>,
  userId: string,
  today: Date = new Date()
): Promise<'easier' | 'same' | 'harder'> {
  const weekStart = format(startOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd')

  // 1. Check if user has an override
  const { data: overrides, error: overrideError } = await supabase
    .from('weekly_difficulty_overrides')
    .select('override')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .limit(1)
    .maybeSingle()

  if (overrideError) {
    console.error('Failed to fetch difficulty override:', overrideError)
  }

  if (overrides?.override) {
    return overrides.override
  }

  // 2. Otherwise, fall back to calculated difficulty
  const score = await calculateWeeklyScore(supabase, userId, today)
  return getNextWeekDifficultyChange(score)
}
