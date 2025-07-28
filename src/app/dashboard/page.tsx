'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { format, parseISO, startOfWeek, addDays} from 'date-fns'
import { Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'
import WeeklyReportModal from '@/components/WeeklyReportModal'
import { getWeeklyStats, calculateWeeklyScore } from '@/utils/stats'
import { getNextWeekDifficultyChange, getEncouragementMessage } from '@/utils/nextDifficulty'
import { saveDifficultyOverride } from '@/utils/saveDifficultyOverride'
import {toast} from 'sonner'
import GoalProgressCircle from '@/components/GoalProgressCircle'
import MobileNavBar from '@/components/MobileNavBar'
import { handleGoalStreak } from '@/utils/handleGoalStreak'

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

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const hasRunRef = useRef<string | null>(null)

  //Goal Streak const
  const [goalStreak, setGoalStreak] = useState<number>(0)

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

  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // load the saved streak on first render
  useEffect(() => {
    async function loadStreak() {
      if (!session?.user) return
      const { data: rec } = await supabase
        .from('user_goal_streak')
        .select('current_streak')
        .eq('user_id', session.user.id)
        .order('last_checked', { ascending: false })
        .limit(1)
        .single()
      setGoalStreak(rec?.current_streak ?? 0)
    }
    loadStreak()
  }, [session, supabase])


  useEffect(() => {
    async function maybeGenerateWeeklyReport() {
      if (!session?.user || !activeGoal || hasRunRef.current) {
        console.log('Missing session or activeGoal')
        return
      }

      const now = new Date()
      const thisWeekKey = format(now, 'yyyy-ww')

      {/* Comment out block below to test weekly report */}
      const shownKey = `weeklyReportShown-${thisWeekKey}`
      if (hasRunRef.current === thisWeekKey) return
      if (localStorage.getItem(shownKey)) return

      {/* Comment out below to test weekly report modal */}
      const isSunday8pmLocal =
        now.getDay() === 0 && now.getHours() === 20 && now.getMinutes() < 60

      if (!isSunday8pmLocal) {
        console.log('Not Sunday 8pm local, skipping report generation')
        return
      }

      hasRunRef.current = thisWeekKey
      {/* Comment out line below to test weekly report */}
      localStorage.setItem(shownKey, 'true')

      try {
        const score = await calculateWeeklyScore(supabase, session.user.id)
        console.log('Weekly score:', score)

        const { data: overrideData, error: overrideError } = await supabase
          .from('weekly_difficulty_overrides')
          .select('override')
          .eq('user_id', session.user.id)
          .eq('week', thisWeekKey)
          .single()

        if (overrideError) {
          console.warn('Override fetch error:', overrideError.message)
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

          const { error: statsError } = await supabase
            .from('weekly_stats')
            .upsert([
            {
              user_id: session.user.id,
              week_start: startOfWeek(now, { weekStartsOn: 0 }).toISOString(),
              completion_pct: score,
              difficulty: difficulty,
              summary: data.summary,
              created_at: new Date().toISOString(),
            },
          ],
          {onConflict: 'user_id,week_start'},
        )
          if (statsError) {
            console.warn('Failed to save weekly stats:', statsError.message)
          }
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
      if (!session?.user || !activeGoal) return

      const now = new Date()
      const thisWeekKey = format(now, 'yyyy-ww')
      const habitsGeneratedKey = `habitsGenerated-${thisWeekKey}`

      if (localStorage.getItem(habitsGeneratedKey)) return

      try {
        // Use the same override logic here
        const { data: overrideData, error: overrideError } = await supabase
          .from('weekly_difficulty_overrides')
          .select('override')
          .eq('user_id', session.user.id)
          .eq('week', thisWeekKey)
          .single()

        if (overrideError) {
          console.warn('Difficulty override fetch error:', overrideError.message)
        }

        const difficulty = overrideData?.override ?? 'same' // Default to 'same' if nothing found

        // Delete old habits
        const { error: deleteError } = await supabase
          .from('habits')
          .delete()
          .eq('user_id', session.user.id)
          .eq('goal_id', activeGoal.id)

        if (deleteError) {
          console.error('Error deleting old habits:', deleteError)
          return
        }

        // Generate new habits
        const response = await fetch('/api/generate-habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal_title: activeGoal.goal_title,
            description: activeGoal.description,
            timeline: activeGoal.timeline,
            motivator: activeGoal.motivator,
            messageToFutureSelf: activeGoal.future_message,
            difficulty: difficulty,
          }),
        })

        if (!response.ok) {
          console.error('Failed to fetch new habits from AI')
          return
        }

        const { habits: newHabits } = await response.json()

        const inserts = newHabits.map((habit: { title: string }) => ({
          user_id: session.user.id,
          goal_id: activeGoal.id,
          title: habit.title,
          created_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase.from('habits').insert(inserts)

        if (insertError) {
          console.error('Error inserting new habits:', insertError)
          return
        }

        toast.success('New habits for the week have been generated!')
        localStorage.setItem(habitsGeneratedKey, 'true')
        await fetchHabits()
      } catch (err) {
        console.error('Error in weekly habit generation:', err)
      }
    }

    maybeGenerateNewWeeklyHabits()
  }, [session, activeGoal, supabase, fetchHabits])


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
    try {
      const newStreak = await handleGoalStreak(supabase, session.user.id)
      setGoalStreak(newStreak)
    } catch (err) {
      console.error('live streak error', err)
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

  {/* JSX RETURN BLOCK */}
  return (
    <div className="space-y-8">
      {/* Top cards: Current Goal & Goal Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Goal */}
        {activeGoal && (
          <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold mb-2">{activeGoal.goal_title}</h2>
            <p className="text-gray-700 mb-1">
              <strong>Description:</strong> {activeGoal.description}
            </p>
            <p className="text-gray-700 mb-1">
              <strong>Timeline:</strong> {activeGoal.timeline}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Motivator:</strong> {activeGoal.motivator}
            </p>
            <button
              onClick={() => {
                setEditedGoal(activeGoal)
                setIsModalOpen(true)
              }}
              className="mt-auto bg-[#4296F7] hover:bg-[#2f7de0] text-white py-2 px-4 rounded-lg transition"
            >
              Edit Goal
            </button>
          </div>
        )}

        {/* Goal Streak (with progress circle) */}
        {activeGoal &&(
          <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between relative">
            <h3 className="text-2xl font-semibold">Goal Streak</h3>
            <p className="mt-4 text-5xl font-bold">
              🔥 {goalStreak}
              <span className="text-xl font-medium">
                {goalStreak === 1 ? ' day' : ' days'} 
              </span>
            </p>
            <div className="absolute top-6 right-6">
              <GoalProgressCircle
                createdAt={activeGoal.created_at}
                timeline={activeGoal.timeline}
              />
            </div>
            <p className="mt-2 text-gray-500">
              Complete at least 80% of your habits each day to keep it going.
            </p>
          </div>
        )}
        
      </div>

      {/* Weekly Report Modal */}
      {showWeeklyModal && weeklyReport && nextWeekMessage && (
        <WeeklyReportModal
          onClose={async () => {
            setShowWeeklyModal(false)
            if (difficultyOverride && session?.user) {
              await saveDifficultyOverride(
                supabase,
                session.user.id,
                difficultyOverride
              )
            }
          }}
          stats={weeklyStats}
          summary={weeklyReport}
          nextWeekMessage={nextWeekMessage}
          onDifficultySelect={setDifficultyOverride}
        />
      )}

      {/* Edit Goal Modal */}
      {isModalOpen && editedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full border-t-8 border-[#4296F7]">
            <h2 className="text-2xl font-bold mb-4 text-[#4296F7]">Edit Goal</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editedGoal.goal_title}
                  onChange={e => setEditedGoal({ ...editedGoal, goal_title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={editedGoal.description}
                  onChange={e => setEditedGoal({ ...editedGoal, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Timeline</label>
                <input
                  type="text"
                  value={editedGoal.timeline}
                  onChange={e => setEditedGoal({ ...editedGoal, timeline: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Motivator</label>
                <textarea
                  value={editedGoal.motivator}
                  onChange={e => setEditedGoal({ ...editedGoal, motivator: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedGoal}
                className="bg-[#4296F7] hover:bg-[#2f7de0] text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Habit Input */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Add a New Habit</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Brief habit description"
            value={newHabitTitle}
            onChange={e => setNewHabitTitle(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
          />
          <button
            onClick={addHabit}
            className="bg-[#4296F7] hover:bg-[#2f7de0] text-white py-2 px-6 rounded-lg transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Daily Progress */}
      {habits.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold mb-2">Daily Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-[#367BDB] transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-gray-600">
            {Math.round(completionPercentage)}% complete
          </p>
        </div>
      )}

      {/* Habits Grid */}
      {loading ? (
        <p className="text-center">Loading…</p>
      ) : habits.length === 0 ? (
        <p className="text-center">You have no habits yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map(habit => {
            const isCompleted = isHabitCompletedOn(habit.id, today)
            const isMenuOpen = openMenuId === habit.id

            return (
              <li
                key={habit.id}
                onClick={() => toggleCompletion(habit.id)}
                className={`
                  relative p-5 rounded-2xl shadow-lg cursor-pointer
                  transition-transform duration-150 active:scale-95
                  ${isCompleted
                    ? 'bg-green-50 border border-green-300'
                    : 'bg-white border border-gray-200'}
                `}
              >
                {/* Ellipsis menu */}
                <div
                  className="absolute top-3 right-3 habit-menu"
                  ref={isMenuOpen ? menuRef : null}
                >
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setOpenMenuId(prev => (prev === habit.id ? null : habit.id))
                    }}
                    className="text-gray-500 hover:bg-gray-200 p-1 rounded"
                  >
                    ⋯
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg z-10">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setOpenMenuId(null)
                          startEdit(habit.id)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setOpenMenuId(null)
                          if (confirm('Delete this habit?')) deleteHabit(habit.id)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {habit.isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={habit.editTitle}
                      onChange={e => {
                        const newTitle = e.target.value
                        setHabits(habits.map(h =>
                          h.id === habit.id ? { ...h, editTitle: newTitle } : h
                        ))
                      }}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveHabit(habit.id)}
                        className="flex-1 bg-[#4296F7] text-white py-1 rounded hover:bg-[#2f7de0]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(habit.id)}
                        className="flex-1 bg-gray-200 text-gray-700 py-1 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-lg mb-2">{habit.title}</div>
                    {getCurrentStreak(habit.id) > 0 && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="mr-1">🔥</span>
                        Streak: {getCurrentStreak(habit.id)}{' '}
                        {getCurrentStreak(habit.id) === 1 ? 'day' : 'days'}
                      </div>
                    )}

                    {/* Weekly Tracker */}
                    <div className="mt-3">
                      {/* Weekday labels */}
                      <div className="flex gap-1 text-[10px] text-gray-500 mb-1">
                        {weekDayLabels.map((label, idx) => (
                          <span key={idx} className="w-3 text-center">
                            {label}
                          </span>
                        ))}
                      </div>
                      {/* Weekday circles */}
                      <div className="flex gap-1">
                        {weekDays.map(date => (
                          <div
                            key={date}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              isHabitCompletedOn(habit.id, date)
                                ? 'bg-green-400'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Mobile Nav */}
      <MobileNavBar />

      {/* Loading Overlay while regenerating habits */}
      {isRegeneratingHabits && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <div className="loader mb-4"></div>
          <p className="text-white text-lg font-semibold">Regenerating habits...</p>
        </div>
      )}
    </div>
  )
}