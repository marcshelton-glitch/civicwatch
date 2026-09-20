'use client'
import { REOPEN_EVENT } from '@/lib/consent'

// Reopens the consent banner so a choice can be changed or withdrawn.
// GDPR requires withdrawal to be as easy as consent, so this sits in the
// footer next to the other legal links on every page that has them.
//
// It is a <button>, not a <Link>: it performs an action rather than
// navigating. Pass the footer's own className/style so it reads as one of
// the surrounding links.
export default function CookieChoicesLink({ className, style, label = 'Cookie choices' }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(REOPEN_EVENT))}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        cursor: 'pointer',
        ...style,
      }}
    >
      {label}
    </button>
  )
}
