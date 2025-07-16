'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const hash = window.location.hash

    if (hash.includes('type=recovery')) {
      const accessToken = new URLSearchParams(hash.substring(1)).get('access_token')
      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '', // leave blank, Supabase will refresh it
        })
      }
    } else {
      router.replace('/login')
    }
  }, [router, supabase])

  const handleReset = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (!error) {
      router.push('/login')
    } else {
      alert(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleReset}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </div>
  )
}
