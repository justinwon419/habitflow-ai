'use client'

import { useState } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { Session } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

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

  // Override the type to satisfy SessionContextProvider
  const typedSupabaseClient = supabaseClient as unknown as SupabaseClient<any, any, any>

  return (
    <SessionContextProvider supabaseClient={typedSupabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}
