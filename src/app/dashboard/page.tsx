'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'

type Habit = {
  id: string
  title: string
  created_at: string
  isEditing?: boolean
  editTitle?: string
}

export default function DashboardPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchHabits() {
    if (!session?.user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      alert('Error loading habits: ' + error.message)
    } else {
      setHabits(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHabits()
  }, [session])

  async function addHabit() {
    if (!newHabitTitle.trim()) return alert('Please enter a habit title')
    if (!session?.user) return alert('Not logged in')

    const { error } = await supabase.from('habits').insert([
      {
        title: newHabitTitle,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      alert('Error adding habit: ' + error.message)
    } else {
      setNewHabitTitle('')
      await fetchHabits()
    }
  }

  function startEdit(id: string) {
    setHabits(habits.map(h =>
      h.id === id ? { ...h, isEditing: true, editTitle: h.title } : h
    ))
  }

  function cancelEdit(id: string) {
    setHabits(habits.map(h =>
      h.id === id ? { ...h, isEditing: false, editTitle: undefined } : h
    ))
  }

  async function saveHabit(id: string) {
    if (!session?.user) {
      alert('Not logged in')
      return
    }

    const habit = habits.find(h => h.id === id)
    if (!habit || !habit.editTitle?.trim()) {
      alert('Title cannot be empty')
      return
    }

    const { error } = await supabase
      .from('habits')
      .update({ title: habit.editTitle })
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      alert('Failed to update habit: ' + error.message)
    } else {
      setHabits(habits.map(h =>
        h.id === id ? { ...h, title: habit.editTitle!, isEditing: false, editTitle: undefined } : h
      ))
      await fetchHabits()
    }
  }

  async function deleteHabit(id: string) {
    if (!session?.user) {
      alert('Not logged in')
      return
    }

    if (!confirm('Are you sure you want to delete this habit?')) return

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      alert('Failed to delete habit: ' + error.message)
    } else {
      setHabits(habits.filter(h => h.id !== id))
      await fetchHabits()
    }
  }

  if (!session) {
    return <p>Please log in to view your dashboard.</p>
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1>Your Habits</h1>

      <div>
        <input
          type="text"
          placeholder="New habit title"
          value={newHabitTitle}
          onChange={e => setNewHabitTitle(e.target.value)}
          style={{ padding: 8, width: '80%' }}
        />
        <button onClick={addHabit} style={{ padding: 8, marginLeft: 8 }}>
          Add Habit
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : habits.length === 0 ? (
        <p>You have no habits yet.</p>
      ) : (
        <ul>
          {habits.map(habit => (
            <li key={habit.id} style={{ marginBottom: 10 }}>
              {habit.isEditing ? (
                <>
                  <input
                    type="text"
                    value={habit.editTitle}
                    onChange={e => {
                      const newTitle = e.target.value
                      setHabits(habits.map(h =>
                        h.id === habit.id ? { ...h, editTitle: newTitle } : h
                      ))
                    }}
                    style={{ padding: 4, width: '60%' }}
                  />
                  <button onClick={() => saveHabit(habit.id)} style={{ marginLeft: 8 }}>
                    Save
                  </button>
                  <button onClick={() => cancelEdit(habit.id)} style={{ marginLeft: 4 }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {habit.title}{' '}
                  <small>({new Date(habit.created_at).toLocaleDateString()})</small>
                  <button
                    onClick={() => startEdit(habit.id)}
                    style={{ marginLeft: 10 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    style={{ marginLeft: 4, color: 'red' }}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
