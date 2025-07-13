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
      router.push('/dashboard') // or wherever the post-goal flow starts
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
        loading={loading}
    />
)
}
