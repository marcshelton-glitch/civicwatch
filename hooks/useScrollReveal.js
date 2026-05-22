'use client';
import { useCallback, useRef, useState } from 'react';

export function useScrollReveal(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  // Callback ref fires whenever the DOM element is mounted or unmounted,
  // so it works correctly even for conditionally rendered elements.
  const ref = useCallback((el) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return [ref, isVisible];
}
