import { Database } from '@/types/supabase'

export type Habit = Database['public']['Tables']['habits']['Row']
export type Completion = Database['public']['Tables']['habit_completions']['Row']
