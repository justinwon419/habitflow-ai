'use client'

import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

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
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <header style = {{backgroundColor:"#367BDB", borderTopLeftRadius:"8px",borderTopRightRadius:"8px"}} 
        className="flex items-center justify-between px-6 py-4 shadow-sm border-b">
        <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
          HabitFlow Dashboard
        </h1>
        <button
          style={{backgroundColor: '#F0F0F0', padding: '8px', borderRadius: '8px'}} 
          onClick={handleLogout}>Logout</button>
      </header>
      <main>{children}</main>
    </div>
  )
}
