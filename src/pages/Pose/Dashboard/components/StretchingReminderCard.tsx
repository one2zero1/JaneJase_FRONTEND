export function StretchingReminderCard() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
      <div className="flex items-start space-x-3">
        <span className="material-symbols-outlined text-primary mt-0.5">
          tips_and_updates
        </span>
        <div>
          <h4 className="text-sm font-bold text-text mb-1">스트레칭 알림</h4>
          <p className="text-xs text-text-muted leading-relaxed">
            50분마다 가벼운 목 스트레칭을 해주세요. 근육 긴장을 풀어주어 거북목
            예방에 도움이 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
