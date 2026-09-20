'use client'
import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import MetaPixel from '@/components/MetaPixel'
import TiktokPixel from '@/components/TiktokPixel'
import { effectiveConsent, onConsentChange, DENIED } from '@/lib/consent'

// These used to mount unconditionally in app/layout.js, which meant six
// trackers fired on first paint, before the banner had even rendered.
// Nothing here mounts until the user has actively opted in.
export default function ConsentGatedAnalytics({ gaId, metaPixelId, tiktokPixelId }) {
  // Start denied on both server and first client render so the markup matches
  // and no tracker can slip in during hydration.
  const [consent, setConsent] = useState(DENIED)

  useEffect(() => {
    setConsent(effectiveConsent())
    return onConsentChange(setConsent)
  }, [])

  return (
    <>
      {consent.analytics && (
        <>
          <Analytics />
          <SpeedInsights />
          {gaId && <GoogleAnalytics gaId={gaId} />}
        </>
      )}
      {consent.marketing && (
        <>
          {metaPixelId && <MetaPixel pixelId={metaPixelId} />}
          {tiktokPixelId && <TiktokPixel pixelId={tiktokPixelId} />}
        </>
      )}
    </>
  )
}
