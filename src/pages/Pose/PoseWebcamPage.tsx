import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

const TASKS_VERSION = '0.10.0';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export default function PoseWebcamPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const runningRef = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  const initializedRef = useRef(false);

  const [status, setStatus] = useState('초기화 중...');
  const [running, setRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setStatus('중지됨');

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 캔버스 클리어
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  }, []);

  // 1) Landmarker 초기화(한 번만)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        setStatus('모델/런타임 로딩 중...');

        // wasm 로더 경로(여기만 맞으면 Vite에서도 잘 돕니다)
        const vision = await FilesetResolver.forVisionTasks(
          `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`
        );

        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU', // 문제 생기면 "CPU"로 바꿔서 테스트
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        setStatus('준비 완료! Start를 눌러주세요.');
        setIsReady(true);
      } catch (e) {
        console.error(e);
        const errorMsg = '초기화 실패(콘솔 확인). delegate를 CPU로 바꿔보세요.';
        setStatus(errorMsg);
        setErrorMessage(errorMsg);
        setErrorModalOpen(true);
        setIsReady(false);
      }
    })();

    return () => {
      // 언마운트 시 정리
      stop();
    };
  }, [stop]);

  async function start() {
    if (runningRef.current) return;
    if (!landmarkerRef.current) {
      setStatus('아직 로딩 중입니다.');
      return;
    }

    try {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;

      // 캔버스 컨텍스트 가져오기 (2d, 알파 채널 있음 - 비디오가 보이도록)
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        throw new Error('Canvas context를 가져올 수 없습니다.');
      }

      ctxRef.current = ctx;
      const drawingUtils = new DrawingUtils(ctx);
      drawingUtilsRef.current = drawingUtils;

      // 웹캠 연결
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;

      // 비디오 재생 시작
      try {
        await video.play();
        console.log('비디오 재생 시작됨');
      } catch (e) {
        console.warn('비디오 자동 재생 실패:', e);
      }

      // 비디오 메타데이터가 준비될 때까지 대기
      await new Promise<void>(resolve => {
        const onLoadedMetadata = () => {
          // 비디오 크기가 유효한지 확인
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            // 캔버스 크기를 비디오와 동일하게 설정
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // 캔버스 스타일 크기도 설정 (CSS로 조정되지만 실제 크기는 위와 동일)
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            console.log(`Canvas 크기 설정: ${canvas.width}x${canvas.height}`);
            console.log(
              `비디오 크기: ${video.videoWidth}x${video.videoHeight}`
            );
            resolve();
          } else {
            // 메타데이터가 아직 준비되지 않았으면 다시 시도
            setTimeout(() => {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                console.log(
                  `Canvas 크기 설정 (재시도): ${canvas.width}x${canvas.height}`
                );
                resolve();
              } else {
                console.warn('비디오 크기를 가져올 수 없습니다.');
                // 기본값 설정
                canvas.width = 640;
                canvas.height = 480;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                resolve();
              }
            }, 100);
          }
        };

        if (video.readyState >= 1) {
          // 이미 로드된 경우
          onLoadedMetadata();
        } else {
          video.addEventListener('loadedmetadata', onLoadedMetadata, {
            once: true,
          });
        }
      });

      runningRef.current = true;
      setRunning(true);
      setStatus('실시간 추적 중...');

      const predict = () => {
        if (
          !landmarkerRef.current ||
          !videoRef.current ||
          !canvasRef.current ||
          !ctxRef.current ||
          !drawingUtilsRef.current
        ) {
          return;
        }

        if (!runningRef.current) {
          return;
        }

        const video = videoRef.current;

        // 비디오가 재생 중인지 확인
        if (video.readyState < 2) {
          // 비디오가 아직 준비되지 않음
          rafRef.current = requestAnimationFrame(predict);
          return;
        }

        // 비디오가 일시정지되어 있으면 재생 시도
        if (video.paused) {
          video.play().catch(err => console.warn('비디오 재생 실패:', err));
        }

        const nowVideoTime = video.currentTime;
        const nowMs = performance.now();

        // 비디오 시간이 변경되었을 때만 처리 (성능 최적화)
        if (lastVideoTimeRef.current !== nowVideoTime) {
          lastVideoTimeRef.current = nowVideoTime;

          try {
            // detectForVideo는 콜백 방식으로 사용
            // 콜백 내에서 캔버스에 그리기
            landmarkerRef.current.detectForVideo(video, nowMs, result => {
              // 콜백이 호출될 때 ref들이 여전히 유효한지 확인
              if (
                !ctxRef.current ||
                !canvasRef.current ||
                !drawingUtilsRef.current
              ) {
                return;
              }

              const ctx = ctxRef.current;
              const canvas = canvasRef.current;
              const drawingUtils = drawingUtilsRef.current;

              // 캔버스 클리어
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              // 랜드마크 그리기
              if (result && result.landmarks && result.landmarks.length > 0) {
                console.log(
                  `랜드마크 감지: ${result.landmarks.length}개의 포즈`
                );

                for (const landmark of result.landmarks) {
                  if (landmark && landmark.length > 0) {
                    // 랜드마크 점 그리기
                    drawingUtils.drawLandmarks(landmark, {
                      radius: 5,
                      color: '#FF0000',
                    });

                    // 랜드마크 연결선 그리기
                    drawingUtils.drawConnectors(
                      landmark,
                      PoseLandmarker.POSE_CONNECTIONS,
                      {
                        color: '#00FF00',
                        lineWidth: 2,
                      }
                    );
                  }
                }
              } else {
                // 랜드마크가 없을 때 (너무 자주 로그 출력하지 않도록)
                if (Math.floor(nowMs / 1000) % 5 === 0 && Math.random() < 0.1) {
                  console.log(
                    '랜드마크가 감지되지 않았습니다. 카메라 앞에 서주세요.'
                  );
                }
              }
            });
          } catch (error) {
            console.error('detectForVideo 오류:', error);
          }
        }

        if (runningRef.current) {
          rafRef.current = requestAnimationFrame(predict);
        }
      };

      rafRef.current = requestAnimationFrame(predict);
    } catch (e) {
      console.error(e);
      const errorMsg = '웹캠 권한이 필요합니다(브라우저/OS 설정 확인).';
      setStatus(errorMsg);
      setErrorMessage(errorMsg);
      setErrorModalOpen(true);
      runningRef.current = false;
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-text">초기 정자세 설정</h2>
        <p className="text-muted text-sm">정자세를 유지해주세요.</p>
      </div>

      {/* Control Panel */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onClick={running ? stop : start}
            variant={running ? 'secondary' : 'primary'}
            size="lg"
            disabled={!isReady && !running}
          >
            {running ? (
              <>
                <span className="material-symbols-outlined mr-2 text-lg">
                  stop_circle
                </span>
                Stop
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-lg">
                  play_circle
                </span>
                Start
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                running ? 'animate-pulse bg-success' : 'bg-muted'
              }`}
            />
            <span className="text-sm text-text-muted">{status}</span>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-bg shadow-soft">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="block h-auto w-full bg-black"
          style={{ objectFit: 'contain' }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute left-0 top-0 h-full w-full"
          style={{ objectFit: 'contain' }}
        />
        {!running && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
            <div className="text-center">
              <span className="material-symbols-outlined mb-2 text-6xl text-muted">
                videocam_off
              </span>
              <p className="text-muted">웹캠이 시작되지 않았습니다</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Modal */}
      <Modal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="오류 발생"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-text-muted">{errorMessage}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setErrorModalOpen(false)}
            >
              확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
