import { Skeleton } from './Skeleton';

export function SkeletonRepCard() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
      <Skeleton style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton style={{ height: 14, width: '60%' }} />
        <Skeleton style={{ height: 12, width: '40%' }} />
      </div>
    </div>
  );
}
