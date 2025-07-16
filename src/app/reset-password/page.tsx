'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Supabase handles the magic link and sets the session
    const hash = window.location.hash
    if (!hash.includes('type=recovery')) {
      router.replace('/login')
    }
  }, [router])

  const handleResetPassword = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage('Failed to reset password. Try again.')
    } else {
      setMessage('Password reset successfully! You can now log in.')
      setTimeout(() => router.push('/login'), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4 text-center text-[#367BDB]">
        Reset Password
      </h1>
      <input
        type="password"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button
        onClick={handleResetPassword}
        className="w-full bg-[#367BDB] text-white py-2 rounded hover:bg-blue-600 transition"
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
      {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
    </div>
  )
}
