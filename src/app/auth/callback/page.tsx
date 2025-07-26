'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Subscribe to auth changes, including the initial session load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // When the user is signed in (or initial session is already present)
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const userId = session.user.id

          // Check if user already has a goal
          const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('id')
            .eq('user_id', userId)
            .limit(1)

          if (goalsError) {
            console.error('Error fetching goals:', goalsError)
            return router.replace('/login')
          }

          // Redirect based on whether they’ve set up a goal
          if (goals.length > 0) {
            router.replace('/dashboard')
          } else {
            router.replace('/goals/new')
          }
        }

        // If they signed out or no session, send back to login
        if (event === 'SIGNED_OUT') {
          router.replace('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return <p className="text-center p-4">Redirecting…</p>
}
