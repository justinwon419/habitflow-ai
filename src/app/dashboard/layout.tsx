'use client'

import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import '@/styles/globals.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClientComponentClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login') // redirect to login page after logout
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', backgroundColor: 'white' }}>
      <header
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 shadow-sm border-b border-[#DDE3EB] rounded-t-lg"
        style={{ backgroundColor: '#4296F7', color: '#FFFFFF' }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight text-center sm:text-left">
          DayOne Dashboard
        </h1>
        {/* Logout Button (move this somewhere else later) */}
        {/* <button
          onClick={handleLogout}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
        >
          Logout
        </button> */}
      </header>
      <main>{children}</main>
      {/* Logout Button (move this somewhere else later) */}
        <button
          onClick={handleLogout}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
        >
          Logout
        </button>
    </div>
  )
}
