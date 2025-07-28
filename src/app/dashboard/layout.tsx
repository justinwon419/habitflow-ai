'use client'

import React from 'react'
import '@/styles/globals.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="flex items-center justify-center h-24 bg-gradient-to-r from-blue-400 to-purple-600 relative">
        <h1 className="text-center text-4xl font-extrabold text-[#FFFFFF]">DayOne Dashboard</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 space-y-8 pb-24">
        {children}
      </main>
    </div>
  )
}
