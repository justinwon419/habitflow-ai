'use client'

import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Habit = {
  id: string
  title: string
  created_at: string
}

export default function DashboardPage() {
  const supabase = createClientComponentClient()
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabit, setNewHabit] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHabits() {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setHabits([])
        setLoading(false)
        return
      }

      const user_id = session.user.id

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
      setLoading(false)
    }

    fetchHabits()
  }, [])

  async function handleAddHabit() {
    if (!newHabit.trim()) return

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user_id = session?.user.id
    if (!user_id) {
      console.error('No user session found')
      return
    }

    const { data, error } = await supabase.from('habits').insert([{ title: newHabit, user_id }])

    if (error) {
      console.error('Error adding habit:', error)
    } else if (data) {
      setHabits([data[0], ...habits])
      setNewHabit('')
    }
  }

  return (
    <div>
      {loading ? (
        <p>Loading habits...</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
