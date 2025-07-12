'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Github } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const handleLogin = async (provider: 'github' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/dashboard`
      }
    })
  }

  useEffect(() => {
    // Auto-redirect if already logged in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard'
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white shadow-xl rounded-2xl p-8 border border-gray-200"
      >
        <h1 className="text-2xl font-bold text-center text-[#367BDB] mb-6">
          Welcome to HabitFlow
        </h1>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('google')}
            className="w-full flex items-center justify-center gap-2 bg-white text-black border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-100 transition"
          >
            <FcGoogle className="w-5 h-5" />
            Sign in with Google
          </button>

          <button
            onClick={() => handleLogin('github')}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-lg py-2 px-4 hover:bg-gray-900 transition"
          >
            <Github className="w-5 h-5" />
            Sign in with GitHub
          </button>
        </div>
      </motion.div>
    </div>
  )
}
