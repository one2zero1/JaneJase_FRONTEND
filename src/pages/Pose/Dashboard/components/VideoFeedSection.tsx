import type { RefObject } from 'react';
import { Pose2DRenderer } from '../../Pose2DRenderer';
import type { Pose2DRendererRef } from '../../Pose2DRenderer';
import { Button } from '@/components/common/Button';

interface VideoFeedSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  pose2DRef: RefObject<Pose2DRendererRef | null>;
  running: boolean;
  start: () => void;
  stop: () => void;
}

export function VideoFeedSection({
  videoRef,
  pose2DRef,
  running,
  start,
  stop,
}: VideoFeedSectionProps) {
  return (
    <div className="relative flex-grow bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-transparent hover:border-border transition-all duration-300 group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="block h-auto w-full bg-black"
        style={{ objectFit: 'contain' }}
      />
      <Pose2DRenderer
        ref={pose2DRef}
        className="pointer-events-none absolute left-0 top-0 h-full w-full"
      />

      {/* 하단 컨트롤 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent z-20 flex justify-between items-end">
        <div className="text-white">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            실시간 모니터링
          </h2>
          <p className="text-sm text-gray-300 opacity-80">
            카메라가 올바른 위치에 있는지 확인해주세요.
          </p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={running ? stop : start}
            variant={running ? 'secondary' : 'primary'}
          >
            {running ? '일시정지' : '시작'}
          </Button>
        </div>
      </div>
    </div>
  );
}
