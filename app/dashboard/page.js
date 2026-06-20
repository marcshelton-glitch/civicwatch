'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CivicWatch from '@/components/CivicWatch'

function DashboardContent() {
  const searchParams = useSearchParams()
  const repParam = searchParams.get('rep')
  const stateParam = searchParams.get('state')
  const searchParam = searchParams.get('search')
  return (
    <CivicWatch
      defaultBioguideId={repParam ? null : 'K000401'}
      defaultState={stateParam || 'CA'}
      defaultSearch={searchParam || ''}
    />
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
