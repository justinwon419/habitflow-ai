'use client'

import { ReactNode, useEffect } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { usePathname, useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading } = useSessionContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect once the session state has resolved
    if (isLoading) return

    const publicPaths = ['/login', '/auth/callback', '/signup']
    const isPublic = publicPaths.includes(pathname)

    if (!session && !isPublic) {
      router.replace('/login')
    } else if (session && isPublic) {
      router.replace('/dashboard')
    }
  }, [session, isLoading, pathname, router])

  if (isLoading) {
    // Optionally render a spinner or null while loading
    return null
  }

  return <>{children}</>
}
