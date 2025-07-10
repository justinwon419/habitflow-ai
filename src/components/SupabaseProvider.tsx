'use client'

import { useState } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { Session } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: Session | null
}) {
  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient<Database>()
  )

  // ✅ This is the one safe override required due to strict type checks
  const typedSupabaseClient = supabaseClient as unknown as SupabaseClient<Database>

  return (
    <SessionContextProvider
      supabaseClient={typedSupabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  )
}
