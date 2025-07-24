'use client'

import React from 'react'
import '@/styles/globals.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', backgroundColor: 'white' }}>
      <header
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 shadow-sm border-b border-[#DDE3EB] rounded-t-lg"
        style={{ backgroundColor: '#4296F7', color: '#FFFFFF' }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight text-center sm:text-left">
          DayOne Dashboard
        </h1>
      </header>
      <main>{children}</main>
    </div>
  )
}
