// app/logs/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import AddLogForm from '@/components/AddLogForm'
import MobileNavBar from '@/components/MobileNavBar'
import { quotes, authors } from '@/lib/quotes'

export default async function LogsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return <p className="p-8 text-center text-gray-500">Please log in to view your logs.</p>
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
    return <p className="p-8 text-center text-red-600">Error loading logs: {error.message}</p>
  }

  // group by date
  const grouped: Record<string, typeof logs> = {}
  logs.forEach(log => {
    const dateKey = format(new Date(log.created_at), 'yyyy-MM-dd')
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(log)
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Cover with Quote */}
      <div className="relative h-48 bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="max-w-2xl text-center px-4">
          <p className="text-xl font-semibold text-white mb-2">Motivation for the Day</p>
          <blockquote className="italic text-white text-lg sm:text-xl">
            “{quote}”
          </blockquote>
          <p className="mt-3 text-sm text-gray-200">— {author}</p>
        </div>
      </div>

      <main className="-mt-12 max-w-3xl mx-auto px-4">
        {/* Add Log Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Add a New Log</h2>
          <AddLogForm />
        </div>

        {/* Logs Section */}
        <section className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Logs</h1>
          {Object.keys(grouped).length === 0 ? (
            <p className="text-gray-600">No logs yet. Start by adding one above!</p>
          ) : (
            Object.entries(grouped).map(([date, entries]) => (
              <div key={date} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center mb-4">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium mr-2 px-3 py-1 rounded-full">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">{entries.length} entr{entries.length > 1 ? 'ies' : 'y'}</span>
                </div>
                <ul className="divide-y divide-gray-200">
                  {entries.map(log => (
                    <li key={log.id} className="py-3">
                      <p className="text-gray-800">{log.content}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {format(new Date(log.created_at), 'h:mm a')}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Mobile Nav */}
      <MobileNavBar />
    </div>
  )
}
