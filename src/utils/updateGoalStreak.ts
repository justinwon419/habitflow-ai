import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { startOfDay, endOfDay, format } from 'date-fns';

/**
 * Updates the user's goal streak for today.
 * A day "passes" if the user completes >=80% of active habits.
 * If passed, increments streak; otherwise resets to 0.
 * Returns the new streak count.
 */
export async function updateGoalStreak(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  // Determine today's date range
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const startDate = format(todayStart, 'yyyy-MM-dd');
  const endDate = format(todayEnd, 'yyyy-MM-dd');

  // 1. Fetch active habits for today
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, created_at')
    .eq('user_id', userId)
    .lte('created_at', endDate);
  if (habitsError) throw new Error('Failed to fetch habits: ' + habitsError.message);
  const totalHabits = habits.length;
  if (totalHabits === 0) {
    // No habits means no streak change
    return 0;
  }

  // 2. Fetch today's completions
  const { data: completions, error: compError } = await supabase
    .from('habit_completions')
    .select('habit_id')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (compError) throw new Error('Failed to fetch completions: ' + compError.message);
  const completedCount = completions.length;

  // 3. Determine if user "passed" today
  const passThreshold = 0.8;
  const passed = completedCount / totalHabits >= passThreshold;

  // 4. Fetch or create streak record
  const { data: existing, error: fetchError } = await supabase
    .from('user_goal_streak')
    .select('id, current_streak')
    .eq('user_id', userId)
    .single();
  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows
    throw new Error('Error fetching streak: ' + fetchError.message);
  }

  let newStreak = 0;
  if (existing) {
    newStreak = passed ? existing.current_streak + 1 : 0;
    const { error: updateError } = await supabase
      .from('user_goal_streak')
      .update({
        current_streak: newStreak,
        last_checked: startDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (updateError) throw new Error('Error updating streak: ' + updateError.message);
  } else {
    newStreak = passed ? 1 : 0;
    const { error: insertError } = await supabase
      .from('user_goal_streak')
      .insert({
        user_id: userId,
        current_streak: newStreak,
        last_checked: startDate,
      });
    if (insertError) throw new Error('Error inserting streak: ' + insertError.message);
  }

  return newStreak;
}
