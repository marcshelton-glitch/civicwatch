'use client';
import { useRef } from 'react';

export function TiltCard({ children, className = '', style = {}, maxTilt = 5 }) {
  const cardRef = useRef(null);

  function handleMouseMove(e) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateY = ((x - cx) / cx) * maxTilt;
    const rotateX = -((y - cy) / cy) * maxTilt;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    const glare = card.querySelector('.tilt-glare');
    if (glare) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
    }
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    const glare = card.querySelector('.tilt-glare');
    if (glare) glare.style.background = 'transparent';
  }

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ transition: 'transform 0.15s ease', transformStyle: 'preserve-3d', position: 'relative', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="tilt-glare" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 1 }} />
      {children}
    </div>
  );
}
