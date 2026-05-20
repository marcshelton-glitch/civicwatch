import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function PATCH() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { onboardingComplete: true },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Onboarding PATCH error:', err.message)
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 })
  }
}
