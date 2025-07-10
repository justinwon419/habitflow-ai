// app/login/page.tsx

'use client'

import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

export default function LoginPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/dashboard`
      }
    })
  }

  useEffect(() => {
    // check if user is already logged in and redirect
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard'
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        className="bg-black text-white px-6 py-3 rounded"
        onClick={handleLogin}
      >
        Sign in with GitHub
      </button>
    </div>
  )
}
