// app/logs/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import AddLogForm from '@/components/AddLogForm'
import LogList from '@/components/LogList'
import MobileNavBar from '@/components/MobileNavBar'
import { quotes, authors } from '@/lib/quotes'

export default async function LogsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return <p className="p-4 text-center">Please log in to view your logs.</p>
  }

  // pick a random quote
  const idx = Math.floor(Math.random() * quotes.length)
  const quote = quotes[idx]
  const author = authors[idx]

  // fetch logs
  const { data: logs, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="p-4 text-center text-red-600">Error loading logs: {error.message}</p>
  }

  // group by date
  const grouped: Record<string, typeof logs> = {}
  logs.forEach((log) => {
    const d = format(new Date(log.created_at), 'yyyy-MM-dd')
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(log)
  })

  return (
    <div className="min-h-screen bg-gray-100 p-4 w-full max-w-screen-md mx-auto">
      {/* Quote Card */}
      {quote && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 border-l-4 border-[#C9C9C9]">
          <p className="text-xl font-bold text-gray-900 mb-2">Motivation for the Day:</p>
          <blockquote className="italic text-gray-800 leading-snug">“{quote}”</blockquote>
          <p className="text-right mt-2 text-gray-600">— {author}</p>
        </div>
      )}

      {/* Add Log Form */}
      <AddLogForm />

      {/* Logs List */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Logs</h1>
      <LogList groupedLogs={grouped} />

      {/* Mobile Nav */}
      <MobileNavBar />
    </div>
  )
}
