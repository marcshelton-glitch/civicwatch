'use client';
import { useState, useEffect } from 'react';

export default function ScrollIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
      const hasScroll = document.documentElement.scrollHeight > window.innerHeight + 10;
      setVisible(hasScroll && !atBottom);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
      aria-label="Scroll down for more"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(0,0,0,0.45)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        animation: 'scrollBounce 1.4s ease-in-out infinite',
        backdropFilter: 'blur(4px)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 6l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
