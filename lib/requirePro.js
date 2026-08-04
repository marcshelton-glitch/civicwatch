// Server-side Pro subscription gate.
// Usage — hard block (returns 401/403 response on failure):
//   const { errorResponse, userId } = await requirePro()
//   if (errorResponse) return errorResponse
//
// Usage — soft check (strip Pro-only fields rather than blocking):
//   const { isPro } = await getProStatus()
//
// Pro status is determined from Clerk publicMetadata.isPro (set by the
// webhooks/stripe route on successful subscription).

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function getProStatus() {
  const { userId } = await auth()
  if (!userId) return { userId: null, isPro: false }
  try {
    const user = await currentUser()
    return { userId, isPro: user?.publicMetadata?.isPro === true }
  } catch (err) {
    console.error('getProStatus currentUser error:', err.message)
    return { userId, isPro: false }
  }
}

export async function requirePro() {
  const { userId } = await auth()
  if (!userId) {
    return {
      isPro: false,
      userId: null,
      errorResponse: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }
  let user
  try {
    user = await currentUser()
  } catch (err) {
    console.error('requirePro currentUser error:', err.message)
    return {
      isPro: false,
      userId,
      errorResponse: NextResponse.json({ error: 'Failed to verify subscription status' }, { status: 500 }),
    }
  }
  const isPro = user?.publicMetadata?.isPro === true
  if (!isPro) {
    return {
      isPro: false,
      userId,
      errorResponse: NextResponse.json({ error: 'Pro subscription required' }, { status: 403 }),
    }
  }
  return { isPro: true, userId, errorResponse: null }
}
