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
      <header className="bg-white shadow-md rounded-b-3xl px-8 py-6 mb-8">
        <h1 className="text-4xl font-extrabold text-[#4296F7]">DayOne Dashboard</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 space-y-8">
        {children}
      </main>
    </div>
  )
}
