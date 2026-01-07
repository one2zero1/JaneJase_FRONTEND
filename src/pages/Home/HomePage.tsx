import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import useHealthStore from '@/stores/useHealthStore';
import tempImg from '@/assets/imgs/poseDetection.jpg';
import panda from '@/assets/imgs/panda.png';

export default function HomePage() {
  const navigate = useNavigate();
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
  const { healthStatus, healthMessage, checkServerHealth } = useHealthStore();

  useEffect(() => {
    // 컴포넌트가 켜질 때 서버 체크 함수 실행!
    checkServerHealth();
  }, [checkServerHealth]);

  useEffect(() => {
    if (isHealthCheckOpen) {
      // 헬스체크 모달이 열릴 때마다 서버 상태를 확인합니다.
      checkServerHealth();
    }
  }, [isHealthCheckOpen]);

  return (
    <div className="relative -m-6 flex min-h-[calc(100vh-88px)] w-[calc(100%+48px)] flex-col overflow-hidden">
      {/* Main Content */}
      <div className="layout-container relative flex h-full grow flex-col">
        {/* Background Blobs */}
        <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[100px]"></div>

        <div className="z-10 flex flex-1 justify-center px-4 py-10 md:px-40 md:py-20">
          <div className="layout-content-container flex max-w-[960px] flex-1 flex-col items-center justify-center">
            <div className="w-full @container">
              <div className="flex flex-col items-center @[480px]:p-4">
                {/* Hero Section */}
                <div className="flex max-w-3xl flex-col items-center justify-center gap-8 text-center">
                  <div className="flex flex-row items-center gap-4">
                    <img
                      src={panda}
                      alt="JaneJase Logo"
                      className="h-32 w-auto object-contain md:h-48 lg:h-64"
                    />
                    <div>
                      <h1 className="max-w-xl break-keep text-4xl font-extrabold leading-tight text-text md:text-5xl lg:text-6xl">
                        JaneJase
                      </h1>
                      <h2 className="max-w-xl break-keep text-lg font-normal leading-relaxed text-text-muted md:text-xl">
                        <br className="hidden sm:block" />
                        자네, 자세가 그게 뭔가?
                      </h2>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="flex w-full flex-col items-center gap-4 sm:w-auto">
                    <Button
                      size="lg"
                      variant="primary"
                      className="w-full min-w-[200px] sm:w-auto"
                    >
                      자세 교정하러 가기
                    </Button>
                    <Button
                      size="lg"
                      variant="primary"
                      onClick={() => setIsHealthCheckOpen(true)}
                      className="w-full min-w-[200px] sm:w-auto"
                    >
                      헬스체크
                    </Button>
                    <div className="flex items-center gap-2 rounded-full border border-border bg-success-soft px-4 py-1.5 text-center text-xs font-normal leading-normal text-success">
                      <p>
                        영상은 서버에 저장되지 않습니다. 개인정보는 안전합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demo Card */}
                <div className="group perspective-[1000px] relative mt-16 w-full max-w-4xl">
                  <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
                    {/* Window Controls */}
                    <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-400/80"></div>
                        <div className="h-3 w-3 rounded-full bg-green-400/80"></div>
                      </div>
                      <div className="flex-1 text-center tracking-widest text-muted">
                        실시간 모니터링
                      </div>
                    </div>

                    {/* Demo Content */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <img src={tempImg} alt="Pose Detection Demo" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Check Modal */}
      <Modal
        open={isHealthCheckOpen}
        onClose={() => setIsHealthCheckOpen(false)}
        title="백엔드 헬스체크"
      >
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div
            className={`rounded-full p-4 ${
              healthStatus === 'loading'
                ? 'animate-pulse bg-primary/10'
                : healthStatus === 'success'
                  ? 'bg-success/10'
                  : healthStatus === 'error'
                    ? 'bg-red-500/10'
                    : 'bg-primary/10'
            }`}
          >
            <span
              className={`material-symbols-outlined text-4xl ${
                healthStatus === 'loading'
                  ? 'text-primary'
                  : healthStatus === 'success'
                    ? 'text-success'
                    : healthStatus === 'error'
                      ? 'text-red-500'
                      : 'text-primary'
              }`}
            >
              {healthStatus === 'loading'
                ? 'sync'
                : healthStatus === 'success'
                  ? 'check_circle'
                  : healthStatus === 'error'
                    ? 'error'
                    : 'health_and_safety'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-text-muted">
          백엔드 서버의 상태를 확인합니다.
          <br />
          <span className="font-mono text-xs text-muted">
            http://127.0.0.1:8010/health
          </span>
        </p>

        {/* Status Message */}
        {healthMessage && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-center text-sm ${
              healthStatus === 'success'
                ? 'border-success/20 bg-success-soft text-success'
                : healthStatus === 'error'
                  ? 'border-red-500/20 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                  : 'border-border bg-bg text-text-muted'
            }`}
          >
            {healthMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setIsHealthCheckOpen(false)}
            variant="secondary"
            className="flex-1"
          >
            닫기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
