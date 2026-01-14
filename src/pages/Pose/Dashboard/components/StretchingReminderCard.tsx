import { useRef } from 'react';
import stretchingVideo from '@/assets/videos/Calm_Office_Neck_Stretches_Video.mp4';

export function StretchingReminderCard() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.log('Auto-play blocked:', e));
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
      <div className="flex items-start space-x-3">
        <span className="material-symbols-outlined text-primary mt-0.5">
          tips_and_updates
        </span>
        <div>
          <div className="flex items-center gap-2 mb-1 relative z-40">
            <h4 className="text-sm font-bold text-text">스트레칭 알림</h4>
            <div
              className="relative group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span className="material-symbols-outlined text-lg text-text-muted hover:text-text cursor-help transition-colors">
                help
              </span>
              {/* Tooltip Content */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 absolute left-full top-1/2 -translate-y-1/2 ml-4 w-[320px] bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border p-4 z-50 pointer-events-none group-hover:pointer-events-auto">
                <div className="space-y-3">
                  <div className="font-bold text-base mb-2">
                    목 스트레칭 가이드
                  </div>
                  <div className="flex justify-center overflow-hidden rounded-lg bg-black/5 dark:bg-white/5 aspect-video">
                    <video
                      ref={videoRef}
                      src={stretchingVideo}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    잠시 하던 일을 멈추고
                    <br />
                    영상에 맞춰 목을 가볍게 풀어주세요.
                  </p>
                </div>
                {/* Arrow */}
                <div className="absolute right-[100%] top-1/2 -translate-y-1/2 border-8 border-transparent border-r-surface dark:border-r-surface-dark drop-shadow-sm"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            50분마다 가벼운 목 스트레칭을 해주세요. 근육 긴장을 풀어주어 거북목
            예방에 도움이 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
