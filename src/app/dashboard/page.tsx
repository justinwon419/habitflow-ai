'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs'

type Habit = {
  id: string
  title: string
  created_at: string
}

export default function DashboardPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabit, setNewHabit] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Session:', session)  // <-- add this line
        if (!session) {
        router.push('/login')
        } else {
        setSession(session)
        setLoading(false)
        fetchHabits(session.user.id)
        }
    })
  }, [router, supabase])


  async function fetchHabits(user_id: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching habits:', error)
    } else if (data) {
      setHabits(data)
    }
  }

  async function handleAddHabit() {
    if (!newHabit.trim()) return
    if (!session) return

    const { data, error } = await supabase
      .from('habits')
      .insert([{ title: newHabit, user_id: session.user.id }])

    if (error) {
      console.error('Error adding habit:', error)
    } else if (data) {
      setHabits([data[0], ...habits])
      setNewHabit('')
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            {habit.title} (Created at: {new Date(habit.created_at).toLocaleDateString()})
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="New habit"
        value={newHabit}
        onChange={(e) => setNewHabit(e.target.value)}
      />
      <button onClick={handleAddHabit}>Add Habit</button>
    </div>
  )
}
