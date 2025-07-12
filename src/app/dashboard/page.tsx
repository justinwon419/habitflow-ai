'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { format, parseISO, startOfWeek, addDays, isToday } from 'date-fns'
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

  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 0 }) // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(startOfThisWeek, i), 'yyyy-MM-dd')
  )

  const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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
      .in('date', weekDays)

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

  function isHabitCompletedOn(habitId: string, date: string) {
    return completions.some(c => {
      if (c.habit_id !== habitId) return false
      const completionDateOnly = format(parseISO(c.date), 'yyyy-MM-dd')
      return completionDateOnly === date
    })
  }

  async function toggleCompletion(habitId: string) {
    if (!session?.user) return

    const existing = completions.find(c => c.habit_id === habitId && format(parseISO(c.date), 'yyyy-MM-dd') === today)

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

  function getCurrentStreak(habitId: string) {
    let streak = 0
    for (let i = weekDays.length - 1; i >= 0; i--) {
      const day = weekDays[i]
      if (isHabitCompletedOn(habitId, day)) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  if (!session) {
    return <p>Please log in to view your dashboard.</p>
  }

  return (
    <div 
      style={{ 
        padding: 20, 
        maxWidth: 800, 
        margin: 'auto', 
        backgroundColor:"#F0F0F0", 
        paddingBottom:"8px", 
        borderBottomLeftRadius:"8px",
        borderBottomRightRadius:"8px"  
        }}>
        <header style = {{backgroundColor:"#FFFFFF", padding: "16px", borderRadius: "8px"}}>
          <h1 style= {{fontWeight:"bold"}}>
            New habit
          </h1>

          <div style={{ display: 'flex', gap: 16,paddingTop:"4px"}}>
            <input
              type="text"
              placeholder="Enter a brief habit description"
              value={newHabitTitle}
              onChange={e => setNewHabitTitle(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                backgroundColor: 'white',
                border: '1px solid #D9D9D9',
                borderRadius: 8,
              }}
            />
            <button
              onClick={addHabit}
              style={{
                width: '20%',
                padding: 8,
                marginLeft: 8,
                backgroundColor: '#367BDB',
                borderRadius: 8,
                color: 'white',
              }}
            >
              Add habit
            </button>
          </div>
        </header>
        

        {loading ? (
          <p>Loading...</p>
        ) : habits.length === 0 ? (
          <p>You have no habits yet.</p>
        ) : (
          <ul style={{ marginTop: 20}}>
            {habits.map(habit => (
              <li
                key={habit.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 20,
                  borderBottom: '1px solid #eee',
                  backgroundColor: "white",
                  padding: "16px",
                  paddingBottom: "8px",
                  borderRadius: "8px"
                }}
              >
                <input
                  type="checkbox"
                  checked={isHabitCompletedOn(habit.id, today)}
                  onChange={() => toggleCompletion(habit.id)}
                  style={{ marginRight: 10 }}
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
                        Streak: {getCurrentStreak(habit.id)} day{getCurrentStreak(habit.id) === 1 ? '' : 's'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                        {weekDayLabels.map((label, idx) => (
                          <span key={idx} style={{ fontSize: 12, width: 16, textAlign: 'center' }}>
                            {label}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {weekDays.map((date, i) => (
                          <div
                            key={date}
                            title={new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: isHabitCompletedOn(habit.id, date) ? 'green' : '#F0F0F0',
                              border: isToday(new Date(date)) ? '2px solid #367BDB' : 'none',
                            }}
                          />
                        ))}
                      </div>
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
