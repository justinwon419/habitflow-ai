// app/profile/page.tsx
'use client'

import { Database } from '@/types/supabase'
import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import MobileNavBar from '@/components/MobileNavBar'
import { User as UserIcon } from 'lucide-react'

export default function ProfilePage() {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()

  const [goal, setGoal] = useState<Database['public']['Tables']['goals']['Row'] | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<Database['public']['Tables']['weekly_stats']['Row'] | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      // Active goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setGoal(goalData)

      // Latest weekly stats
      const { data: statsData } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .single()
      setWeeklyStats(statsData)
    }
    fetchData()
  }, [user, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 w-full max-w-screen-md mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="bg-[#4296F7] text-white p-3 rounded-full">
          <UserIcon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
      </div>

      {/* Account Info */}
      <section className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Info</h2>
        <p className="text-gray-700"><strong>Email:</strong> {user?.email}</p>
        <p className="text-gray-700"><strong>User ID:</strong> {user?.id}</p>
      </section>

      {/* Current Goal */}
      <section className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Goal</h2>
        {goal ? (
          <>
            <p className="text-gray-700"><strong>Title:</strong> {goal.goal_title}</p>
            <p className="text-gray-700"><strong>Timeline:</strong> {goal.timeline}</p>
            <p className="text-gray-700"><strong>Description:</strong> {goal.description}</p>
          </>
        ) : (
          <p className="text-gray-700">No goal set yet.</p>
        )}
      </section>

      {/* Latest Weekly Stats */}
      <section className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Latest Weekly Stats</h2>
        {weeklyStats ? (
          <>
            <p className="text-gray-700"><strong>Completion %:</strong> {weeklyStats.completion_pct}%</p>
            {weeklyStats.streak_count != null && (
              <p className="text-gray-700"><strong>Streak:</strong> {weeklyStats.streak_count} days</p>
            )}
            <p className="text-gray-700"><strong>Difficulty:</strong> {weeklyStats.difficulty}</p>
            <p className="text-gray-700"><strong>Summary:</strong> {weeklyStats.summary}</p>
          </>
        ) : (
          <p className="text-gray-700">No stats yet.</p>
        )}
      </section>

      {/* Settings & Support */}
      <section className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Settings & Support</h2>
        <ul className="space-y-2">
          <li>
            <a href="/settings" className="text-[#4296F7] hover:underline">Edit Profile</a>
          </li>
          <li>
            <a href="/help" className="text-[#4296F7] hover:underline">Help & Support</a>
          </li>
          <li>
            <a href="/terms" className="text-[#4296F7] hover:underline">Terms & Privacy</a>
          </li>
        </ul>
      </section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 mb-16"
      >
        Sign Out
      </button>

      {/* Mobile Nav */}
      <MobileNavBar />
    </div>
  )
}
