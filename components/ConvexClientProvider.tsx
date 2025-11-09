'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

// Get Convex URL - check at runtime, not during build
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

// Only throw error in browser (runtime), not during build
if (typeof window !== 'undefined' && !convexUrl) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file')
}

// Create client only if URL is available (allows build to succeed)
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If no Convex URL during build, return children without provider
  // This allows the build to complete, but the app won't work until env vars are set
  if (!convex) {
    if (typeof window !== 'undefined') {
      console.error('Convex client not initialized - check NEXT_PUBLIC_CONVEX_URL')
    }
    return <>{children}</>
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}