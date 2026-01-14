interface TodayStatsCardProps {
  warnings: number;
  unfocusTime: number;
}

export function TodayStatsCard({ warnings, unfocusTime }: TodayStatsCardProps) {
  return (
    <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft border border-border p-6">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        오늘의 통계
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-bg rounded-lg">
          <p className="text-xs text-text-muted mb-1">나쁜 자세 경고</p>
          <p className="text-xl font-bold text-danger">{warnings}회</p>
        </div>
        <div className="text-center p-3 bg-bg rounded-lg">
          <p className="text-xs text-text-muted mb-1">흐트러진 시간</p>
          <p className="text-xl font-bold text-text">{unfocusTime}분</p>
        </div>
      </div>
    </div>
  );
}
