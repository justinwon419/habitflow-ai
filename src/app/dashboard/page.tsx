'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { format, parseISO, startOfWeek, addDays} from 'date-fns'
import { Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'
import { GoalInput } from '@/utils/generateHabits'
import WeeklyReportModal from '@/components/WeeklyReportModal'
import { getWeeklyStats, calculateWeeklyScore } from '@/utils/stats'
import { DifficultyChange } from '@/utils/nextDifficulty'

type Habit = Database['public']['Tables']['habits']['Row'] & {
  isEditing?: boolean
  editTitle?: string
}
type Completion = Database['public']['Tables']['habit_completions']['Row']

type Goal = Database['public']['Tables']['goals']['Row']

export default function DashboardPage() {
  const supabase = useSupabaseClient<Database>()
  const session = useSession()
  const router = useRouter()

  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [loading, setLoading] = useState(true)

  const [difficulty] = useState<DifficultyChange | null>(null)
  const [nextWeekMessage] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedGoal, setEditedGoal] = useState<Goal | null>(null)
  const [isRegeneratingHabits, setIsRegeneratingHabits] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(startOfThisWeek, i), 'yyyy-MM-dd')
  )

  const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const fetchHabits = useCallback(async () => {
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
      .order('date', { ascending: false })

    if (habitsError || completionsError) {
      alert('Error loading data')
    } else {
      setHabits(habitsData || [])
      setCompletions(completionsData || [])
    }

    setLoading(false)
  }, [session, supabase])

  useEffect(() => {
    async function checkGoalsAndFetchHabits() {
      if (!session?.user) return

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!goal || goalError) {
        router.push('/goals/new')
        return
      }

      setActiveGoal(goal)
      await fetchHabits()
    }

    checkGoalsAndFetchHabits()
  }, [session, fetchHabits, router, supabase])

  useEffect(() => {
    async function maybeGenerateWeeklyReport() {
      if (!session?.user || !activeGoal) return

      const thisWeekKey = `weeklyReportShown-${format(new Date(), 'yyyy-ww')}`
      if (localStorage.getItem(thisWeekKey)) return

      const now = new Date()
      const isSunday8pmLocal =
        now.getDay() === 0 && // Sunday
        now.getHours() === 20 && // 8pm
        now.getMinutes() < 60 // within 60 minutes of 8pm

      if (!isSunday8pmLocal) return

      try {
        const score = await calculateWeeklyScore(supabase, session.user.id)

        const response = await fetch('/api/weekly-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score,
            habits,
            goal: {
              goal_title: activeGoal.goal_title,
              description: activeGoal.description,
              timeline: activeGoal.timeline,
              motivator: activeGoal.motivator,
              message_to_future_self: activeGoal.future_message || '',
            },
          }),
        })

        const data = await response.json()

        if (response.ok && data.summary) {
          setWeeklyReport(data.summary)
          setShowWeeklyModal(true)
          localStorage.setItem(thisWeekKey, 'true') // Mark as shown
        } else {
          console.error('Failed to generate summary:', data.error)
        }
      } catch (error) {
        console.error('Error generating weekly report:', error)
      }
    }

    maybeGenerateWeeklyReport()
  }, [session, habits, activeGoal, supabase])




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

  async function handleSaveEditedGoal() {
    if (!editedGoal || !activeGoal) return;

    // Check if the goal has changed:
    const goalChanged =
      editedGoal.goal_title !== activeGoal.goal_title ||
      editedGoal.description !== activeGoal.description ||
      editedGoal.timeline !== activeGoal.timeline ||
      editedGoal.motivator !== activeGoal.motivator;

    if (!goalChanged) {
      setIsModalOpen(false);
      return;
    }

    // Confirm with user before regenerating habits
    const wantsRegenerate = confirm(
      'Your goal has changed. Do you want to automatically regenerate your habits? WARNING: This will DELETE your existing habits.'
    );

    setIsModalOpen(false);

    if (!wantsRegenerate) {
      // Just update the goal without regenerating habits
      setLoading(true);
      const { error } = await supabase
        .from('goals')
        .update({
          goal_title: editedGoal.goal_title,
          description: editedGoal.description,
          timeline: editedGoal.timeline,
          motivator: editedGoal.motivator,
        })
        .eq('id', activeGoal.id);

      if (error) alert('Failed to update goal: ' + error.message);
      else setActiveGoal(editedGoal);

      setLoading(false);
      return;
    }

    // User agreed to regenerate habits
    setIsRegeneratingHabits(true);

    try {
      // Update the goal first
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          goal_title: editedGoal.goal_title,
          description: editedGoal.description,
          timeline: editedGoal.timeline,
          motivator: editedGoal.motivator,
        })
        .eq('id', activeGoal.id);

      if (updateError) throw updateError;

      setActiveGoal(editedGoal);

      // Delete existing habits for this user & goal
      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .eq('user_id', session!.user!.id)
        .eq('goal_id', activeGoal.id);

      if (deleteError) throw deleteError;

      // Generate new habits from AI API
      const response = await fetch('/api/generate-habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_title: editedGoal.goal_title,
          description: editedGoal.description,
          timeline: editedGoal.timeline,
          motivator: editedGoal.motivator,
          messageToFutureSelf: editedGoal.future_message,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate habits from AI');

      const { habits } = await response.json();

      // Insert new habits
      const habitInserts = habits.map((habit: { title: string }) => ({
        user_id: session!.user!.id,
        goal_id: activeGoal.id,
        title: habit.title,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase.from('habits').insert(habitInserts);
      if (insertError) throw insertError;

      // Refresh habit list
      await fetchHabits();
    } catch (err) {
      if (err instanceof Error){
        alert('Something went wrong: ' + err.message);
      }
      else{
        alert('Something went wrong.')
      }
    } finally {
      setIsRegeneratingHabits(false);
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
    const completedDates = completions
      .filter(c => c.habit_id === habitId)
      .map(c => format(parseISO(c.date), 'yyyy-MM-dd'))

    let streak = 0
    const dateCursor = new Date()

    // Always include today if it's completed
    while (true) {
      const cursorDate = format(dateCursor, 'yyyy-MM-dd')
      const isCompleted = completedDates.includes(cursorDate)

      if (isCompleted) {
        streak++
      } else {
        // Only break if the missed day is **before today**
        if (cursorDate < today) {
          break
        }
      }

      dateCursor.setDate(dateCursor.getDate() - 1)
    }

    return streak
  }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function fetchHabitsFromAI(goalData: GoalInput) {
  const response = await fetch('/api/generate-habits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goalData),
  })

  if (!response.ok) {
    throw new Error('Failed to generate habits')
  }

  const data = await response.json()
  return data.habits
  }

  const totalCheckmarks = habits.length
  const completedCheckmarks = habits.filter(habit =>
    isHabitCompletedOn(habit.id, today)
  ).length

  const completionPercentage = totalCheckmarks === 0
    ? 0
    : (completedCheckmarks / totalCheckmarks) * 100

  /* Function to collect the weekly stats for Weekly Report Modal */ 
  const weeklyStats = getWeeklyStats(habits, completions, weekDays)
  //The use state for the WeeklyModal is set to false
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)

  if (!session) {
    return <p>Please log in to view your dashboard.</p>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-4xl mx-auto">
      {/* Goal Card */}
      {activeGoal && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">
              Current Goal: {activeGoal.goal_title}
            </h2>
            <button
              className="text-sm bg-[#367BDB] text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={() => {
                setEditedGoal(activeGoal)
                setIsModalOpen(true)
              }}
            >
              Edit
            </button>
          </div>
          <p><strong>Description:</strong> {activeGoal.description}</p>
          <p><strong>Timeline:</strong> {activeGoal.timeline}</p>
          <p><strong>Motivator:</strong> {activeGoal.motivator}</p>
        </div>
      )}

      {/* Weekly Report Modal */}
      {showWeeklyModal && weeklyReport && difficulty && nextWeekMessage && (
        <WeeklyReportModal
          onClose={() => setShowWeeklyModal(false)}
          stats={weeklyStats}
          summary={weeklyReport}
          nextWeekMessage={nextWeekMessage}
        />
      )}

      {/* Goal Edit Modal */}
      {isModalOpen && editedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Edit Goal</h2>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Title</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={editedGoal.goal_title}
                onChange={e => setEditedGoal({ ...editedGoal, goal_title: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Description</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={editedGoal.description}
                onChange={e => setEditedGoal({ ...editedGoal, description: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Timeline</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={editedGoal.timeline}
                onChange={e => setEditedGoal({ ...editedGoal, timeline: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Motivator</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={editedGoal.motivator}
                onChange={e => setEditedGoal({ ...editedGoal, motivator: e.target.value })}
              />
            </div>

            <div className="flex justify-between">
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#367BDB] text-white px-4 py-2 rounded"
                onClick={handleSaveEditedGoal}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay: show only when regenerating new AI-Goals */}
      {isRegeneratingHabits && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <div className="loader"></div>
          <p className="text-white text-lg font-semibold">Regenerating habits...</p>
        </div>
      )}

      {/* New Habit Card */}
      <header className="bg-white p-4 rounded-lg shadow mb-4 mt-4">
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
      <hr className="my-4 border-t border-black" />
      
      {/* Daily Progress Bar */}
      {habits.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-4 mt-4">
          <h3 className="font-semibold mb-2">Daily Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-[#367BDB] transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {Math.round(completionPercentage)}% complete
          </p>
        </div>
      )}

      {/* The Habit Dashboard Card: Loading State, Empty State, Habit Cards, Streaks */}
        {loading ? (
          <p 
            style={{
             padding: "16px" 
            }}
          >
            Loading...</p>
        ) : habits.length === 0 ? (
          <p
            style={{
             padding: "16px" 
            }}
          >  
            You have no habits yet.</p>
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
                  borderRadius: "8px",
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
                      style={{
                        width: '100%',
                        padding: 8,
                        backgroundColor: 'white',
                        border: '1px solid #D9D9D9',
                        borderRadius: 8,
                      }}
                    />
                    <button 
                      onClick={() => saveHabit(habit.id)} 
                      style={{ 
                        marginLeft: 16, 
                        width: '64px',
                        padding: 8,
                        backgroundColor: '#367BDB',
                        borderRadius: 8,
                        color: 'white',
                        }}>
                      Save
                    </button>
                    <button 
                      onClick={() => cancelEdit(habit.id)} 
                      style={{ 
                        marginLeft: 16, 
                        width: '64px',
                        padding: 8,
                        backgroundColor: '#F0F0F0',
                        borderRadius: 8,
                        color: 'red',
                        }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ flexGrow: 1 }}>
                      <strong>{habit.title}</strong>
                      {getCurrentStreak(habit.id) > 0 && (
                        <div style={{ fontSize: '0.8em', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🔥</span>
                          <span>
                            Streak: {getCurrentStreak(habit.id)} day{getCurrentStreak(habit.id) === 1 ? '' : 's'}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                        {weekDayLabels.map((label, idx) => (
                          <span key={idx} style={{ fontSize: 12, width: 16, textAlign: 'center' }}>
                            {label}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {weekDays.map((date) => (
                          <div
                            key={date}
                            title={new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: isHabitCompletedOn(habit.id, date) ? 'green' : '#F0F0F0',
                              border: date === today ? '2px solid #367BDB' : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => startEdit(habit.id)} 
                      style={{ 
                        marginLeft: 16, 
                        width: '64px',
                        padding: 8,
                        backgroundColor: '#F0F0F0',
                        borderRadius: 8,
                        color: 'black',
                        }}>
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteHabit(habit.id)} 
                      style={{ marginLeft: 16, 
                        width: '64px',
                        padding: 8,
                        backgroundColor: '#F0F0F0',
                        borderRadius: 8,
                        color: 'red'
                        }}>
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
