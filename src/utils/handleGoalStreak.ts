import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { format, startOfDay } from 'date-fns'

/**
 * Consolidated handler for the user's goal streak.
 * - Live mode: call after each completion toggle to increment once when passing 80%.
 * - End-of-day mode: call once (e.g., on login or cron) to verify and reset if below 80%.
 *
 * Returns the updated streak count.
 */
export async function handleGoalStreak(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
  console.log('[handleGoalStreak] running for', userId, 'on', today)

  // 1. Fetch active habits
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, created_at')
    .eq('user_id', userId)
  if (habitsError) throw habitsError
  const totalHabits = habits?.length ?? 0
  console.log('[handleGoalStreak] totalHabits=', totalHabits)
  if (totalHabits === 0) return 0

  // 2. Fetch today's completions
  const { data: completions, error: compError } = await supabase
    .from('habit_completions')
    .select('habit_id')
    .eq('user_id', userId)
    .gte('date', today)
    .lte('date', today)
  if (compError) throw compError
  const completedCount = completions?.length ?? 0
  console.log('[handleGoalStreak] completedCount=', completedCount)

  // 3. Determine if passed threshold
  const passed = completedCount / totalHabits >= 0.8
  console.log('[handleGoalStreak] passed=', passed)

  // 4. Load existing streak entry (latest)
  const { data: recordArr, error: recArrError } = await supabase
    .from('user_goal_streak')
    .select('id, current_streak, last_checked')
    .eq('user_id', userId)
    .order('last_checked', { ascending: false })
    .limit(1)
  if (recArrError) throw recArrError
  const record = recordArr?.[0] ?? null

  let newStreak = 0

  // If no record yet:
  if (!record) {
    if (!passed) {
      // Don't create a record until first pass
      console.log('[handleGoalStreak] no record & not passed → skip')
      return 0
    }
    // First pass of the day → start streak
    newStreak = 1
    console.log('[handleGoalStreak] inserting new streak', newStreak)
    const { error: insertError } = await supabase
      .from('user_goal_streak')
      .insert({ user_id: userId, current_streak: newStreak, last_checked: today })
    if (insertError) throw insertError
    return newStreak
  }

  // If already handled today, just return
  if (record.last_checked === today) {
    console.log('[handleGoalStreak] already handled today, returning', record.current_streak)
    return record.current_streak
  }

  // Not yet handled today:
  if (!passed) {
    // Skip mid-day resets; end-of-day will handle
    console.log('[handleGoalStreak] record exists & not passed → skip update')
    return record.current_streak
  }

  // Passed threshold → increment
  newStreak = record.current_streak + 1
  console.log('[handleGoalStreak] updating streak to', newStreak)
  const { error: updateError } = await supabase
    .from('user_goal_streak')
    .update({ current_streak: newStreak, last_checked: today, updated_at: new Date().toISOString() })
    .eq('id', record.id)
  if (updateError) throw updateError

  return newStreak
  if (record) {
    // Already handled today?
    if (record.last_checked === today) {
      console.log('[handleGoalStreak] already handled today, returning', record.current_streak)
      return record.current_streak
    }
    // Not yet handled: increment or reset
    newStreak = passed ? record.current_streak + 1 : 0
    console.log('[handleGoalStreak] updating streak to', newStreak)
    const { error: updateError } = await supabase
      .from('user_goal_streak')
      .update({ current_streak: newStreak, last_checked: today, updated_at: new Date().toISOString() })
      .eq('id', record.id)
    if (updateError) {
      console.error('[handleGoalStreak] updateError', updateError)
      throw updateError
    }
  } else {
    // First-time insertion
    newStreak = passed ? 1 : 0
    console.log('[handleGoalStreak] inserting new streak', newStreak)
    const { error: insertError } = await supabase
      .from('user_goal_streak')
      .insert({ user_id: userId, current_streak: newStreak, last_checked: today })
    if (insertError) {
      console.error('[handleGoalStreak] insertError', insertError)
      throw insertError
    }
  }

  return newStreak
}
