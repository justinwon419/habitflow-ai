import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase' // ✅ use the types you just generated

export const supabase = createBrowserSupabaseClient<Database>()