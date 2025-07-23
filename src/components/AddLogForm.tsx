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
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('User not logged in')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('logs').insert({
      user_id: session.user.id,
      content: content.trim()
    })

    if (error) {
      console.error('Failed to add log:', error.message)
    } else {
      setContent('')
      router.refresh() // refreshes the logs on the page
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 border border-gray-200">
      <h2 className="text-lg font-semibold mb-2">Add New Log</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind today?"
        className="w-full p-2 border border-gray-300 rounded h-28 resize-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        {loading ? 'Saving...' : 'Add Log'}
      </button>
    </form>
  )
}
