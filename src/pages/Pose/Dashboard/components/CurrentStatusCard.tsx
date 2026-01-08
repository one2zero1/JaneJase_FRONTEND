interface CurrentStatusCardProps {
  status: string;
  statusColor: string;
  message: string;
  neckAngle: number;
  shoulderLevel: number;
  screenDistance: number;
}

export function CurrentStatusCard({
  status,
  statusColor,
  message,
  neckAngle,
  shoulderLevel,
  screenDistance,
}: CurrentStatusCardProps) {
  return (
    <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft border border-border p-6">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        현재 상태
      </h3>
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-12 h-12 rounded-full bg-${statusColor}`} />
        <div>
          <p className="text-2xl font-bold text-text">{status}</p>
          <p className="text-xs text-text-muted">{message}11</p>
        </div>
      </div>

      {/* 상세 지표 */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">목 기울기</span>
            <span className="font-medium text-primary">{neckAngle}°</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${(neckAngle / 15) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">어깨 수평</span>
            <span className="font-medium text-primary">{shoulderLevel}°</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${(shoulderLevel / 15) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">화면 거리</span>
            <span className="font-medium text-primary">{screenDistance}cm</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: '70%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
