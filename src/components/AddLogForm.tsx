'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AddLogForm() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession()
    if (sessErr || !session?.user) {
      console.error('Not logged in')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('logs')
      .insert({ user_id: session.user.id, content: content.trim() })

    if (error) {
      console.error('Failed to add log:', error.message)
    } else {
      setContent('')
      router.refresh() // <- this will re-fetch the server component
    }
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Add New Log</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind today?"
        className="w-full p-2 border border-gray-300 rounded h-28 resize-none text-gray-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-3 bg-[#4296F7] hover:bg-[#2f7de0] text-white font-medium px-4 py-2 rounded transition-colors duration-200"
      >
        {loading ? 'Saving...' : 'Add Log'}
      </button>
    </form>
  )
}
