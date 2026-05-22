'use client';
import { useCountUp } from '../hooks/useCountUp';

function formatValue(value, format, prefix, suffix) {
  if (format === 'currency') {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `$${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (format === 'percent') return `${value}%`;
  return `${prefix || ''}${value.toLocaleString()}${suffix || ''}`;
}

export function CountUp({ value, format, prefix, suffix, duration = 1400, decimals = 0, className = '', style = {} }) {
  const [ref, displayValue] = useCountUp(value, { duration, decimals });
  return (
    <span ref={ref} className={className} style={style}>
      {formatValue(displayValue, format, prefix, suffix)}
    </span>
  );
}
