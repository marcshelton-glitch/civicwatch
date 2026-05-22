export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
