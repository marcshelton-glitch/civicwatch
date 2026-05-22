import { Skeleton } from './Skeleton';

export function SkeletonStatCard() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Skeleton style={{ height: 32, width: '50%' }} />
      <Skeleton style={{ height: 14, width: '70%' }} />
    </div>
  );
}
