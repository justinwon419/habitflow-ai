// app/goals/GoalCreateLogic.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Database } from '@/types/supabase'
import GoalForm from './GoalForm'

export default function GoalCreateLogic() {
  const [goal_title, setGoalTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeline, setTimeline] = useState('')
  const [motivator, setMotivator] = useState('')
  const [futureMessage, setFutureMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = useSupabaseClient<Database>()
  const session = useSession()
  const router = useRouter()

  // 🧠 Manual goal creation
  const handleSubmit = async () => {
    if (!session?.user) return alert('You must be logged in.')
    if (!goal_title || !description || !timeline || !motivator) {
      return alert('Please fill out the required fields.')
    }

    setLoading(true)

    const { error } = await supabase.from('goals').insert([
      {
        user_id: session.user.id,
        goal_title,
        description,
        timeline,
        motivator,
        future_message: futureMessage,
        created_at: new Date().toISOString(),
      },
    ])

    setLoading(false)

    if (error) {
      alert('Error creating goal: ' + error.message)
    } else {
      router.push('/dashboard')
    }
  }

  // 🤖 AI-powered habit generation
  const handleSubmitWithAI = async () => {
    if (!session?.user) return alert('You must be logged in.')
    if (!goal_title || !description || !timeline || !motivator) {
      return alert('Please fill out the required fields.')
    }

    setLoading(true)

    try {
      // 1. Save the goal to Supabase
      const { data, error } = await supabase.from('goals').insert([
        {
          user_id: session.user.id,
          goal_title,
          description,
          timeline,
          motivator,
          future_message: futureMessage,
          created_at: new Date().toISOString(),
        },
      ]).select().single()

      if (error || !data) throw error || new Error('No goal returned.')

      // 2. Call your API to generate habits
      const response = await fetch('/api/generate-habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_title,
          description,
          timeline,
          motivator,
          messageToFutureSelf: futureMessage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate habits from AI')
      }

      const { habits } = await response.json()

      // 3. Save the habits to Supabase
      const habitInserts = habits.map((habit: { title: string }) => ({
        user_id: session.user.id,
        goal_id: data.id,
        title: habit.title,
        created_at: new Date().toISOString(),
      }))

      const { error: habitError } = await supabase.from('habits').insert(habitInserts)
      if (habitError) throw habitError

      // 4. Redirect to dashboard
      router.push('/dashboard')
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Something went wrong: ' + err.message)
      } else {
        alert('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <GoalForm
      goal_title={goal_title}
      setGoalTitle={setGoalTitle}
      description={description}
      setDescription={setDescription}
      timeline={timeline}
      setTimeline={setTimeline}
      motivator={motivator}
      setMotivator={setMotivator}
      futureMessage={futureMessage}
      setFutureMessage={setFutureMessage}
      onSubmit={handleSubmit}
      onSubmitWithAI={handleSubmitWithAI} // ✅ new prop
      loading={loading}
    />
  )
}
