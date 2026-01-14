import type { detectBadPoseInform } from '@/types/poseTypes';

interface CurrentStatusCardProps {
  detectBadPoseInform: detectBadPoseInform;
}

export function CurrentStatusCard({
  detectBadPoseInform,
}: CurrentStatusCardProps) {
  if (!detectBadPoseInform) {
    return <div>데이터를 불러오는 중입니다...</div>;
  }
  const {
    diffNSDegree,
    diffESDegree,
    diffShoulderLeanDegree,
    headdownStatus,
    headforwardStatus,
    shoulderLeanStatus,
  } = detectBadPoseInform;

  let status: string;
  let message: string;
  let statusColor: string;

  if (
    headdownStatus === 'danger' ||
    headforwardStatus === 'danger' ||
    shoulderLeanStatus === 'danger'
  ) {
    status = '위험';
    message = '즉시 자세를 교정하세요.';
    statusColor = 'bg-red-500';
  } else if (
    headdownStatus === 'warning' ||
    headforwardStatus === 'warning' ||
    shoulderLeanStatus === 'warning'
  ) {
    status = '주의';
    message = '자세가 좋지 않습니다.';
    statusColor = 'bg-yellow-500';
  } else {
    status = '양호';
    message = '좋은 자세를 유지하고 있습니다.';
    statusColor = 'bg-green-500';
  }

  // 각도 값 절댓값으로 표시 (음수일 경우 대비)
  const neckAngleValue = Math.abs(diffNSDegree).toFixed(1);
  const headForwardValue = Math.abs(diffESDegree).toFixed(1);
  const shoulderLeanValue = Math.abs(diffShoulderLeanDegree).toFixed(1);

  // 진행률 계산 (최대값 15도 기준)
  const neckProgress = Math.min((Math.abs(diffNSDegree) / 15) * 100, 100);
  const headForwardProgress = Math.min(
    (Math.abs(diffESDegree) / 20) * 100,
    100
  );
  const shoulderLeanProgress = Math.min(
    (Math.abs(diffShoulderLeanDegree) / 10) * 100,
    100
  );

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft border border-border p-6">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        현재 상태
      </h3>
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-12 h-12 rounded-full ${statusColor}`} />
        <div>
          <p className="text-2xl font-bold text-text">{status}</p>
          <p className="text-xs text-text-muted">{message}</p>
        </div>
      </div>

      {/* 상세 지표 */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">고개 숙임 차이</span>
            <span
              className={`font-medium ${headdownStatus === 'danger' ? 'text-red-500' : headdownStatus === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}
            >
              {neckAngleValue}°
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className={`h-2 rounded-full ${headdownStatus === 'danger' ? 'bg-red-500' : headdownStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${neckProgress}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">거북목 차이</span>
            <span
              className={`font-medium ${headforwardStatus === 'danger' ? 'text-red-500' : headforwardStatus === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}
            >
              {headForwardValue}°
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className={`h-2 rounded-full ${headforwardStatus === 'danger' ? 'bg-red-500' : headforwardStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${headForwardProgress}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">어깨 기울기 차이</span>
            <span
              className={`font-medium ${shoulderLeanStatus === 'danger' ? 'text-red-500' : shoulderLeanStatus === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}
            >
              {shoulderLeanValue}°
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className={`h-2 rounded-full ${shoulderLeanStatus === 'danger' ? 'bg-red-500' : shoulderLeanStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${shoulderLeanProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
