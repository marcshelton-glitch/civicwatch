'use client';
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target, { duration = 1400, decimals = 0, startOnMount = false } = {}) {
  const [value, setValue] = useState(startOnMount ? 0 : target);
  const [triggered, setTriggered] = useState(startOnMount);
  const ref = useRef(null);

  // Trigger when element enters viewport
  useEffect(() => {
    if (startOnMount) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnMount]);

  // Run the count animation
  useEffect(() => {
    if (!triggered || target === null || target === undefined) return;
    const start = Date.now();
    const from = 0;
    const to = Number(target);
    if (isNaN(to)) { setValue(target); return; }
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * ease;
      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [triggered, target, duration, decimals]);

  return [ref, value];
}
