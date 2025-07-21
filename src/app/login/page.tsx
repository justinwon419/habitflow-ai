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
  const [isSignup, setIsSignup] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/dashboard')
      }
    })
  }, [router, supabaseClient.auth])

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    const origin = location.origin

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
  }

  const handleEmailAuth = async () => {
    setError(null)
    setMessage(null)

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (isSignup) {
      const { error } = await supabaseClient.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your inbox to confirm your email')
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        const user = data.user
        if (user) {
          const { data: goals } = await supabaseClient
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .limit(1)

          router.push(goals && goals.length > 0 ? '/dashboard' : '/goals/new')
        }
      }
    }
  }

  const handlePasswordReset = async () => {
    setError(null)
    setMessage(null)

    if (!email) {
      setError('Enter your email to receive a reset link')
      return
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })

    if (error) setError(error.message)
    else setMessage('Check your email for the password reset link')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0E0E] px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm bg-[#1F1F1F] shadow-2xl rounded-2xl p-8 border border-[#2C2C2C]"
      >
        <h1 className="text-2xl font-bold text-center text-[#1C86FF] mb-6">
          Welcome to DayOne
        </h1>

        <div className="space-y-4">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-2 bg-white text-black border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-100 transition"
          >
            <FcGoogle className="w-5 h-5" />
            Sign in with Google
          </button>

          <button
            onClick={() => handleOAuthLogin('github')}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-lg py-2 px-4 hover:bg-gray-900 transition"
          >
            <Github className="w-5 h-5" />
            Sign in with GitHub
          </button>
        </div>

        <div className="mt-6 border-t border-[#333] pt-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 mb-3 border border-[#333] rounded-md bg-[#1F1F1F] text-white placeholder-[#717C89] focus:outline-none focus:ring-2 focus:ring-[#1C86FF]"
          />
          {!showReset && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 mb-4 border border-[#333] rounded-md bg-[#1F1F1F] text-white placeholder-[#717C89] focus:outline-none focus:ring-2 focus:ring-[#1C86FF]"
            />
          )}

          {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}
          {message && <p className="text-sm text-green-400 mb-3 text-center">{message}</p>}

          {showReset ? (
            <>
              <button
                onClick={handlePasswordReset}
                className="w-full bg-[#1C86FF] text-white py-2 rounded-lg hover:bg-[#409EFF] transition"
              >
                Send reset link
              </button>
              <p className="text-center text-sm mt-4">
                <button
                  onClick={() => setShowReset(false)}
                  className="text-[#89C6FF] hover:underline font-medium"
                >
                  Back to login
                </button>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleEmailAuth}
                className="w-full bg-[#1C86FF] text-white py-2 rounded-lg hover:bg-[#409EFF] transition"
              >
                {isSignup ? 'Sign up with Email' : 'Log in with Email'}
              </button>

              <p className="text-center text-sm mt-4 text-[#B0B6BF]">
                {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-[#89C6FF] hover:underline font-medium"
                >
                  {isSignup ? 'Log in' : 'Sign up'}
                </button>
              </p>

              {!isSignup && (
                <p className="text-sm mt-4 text-center text-[#717C89]">
                  <a href="/forgot-password" className="text-[#89C6FF] hover:underline">
                    Forgot your password?
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
