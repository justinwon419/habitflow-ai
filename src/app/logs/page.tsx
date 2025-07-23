// app/logs/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import AddLogForm from '@/components/AddLogForm'
import MobileNavBar from '@/components/MobileNavBar'
import { quotes, authors } from '@/lib/quotes'
import LogList from '@/components/LogList'

export default async function LogsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return <p>Please log in to view your logs.</p>
  }

  // ✅ Use plain JS — no useMemo in server components
  const randomIndex = Math.floor(Math.random() * quotes.length)
  const quote = quotes[randomIndex]
  const author = authors[randomIndex]

  // Fetch logs for the user
  const { data: logs, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <p>Error loading logs: {error.message}</p>
  }

  // Group logs by date
  const groupedLogs: Record<string, typeof logs> = {}

  logs.forEach((log) => {
    const date = format(new Date(log.created_at), 'yyyy-MM-dd')
    if (!groupedLogs[date]) groupedLogs[date] = []
    groupedLogs[date].push(log)
  })

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      {/* Quote Card */}
      {quote && (
        <div className="bg-[#E9E9E9] border-l-4 border-[#C9C9C9] p-4 rounded shadow mb-4">
            <p className="text-xl font-bold text-black mb-2">Motivation for the Day:</p>
            <div className="flex flex-col">
            <p className="text-sm italic text-black leading-snug">{`"${quote}"`}</p>
            <span className="text-sm text-gray-600 italic font-medium self-end mt-1">
                — {author}
            </span>
            </div>
        </div>
        )}

      <AddLogForm />

      <h1 className="text-2xl font-bold mb-4">Your Logs</h1>

      <LogList groupedLogs={groupedLogs} />

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  )
}
