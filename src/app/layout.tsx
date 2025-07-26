import React, { ReactNode } from 'react'
import './globals.css'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import SupabaseProvider from '@/components/SupabaseProvider'
import AuthGuard from '@/components/AuthGuard'
import { Toaster } from 'sonner'

interface RootLayoutProps {
  children: ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body>
        <SupabaseProvider initialSession={session}>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster richColors position="top-center" />
        </SupabaseProvider>
      </body>
    </html>
  )
}