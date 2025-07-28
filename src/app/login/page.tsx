// app/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Github } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export default function LoginPage() {
  const supabaseClient = createClientComponentClient<Database>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
    })
  }, [router, supabaseClient.auth])

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    const origin = window.location.origin
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  const handleEmailAuth = async () => {
    setError(null)
    setMessage(null)
    // Basic validation
    if (!email) {
      setError('Please enter your email')
      return
    }
    if (showReset) {
      // Password reset flow
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setMessage('Check your email for reset link')
      return
    }
    // Signup/Login flow
    if (!password) {
      setError('Please enter your password')
      return
    }
    if (isSignup) {
      if (!confirmPassword) {
        setError('Please confirm your password')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      // Sign up
      const { error } = await supabaseClient.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your inbox to confirm email')
    } else {
      // Login
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        const { data: goals } = await supabaseClient
          .from('goals')
          .select('id')
          .eq('user_id', data.user.id)
          .limit(1)
        router.push(goals && goals.length > 0 ? '/dashboard' : '/goals/new')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-black px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-700 shadow-xl p-10"
      >
        <h1 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-8">
          {isSignup ? 'Create Your Account' : 'Welcome Back'}
        </h1>

        {/* OAuth Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-3 bg-white text-black rounded-lg py-2 hover:bg-gray-100 transition"
          >
            <FcGoogle className="w-6 h-6" />
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuthLogin('github')}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white rounded-lg py-2 hover:bg-gray-800 transition"
          >
            <Github className="w-6 h-6" />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <span className="flex-grow border-t border-gray-600"></span>
          <span className="mx-3 text-gray-400">or</span>
          <span className="flex-grow border-t border-gray-600"></span>
        </div>

        {/* Email Form */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!showReset && (
            <>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSignup && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </>
          )}

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {message && <p className="text-sm text-green-400 text-center">{message}</p>}

          <button
            onClick={handleEmailAuth}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition"
          >
            {showReset
              ? 'Send Reset Link'
              : isSignup
              ? 'Sign Up with Email'
              : 'Log In with Email'}
          </button>

          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <button onClick={() => setIsSignup(!isSignup)} className="hover:text-white">
              {isSignup ? 'Have an account? Log In' : 'New user? Sign Up'}
            </button>
            {!isSignup && (
              <button onClick={() => setShowReset(!showReset)} className="hover:text-white">
                {showReset ? 'Back to Login' : 'Forgot Password?'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
