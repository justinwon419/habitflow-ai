'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { format, parseISO, subDays } from 'date-fns'
import { Database } from '@/types/supabase'

type Habit = Database['public']['Tables']['habits']['Row'] & {
  isEditing?: boolean
  editTitle?: string
}
type Completion = Database['public']['Tables']['habit_completions']['Row']

export default function DashboardPage() {
  const supabase = useSupabaseClient<Database>()
  const session = useSession()

  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [loading, setLoading] = useState(true)

  const today = format(new Date(), 'yyyy-MM-dd')
  // Generate last 7 days including today
  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  ).reverse()



  async function fetchHabits() {
    if (!session?.user) return

    setLoading(true)

    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', session.user.id)
      .in('date', last7Days)

    if (habitsError || completionsError) {
      alert('Error loading data')
    } else {
      setHabits(habitsData || [])
      setCompletions(completionsData || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchHabits()
  }, [session])

  async function addHabit() {
    if (!newHabitTitle.trim() || !session?.user) return

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
      fetchHabits()
    }
  }

  async function deleteHabit(id: string) {
    if (!confirm('Delete this habit?')) return

    const { error } = await supabase.from('habits').delete().eq('id', id)

    if (error) {
      alert('Error deleting habit: ' + error.message)
    } else {
      setHabits(habits.filter(h => h.id !== id))
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
    const habit = habits.find(h => h.id === id)
    if (!habit || !habit.editTitle?.trim()) return

    const { error } = await supabase
      .from('habits')
      .update({ title: habit.editTitle })
      .eq('id', id)

    if (error) {
      alert('Error updating habit: ' + error.message)
    } else {
      setHabits(habits.map(h =>
        h.id === id
          ? { ...h, title: habit.editTitle!, isEditing: false, editTitle: undefined }
          : h
      ))
    }
  }

  function isHabitCompleted(habitId: string) {
    return completions.some(c => c.habit_id === habitId)
  }

  function isHabitCompletedOn(habitId: string, date: string) {
    return completions.some(c => {
      if (c.habit_id !== habitId) return false
      // Parse the timestamp string, then format to 'yyyy-MM-dd' to compare date only
      const completionDateOnly = format(parseISO(c.date), 'yyyy-MM-dd')
      return completionDateOnly === date
    })
  }


  async function toggleCompletion(habitId: string) {
    if (!session?.user) return

    const existing = completions.find(c => c.habit_id === habitId)

    if (existing) {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id)

      if (!error) {
        setCompletions(completions.filter(c => c.id !== existing.id))
      }
    } else {
      const { data, error } = await supabase
        .from('habit_completions')
        .insert([
          {
            habit_id: habitId,
            user_id: session.user.id,
            date: today,
          },
        ])
        .select()
        .single()

      if (!error && data) {
        setCompletions([...completions, data])
      }
    }
  }

  /**
 * Returns the count of consecutive days up through today
 * that the given habit was completed.
 */
  function getCurrentStreak(habitId: string) {
    let streak = 0

    // Walk backwards from today through last7Days (which you already have)
    // If you want to look further back, you could extend this array dynamically
    for (let i = last7Days.length - 1; i >= 0; i--) {
      const day = last7Days[i]
      if (isHabitCompletedOn(habitId, day)) {
        streak++
      } else {
        break // stop as soon as we hit a day not completed
      }
    }

    return streak
  }

  if (!session) {
    return <p>Please log in to view your dashboard.</p>
  }

  return (
    <div style={{ paddingTop: 20, maxWidth: 800, margin: 'auto' }}>
      <h1>New habit</h1>

      <div style={{display: 'flex', gap: '16'}}>
        <input
          type="text"
          placeholder="Enter a brief habit description"
          value={newHabitTitle}
          onChange={e => setNewHabitTitle(e.target.value)}
          style={{ width: '100%', padding: 8, backgroundColor: 'white', border: '1px solid #D9D9D9', borderRadius: 8, }}
        />
        <button onClick={addHabit} style={{ width: '20%', padding: 8, marginLeft: 8, backgroundColor: '#367BDB', borderRadius: 8, color: 'white' }}>
          Add habit
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : habits.length === 0 ? (
        <p>You have no habits yet.</p>
      ) : (
        <ul style={{ marginTop: 20 }}>
          {habits.map(habit => (
            <li key={habit.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={isHabitCompleted(habit.id)}
                onChange={() => toggleCompletion(habit.id)}
                style={{ marginRight: 10, backgroundColor: '#367BDB' }}
              />

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
                  <div style={{ flexGrow: 1 }}>
                    <strong>{habit.title}</strong>
                    <div style={{ fontSize: '0.8em', color: '#555' }}>
                      Streak: {getCurrentStreak(habit.id)} day
                      {getCurrentStreak(habit.id) === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {last7Days.map(date => (
                      <div
                        key={date}
                        title={date}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: isHabitCompletedOn(habit.id, date) ? 'green' : '#F0F0F0',
                        }}
                      />
                    ))}
                  </div>

                  <button onClick={() => startEdit(habit.id)} style={{ marginLeft: 16 }}>
                    Edit
                  </button>
                  <button onClick={() => deleteHabit(habit.id)} style={{ marginLeft: 16, color: 'red' }}>
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
