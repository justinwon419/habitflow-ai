'use client'

import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = useSupabaseClient()
  const router = useRouter()

  const handleReset = async () => {
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset email sent!')
      router.push('/login')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold text-center text-[#367BDB] mb-6">
        Forgot Your Password?
      </h2>
      <p className="mb-4 text-center text-gray-600">
        Enter your email address to get a link to reset your password.
      </p>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
      />
      <button
        onClick={handleReset}
        disabled={loading || !email}
        className="w-full bg-[#367BDB] text-white py-2 rounded hover:bg-blue-600 transition"
      >
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>
    </div>
  )
}
