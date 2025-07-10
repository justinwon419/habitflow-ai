// src/app/dashboard/layout.tsx
import React from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>HabitFlow Dashboard</h1>
      {children}
    </div>
  )
}
