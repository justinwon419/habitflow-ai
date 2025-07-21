'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { format, parseISO, startOfWeek, addDays, differenceInWeeks} from 'date-fns'
import { Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'
import { GoalInput } from '@/utils/generateHabits'
import WeeklyReportModal from '@/components/WeeklyReportModal'
import { getWeeklyStats, calculateWeeklyScore } from '@/utils/stats'
import { getNextWeekDifficultyChange, getEncouragementMessage } from '@/utils/nextDifficulty'
import { saveDifficultyOverride } from '@/utils/saveDifficultyOverride'
import {toast} from 'sonner'
import GoalProgressCircle from '@/components/GoalProgressCircle'

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

  const [nextWeekMessage, setNextWeekMessage] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedGoal, setEditedGoal] = useState<Goal | null>(null)
  const [isRegeneratingHabits, setIsRegeneratingHabits] = useState(false)
  
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [difficultyOverride, setDifficultyOverride] = useState<'easier' | 'same' | 'harder' | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(startOfThisWeek, i), 'yyyy-MM-dd')
  )
  const weeklyStats = getWeeklyStats(habits, completions, weekDays)
  const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const hasRunRef = useRef<string | null>(null)

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
      if (!session?.user || !activeGoal || hasRunRef.current) {
        console.log('Missing session or activeGoal')
        return
      }

      const thisWeekKey = format(new Date(), 'yyyy-ww')

      // Prevent running more than one time (it was running 3 times before)
      if (hasRunRef.current === thisWeekKey) return
      hasRunRef.current = thisWeekKey
      //Prevent running more than once per week
      const shownKey = `weeklyReportShown-${thisWeekKey}`
      if (localStorage.getItem(shownKey)) return

      const now = new Date()
      const isSunday8pmLocal =
        now.getDay() === 0 &&
        now.getHours() === 20 &&
        now.getMinutes() < 60

      // Uncomment this to restore the original condition:
      if (!isSunday8pmLocal) {
        console.log('Not Sunday 8pm local, skipping report generation')
        return
      }

      try {


        const score = await calculateWeeklyScore(supabase, session.user.id)
        console.log('Weekly score:', score)

        const { data: overrideData, error: overrideError } = await supabase
          .from('weekly_difficulty_overrides')
          .select('override')
          .eq('user_id', session.user.id)
          .eq('week', format(now, 'yyyy-ww'))
          .single()

        if (overrideError) {
          console.warn('Override fetch error:', overrideError.message)
        } else {
          console.log('Fetched override data:', overrideData)
        }

        const difficulty = overrideData?.override ?? getNextWeekDifficultyChange(score)
        const nextWeekMessage = getEncouragementMessage(difficulty)
        console.log('Determined difficulty:', difficulty)
        console.log('Generated encouragement message:', nextWeekMessage)

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
        console.log('Weekly report API response:', data)

        if (response.ok && data.summary) {
          setWeeklyReport(data.summary)
          setNextWeekMessage(nextWeekMessage)
          setShowWeeklyModal(true)
          localStorage.setItem(thisWeekKey, 'true')
          console.log('Weekly modal set to show ✅')
        } else {
          console.error('Failed to generate summary:', data.error)
        }
      } catch (error) {
        console.error('Unexpected error during weekly report generation:', error)
      }
    }

    maybeGenerateWeeklyReport()
  }, [session, habits, activeGoal, supabase])

  useEffect(() => {
    async function maybeGenerateNewWeeklyHabits() {
      if (!session?.user || !activeGoal) return;

      const now = new Date();
      const currentWeek = format(now, 'yyyy-ww');
      const habitsGeneratedKey = `habitsGenerated-${currentWeek}`;

      // Prevent duplicate generation
      if (localStorage.getItem(habitsGeneratedKey)) return;

      try {
        // Fetch difficulty override
        const { data: overrideData } = await supabase
          .from('weekly_difficulty_overrides')
          .select('override')
          .eq('user_id', session.user.id)
          .eq('week', currentWeek)
          .single();

        const score = await calculateWeeklyScore(supabase, session.user.id);
        const difficulty = overrideData?.override ?? getNextWeekDifficultyChange(score);

        // Delete old habits
        const { error: deleteError } = await supabase
          .from('habits')
          .delete()
          .eq('user_id', session.user.id)
          .eq('goal_id', activeGoal.id);

        if (deleteError) {
          console.error('Error deleting old habits:', deleteError);
          return;
        }

        // Generate new habits from API
        const response = await fetch('/api/generate-habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal_title: activeGoal.goal_title,
            description: activeGoal.description,
            timeline: activeGoal.timeline,
            motivator: activeGoal.motivator,
            messageToFutureSelf: activeGoal.future_message,
            difficulty: difficulty, // optional, in case your API handles this
          }),
        });

        if (!response.ok) {
          console.error('Failed to fetch new habits from AI');
          return;
        }

        const { habits: newHabits } = await response.json();

        // Insert new habits
        const inserts = newHabits.map((habit: { title: string }) => ({
          user_id: session.user.id,
          goal_id: activeGoal.id,
          title: habit.title,
          created_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase.from('habits').insert(inserts);
        
        if (insertError) {
          console.error('Error inserting new habits:', insertError);
          return;
        }
        toast.success('New habits for the week have been generated!')
        localStorage.setItem(habitsGeneratedKey, 'true');
        await fetchHabits(); // Refresh the habit list
      } catch (err) {
        console.error('Error in weekly habit generation:', err);
      }
    }

    maybeGenerateNewWeeklyHabits();
  }, [session, activeGoal, supabase, fetchHabits]);

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
  

  if (!session) {
    return <p>Please log in to view your dashboard.</p>
  }
  console.log('showWeeklyModal:', showWeeklyModal)
  console.log('weeklyReport:', weeklyReport)
  console.log('nextWeekMessage:', nextWeekMessage)
  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-4xl mx-auto">
      {/* Goal Card */}
      {activeGoal && (
        <div className="bg-white p-4 rounded-lg shadow mb-4 relative">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">
              Current Goal: {activeGoal.goal_title}
            </h2>

            {/* Circular Progress Bar */}
            <div className="absolute top-2 right-2">
              <GoalProgressCircle createdAt={activeGoal.created_at} timeline={activeGoal.timeline} />
            </div>
          </div>
          <p><strong>Description:</strong> {activeGoal.description}</p>
          <p><strong>Timeline:</strong> {activeGoal.timeline}</p>
          <p><strong>Motivator:</strong> {activeGoal.motivator}</p>
          <div className="mt-2">
            <button
              className="text-sm bg-[#367BDB] text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={() => {
                setEditedGoal(activeGoal)
                setIsModalOpen(true)
              }}
            >
              Edit Goal
            </button>
          </div>
        </div>
      )}

      {/* Temporary button for weekly report modal */}
      {/* <button
        onClick={() => {
          console.log('Test button clicked')
          setShowWeeklyModal(true)
        }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50"
      >
        Show Weekly Modal (Test)
      </button> */}

      {/* Weekly Report Modal */}
      {showWeeklyModal && weeklyReport && nextWeekMessage && (
        <WeeklyReportModal
          onClose={async () => {
            console.log('Modal closed')
            setShowWeeklyModal(false)
            
            if (difficultyOverride && session?.user) {
              console.log('Saving difficulty override:', difficultyOverride)
              try {
                await saveDifficultyOverride(
                  supabase,
                  session.user.id,
                  difficultyOverride
                )
              } catch (error) {
                console.error('Failed to persist difficulty choice', error)
              }
            }
          }}
          stats={weeklyStats}
          summary={weeklyReport}
          nextWeekMessage={nextWeekMessage}
          onDifficultySelect={(choice) => {
            console.log('Difficulty override selected:', choice)
            setDifficultyOverride(choice)
          }}
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
