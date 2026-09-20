'use client'
import { useState } from 'react'

const S = {
  gold:  '#D4AF37',
  gray:  '#8892A4',
  red:   '#B22234',
  white: '#F5F0E8',
}

// Downloads the signed-in user's data as a JSON file. The endpoint returns
// the file directly, so this reads the blob and hands it to the browser.
export default function DataExportButton() {
  const [state, setState] = useState('idle') // idle | working | done | error
  const [message, setMessage] = useState('')

  async function download() {
    setState('working')
    setMessage('')
    try {
      const res = await fetch('/api/data-export')

      if (res.status === 401) {
        setState('error')
        setMessage('You need to be signed in to download your data.')
        return
      }
      if (res.status === 429) {
        setState('error')
        setMessage('You have requested several exports recently. Please try again in an hour.')
        return
      }
      if (!res.ok) {
        setState('error')
        setMessage('Something went wrong building your export. Please email support@civicwatch.app.')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `civicwatch-data-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setState('done')
      setMessage('Your download has started. Check your downloads folder.')
    } catch {
      setState('error')
      setMessage('Could not reach the server. Check your connection and try again.')
    }
  }

  const working = state === 'working'

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={working}
        style={{
          background: working ? 'rgba(212,175,55,0.3)' : S.gold,
          color: working ? S.gray : '#0A1628',
          border: 'none',
          borderRadius: 6,
          padding: '13px 24px',
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
          cursor: working ? 'not-allowed' : 'pointer',
          letterSpacing: 0.5,
          transition: 'background 0.2s',
        }}
      >
        {working ? 'Preparing your file…' : 'Download my data'}
      </button>

      {/* aria-live so the result is announced rather than only seen. */}
      <p
        aria-live="polite"
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          margin: '12px 0 0',
          minHeight: 20,
          color: state === 'error' ? S.red : state === 'done' ? S.white : S.gray,
        }}
      >
        {message}
      </p>
    </div>
  )
}
