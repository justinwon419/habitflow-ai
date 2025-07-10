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

  // Recommended override to match SessionContextProvider expectations
  const typedSupabaseClient = supabaseClient as unknown as SupabaseClient<any>

  return (
    <SessionContextProvider
      supabaseClient={typedSupabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  )
}
