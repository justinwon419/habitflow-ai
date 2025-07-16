import { SupabaseClient } from '@supabase/supabase-js'
import { startOfWeek } from 'date-fns'
import { Database } from '@/types/supabase'

export async function saveDifficultyOverride(
  supabase: SupabaseClient<Database>,
  userId: string,
  override: 'easier' | 'same' | 'harder'
) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }) // Sunday

  const { error } = await supabase
    .from('weekly_difficulty_overrides')
    .upsert([
      {
        user_id: userId,
        week_start: weekStart.toISOString().split('T')[0],
        override,
      },
    ], { onConflict: 'user_id,week_start' })

  if (error) {
    console.error('Failed to save difficulty override:', error)
    throw error
  }
}
