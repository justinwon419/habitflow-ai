'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const handleRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) {
        return router.push('/login')
      }

      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

      if (goals && goals.length > 0) {
        router.push('/dashboard')
      } else {
        router.push('/goals/new')
      }
    }

    handleRedirect()
  }, [router, supabase])

  return <p className="text-center p-4">Redirecting...</p>
}
