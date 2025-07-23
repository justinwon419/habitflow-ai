'use client'

import { Database } from '@/types/supabase'
import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import MobileNavBar from '@/components/MobileNavBar'

export default function ProfilePage() {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()

  const [goal, setGoal] = useState<Database['public']['Tables']['goals']['Row'] | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<Database['public']['Tables']['weekly_stats']['Row'] | null>(null)


  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      // Fetch active goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setGoal(goalData)

      // Fetch weekly stats (placeholder example)
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
    <div className="p-4 max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      {/* User Info */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="font-semibold text-lg mb-2">Account Info</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>ID:</strong> {user?.id}</p>
      </div>

      {/* Active Goal Summary */}
      {goal ? (
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="font-semibold text-lg mb-2">Current Goal</h2>
          <p><strong>Title:</strong> {goal.goal_title}</p>
          <p><strong>Timeline:</strong> {goal.timeline}</p>
          <p><strong>Description:</strong> {goal.description}</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="font-semibold text-lg mb-2">Current Goal</h2>
          <p>No goal set yet.</p>
        </div>
      )}

      {/* Weekly Stats */}
      {weeklyStats ? (
        <div className="bg-white rounded shadow p-4 mb-4">
            <h2 className="font-semibold text-lg mb-2">Latest Weekly Stats</h2>
            <p><strong>Completion Percentage:</strong> {weeklyStats.completion_pct}%</p>
            {weeklyStats.streak_count !== null && (
            <p><strong>Streak Count:</strong> {weeklyStats.streak_count}</p>
            )}
            <p><strong>Difficulty:</strong> {weeklyStats.difficulty}</p>
            <p><strong>Summary:</strong> {weeklyStats.summary}</p>
            </div>
        ) : (
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="font-semibold text-lg mb-2">Weekly Stats</h2>
          <p>No stats yet.</p>
        </div>
      )}

      {/* Settings & Support */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="font-semibold text-lg mb-2">Settings</h2>
        <ul className="space-y-2 text-sm text-blue-600">
          <li><a href="/settings">Edit Profile</a></li>
          <li><a href="/help">Help & Support</a></li>
          <li><a href="/terms">Terms & Privacy</a></li>
        </ul>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition"
      >
        Sign Out
      </button>

      <MobileNavBar />
    </div>
  )
}
