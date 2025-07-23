import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { startOfWeek } from 'date-fns'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { override } = await req.json()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })

  const { error } = await supabase
    .from('weekly_difficulty_overrides')
    .upsert({
      user_id: session.user.id,
      week_start: weekStart.toISOString(), // Uses your existing column
      override,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_start' }) // Prevent duplicates for same week

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
