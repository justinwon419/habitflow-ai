// app/profile/page.tsx
'use client'

import { Database } from '@/types/supabase'
import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import MobileNavBar from '@/components/MobileNavBar'
import { User as UserIcon } from 'lucide-react'
import { calculateWeeklyScore } from '@/utils/calculateWeeklyScore'
import { startOfWeek, format } from 'date-fns'

export default function ProfilePage() {
  const supabase = useSupabaseClient<Database>()
  const user     = useUser()

  const [goal, setGoal] = useState<Database['public']['Tables']['goals']['Row'] | null>(null)
  const [stats, setStats] = useState<Database['public']['Tables']['weekly_stats']['Row'] | null>(null)
  const [goalStreak, setGoalStreak] = useState<number>(0)
  const [maxHabitStreak, setMaxHabitStreak] = useState<number>(0)

  useEffect(() => {
    const fetchAndSyncStats = async () => {
      if (!user) return

      // 1) Load current goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setGoal(goalData)

      // 2) Compute live week-to-date %
      const livePct = await calculateWeeklyScore(supabase, user.id)

      // 3) Upsert weekly_stats
      const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
      const weekISO = thisWeekStart.toISOString()
      let updatedStats = null as typeof stats

      const { data: statsData } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekISO)
        .single()

      if (statsData) {
        if (statsData.completion_pct !== livePct) {
          const { data: upd } = await supabase
            .from('weekly_stats')
            .update({ completion_pct: livePct })
            .eq('id', statsData.id)
            .select()
            .single()
          updatedStats = upd
        } else {
          updatedStats = statsData
        }
      } else {
        const { data: ins } = await supabase
          .from('weekly_stats')
          .insert({
            user_id: user.id,
            week_start: weekISO,
            completion_pct: livePct,
            difficulty: 'same',
            summary: '',
          })
          .select()
          .single()
        updatedStats = ins
      }
      setStats(updatedStats)

      // 4) Fetch latest goal streak
      const { data: streakRec } = await supabase
        .from('user_goal_streak')
        .select('current_streak')
        .eq('user_id', user.id)
        .order('last_checked', { ascending: false })
        .limit(1)
        .single()
      setGoalStreak(streakRec?.current_streak ?? 0)

      // 5) Compute max habit streak this week
      const weekStartStr = format(thisWeekStart, 'yyyy-MM-dd')
      const todayStr     = format(new Date(), 'yyyy-MM-dd')
      const { data: complData } = await supabase
        .from('habit_completions')
        .select('habit_id')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', todayStr)
      const completions = complData ?? []

      const counts: Record<string, number> = {}
      completions.forEach(c => {
        if (c.habit_id) counts[c.habit_id] = (counts[c.habit_id] || 0) + 1
      })
      const maxCount = Object.values(counts).length
        ? Math.max(...Object.values(counts))
        : 0
      setMaxHabitStreak(maxCount)
    }
    fetchAndSyncStats()
  }, [user, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-600 relative">
        {/* Avatar */}
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-1/2">
          <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon className="text-gray-500 w-16 h-16" />
            </div>
          </div>
        </div>
      </div>

      <main className="mt-20 max-w-3xl mx-auto px-6 pb-24">
        {/* Name & Email */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{user?.email}</h1>
          <p className="text-gray-600 mt-1">ID: {user?.id}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-sm text-gray-500 uppercase tracking-wide">Weekly Score</h2>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              {stats?.completion_pct ?? 0}%
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-sm text-gray-500 uppercase tracking-wide">Goal Streak</h2>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {goalStreak}d
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-sm text-gray-500 uppercase tracking-wide">Max Habit Streak</h2>
            <p className="mt-2 text-2xl font-semibold text-indigo-600">
              {maxHabitStreak}d
            </p>
          </div>
        </div>

        {/* Current Goal */}
        <section className="bg-white rounded-xl shadow p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Goal</h2>
          {goal ? (
            <div className="space-y-2 text-gray-700">
              <p><span className="font-semibold">Title:</span> {goal.goal_title}</p>
              <p><span className="font-semibold">Timeline:</span> {goal.timeline}</p>
              <p><span className="font-semibold">Description:</span> {goal.description}</p>
            </div>
          ) : (
            <p className="text-gray-500">No goal set yet.</p>
          )}
        </section>

        {/* Settings & Support */}
        <section className="bg-white rounded-xl shadow p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Settings & Support</h2>
          <ul className="space-y-3 text-blue-600">
            <li><a className="hover:underline">Edit Profile (not ready yet)</a></li>
            <li><a className="hover:underline">Help & Support (not ready yet)</a></li>
            <li><a className="hover:underline">Terms & Privacy (not ready yet)</a></li>
            {/*<li><a href="/settings" className="hover:underline">Edit Profile</a></li>
            <li><a href="/help" className="hover:underline">Help & Support</a></li>
            <li><a href="/terms" className="hover:underline">Terms & Privacy</a></li>*/}
          </ul>
        </section>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full transition"
          >
            Sign Out
          </button>
        </div>
      </main>

      {/* Mobile Nav */}
      <MobileNavBar />
    </div>
  )
}
