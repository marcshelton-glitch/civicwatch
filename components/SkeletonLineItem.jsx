import { Skeleton } from './Skeleton';

export function SkeletonLineItem({ wide = false }) {
  if (wide) {
    return (
      <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <Skeleton style={{ height: 22, width: 60, borderRadius: 6 }} />
          <Skeleton style={{ height: 18, width: 50, borderRadius: 4 }} />
          <Skeleton style={{ height: 14, width: 70, borderRadius: 4, marginLeft: 'auto' }} />
        </div>
        <Skeleton style={{ height: 13, width: '85%', marginBottom: 6 }} />
        <Skeleton style={{ height: 11, width: '45%' }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Skeleton style={{ height: 13, width: '80%' }} />
      <Skeleton style={{ height: 11, width: '50%' }} />
    </div>
  );
}
