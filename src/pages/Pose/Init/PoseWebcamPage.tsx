import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pose2DRenderer } from '../Pose2DRenderer';
import { Pose3DRenderer } from '../Pose3DRenderer';
import type { Pose2DRendererRef } from '../Pose2DRenderer';
import type { Pose3DRendererRef } from '../Pose3DRenderer';
import type { MeasurementData } from '@/types/poseTypes';

const TASKS_VERSION = '0.10.0';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export default function PoseWebcamPage() {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pose2DRef = useRef<Pose2DRendererRef | null>(null);
  const pose3DRef = useRef<Pose3DRendererRef | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const runningRef = useRef(false);
  const isMeasuringRef = useRef(false);
  const initializedRef = useRef(false);

  const [status, setStatus] = useState('초기화 중...');
  const [running, setRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [developerMode, setDeveloperMode] = useState(false);
  const [avgMeasurementData, setAvgMeasurementData] =
    useState<MeasurementData | null>(null);

  const measurementDataRef = useRef<
    Array<{
      nose: { x: number; y: number; z: number };
      leftEyeInner: { x: number; y: number; z: number };
      leftEye: { x: number; y: number; z: number };
      leftEyeOuter: { x: number; y: number; z: number };
      rightEyeInner: { x: number; y: number; z: number };
      rightEye: { x: number; y: number; z: number };
      rightEyeOuter: { x: number; y: number; z: number };
      leftEar: { x: number; y: number; z: number };
      rightEar: { x: number; y: number; z: number };
      mouthLeft: { x: number; y: number; z: number };
      mouthRight: { x: number; y: number; z: number };
      leftShoulder: { x: number; y: number; z: number };
      rightShoulder: { x: number; y: number; z: number };
    }>
  >([]);

  const measurementTimerRef = useRef<number | null>(null);
  const measurementStartTimeRef = useRef<number>(0);

  const handleNextPage = () => {
    navigate('/pose/dashboard', {
      state: { measurementData: avgMeasurementData },
    });
  };

  const calculateAverage = (
    points: Array<{ x: number; y: number; z: number }>
  ) => {
    const sum = points.reduce(
      (acc, p) => ({
        x: acc.x + p.x,
        y: acc.y + p.y,
        z: acc.z + p.z,
      }),
      { x: 0, y: 0, z: 0 }
    );
    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
      z: sum.z / points.length,
    };
  };

  const stopMeasurement = useCallback(() => {
    if (measurementTimerRef.current) {
      clearInterval(measurementTimerRef.current);
      measurementTimerRef.current = null;
    }
    isMeasuringRef.current = false;
    setIsMeasuring(false);
    setMeasurementProgress(0);

    if (measurementDataRef.current.length > 0) {
      const data = measurementDataRef.current;
      const avgData = {
        nose: calculateAverage(data.map(d => d.nose)),
        leftEyeInner: calculateAverage(data.map(d => d.leftEyeInner)),
        leftEye: calculateAverage(data.map(d => d.leftEye)),
        leftEyeOuter: calculateAverage(data.map(d => d.leftEyeOuter)),
        rightEyeInner: calculateAverage(data.map(d => d.rightEyeInner)),
        rightEye: calculateAverage(data.map(d => d.rightEye)),
        rightEyeOuter: calculateAverage(data.map(d => d.rightEyeOuter)),
        leftEar: calculateAverage(data.map(d => d.leftEar)),
        rightEar: calculateAverage(data.map(d => d.rightEar)),
        mouthLeft: calculateAverage(data.map(d => d.mouthLeft)),
        mouthRight: calculateAverage(data.map(d => d.mouthRight)),
        leftShoulder: calculateAverage(data.map(d => d.leftShoulder)),
        rightShoulder: calculateAverage(data.map(d => d.rightShoulder)),
      };
      setAvgMeasurementData(avgData);

      console.log('=== 측정 완료: 10초간 수집된 랜드마크 평균값 ===');
      console.log('0 - nose:', avgData.nose);
      console.log('1 - left eye (inner):', avgData.leftEyeInner);
      console.log('2 - left eye:', avgData.leftEye);
      console.log('3 - left eye (outer):', avgData.leftEyeOuter);
      console.log('4 - right eye (inner):', avgData.rightEyeInner);
      console.log('5 - right eye:', avgData.rightEye);
      console.log('6 - right eye (outer):', avgData.rightEyeOuter);
      console.log('7 - left ear:', avgData.leftEar);
      console.log('8 - right ear:', avgData.rightEar);
      console.log('9 - mouth (left):', avgData.mouthLeft);
      console.log('10 - mouth (right):', avgData.mouthRight);
      console.log('11 - left shoulder:', avgData.leftShoulder);
      console.log('12 - right shoulder:', avgData.rightShoulder);
      console.log(`총 ${data.length}개의 프레임 데이터 수집됨`);
    }

    measurementDataRef.current = [];
  }, []);

  const startMeasurement = useCallback(() => {
    if (!running) return;

    measurementDataRef.current = [];
    setAvgMeasurementData(null);
    isMeasuringRef.current = true;
    setIsMeasuring(true);
    setMeasurementProgress(0);
    measurementStartTimeRef.current = Date.now();

    measurementTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - measurementStartTimeRef.current;
      const progress = Math.min((elapsed / 10000) * 100, 100);
      setMeasurementProgress(progress);

      if (elapsed >= 10000) {
        stopMeasurement();
      }
    }, 100);
  }, [running, stopMeasurement]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setStatus('중지됨');

    stopMeasurement();

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

    // 렌더러 클리어
    pose2DRef.current?.clear();
    pose3DRef.current?.clear();
  }, [stopMeasurement]);

  // 1) Landmarker 초기화(한 번만)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        setStatus('모델/런타임 로딩 중...');

        const vision = await FilesetResolver.forVisionTasks(
          `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`
        );

        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 2,
          minPoseDetectionConfidence: 0.8,
          minPosePresenceConfidence: 0.8,
          outputSegmentationMasks: false, // MVP면 보통 꺼도 됨
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

    return () => stop();
  }, [stop]);

  async function start() {
    if (runningRef.current) return;
    if (!landmarkerRef.current) {
      setStatus('아직 로딩 중입니다.');
      return;
    }

    try {
      const video = videoRef.current!;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;

      await video.play().catch(() => {});

      // 비디오 메타데이터 준비 대기
      await new Promise<void>(resolve => {
        const onLoadedMetadata = () => {
          const vw = video.videoWidth || 640;
          const vh = video.videoHeight || 480;

          // 2D 캔버스 크기 설정
          pose2DRef.current?.setCanvasSize(vw, vh);

          resolve();
        };

        if (video.readyState >= 1) onLoadedMetadata();
        else
          video.addEventListener('loadedmetadata', onLoadedMetadata, {
            once: true,
          });
      });

      runningRef.current = true;
      setRunning(true);
      setStatus('실시간 추적 중...');

      const predict = () => {
        if (!landmarkerRef.current || !videoRef.current) {
          return;
        }
        if (!runningRef.current) return;

        const video = videoRef.current;

        if (video.readyState < 2) {
          rafRef.current = requestAnimationFrame(predict);
          return;
        }

        const nowVideoTime = video.currentTime;
        const nowMs = performance.now();

        if (lastVideoTimeRef.current !== nowVideoTime) {
          lastVideoTimeRef.current = nowVideoTime;

          landmarkerRef.current.detectForVideo(video, nowMs, result => {
            // 2D 랜드마크 업데이트
            const lm2d = result.landmarks?.[0];
            if (lm2d && lm2d.length) {
              pose2DRef.current?.updateLandmarks(lm2d as any);
            }

            // 3D 월드 랜드마크 업데이트
            const lm3d = result.worldLandmarks?.[0];
            if (lm3d && lm3d.length) {
              pose3DRef.current?.updateWorldLandmarks(lm3d as any);

              // 측정 중일 때 랜드마크 데이터 수집
              if (isMeasuringRef.current && lm3d.length >= 13) {
                measurementDataRef.current.push({
                  nose: { x: lm3d[0].x, y: lm3d[0].y, z: lm3d[0].z },
                  leftEyeInner: { x: lm3d[1].x, y: lm3d[1].y, z: lm3d[1].z },
                  leftEye: { x: lm3d[2].x, y: lm3d[2].y, z: lm3d[2].z },
                  leftEyeOuter: { x: lm3d[3].x, y: lm3d[3].y, z: lm3d[3].z },
                  rightEyeInner: { x: lm3d[4].x, y: lm3d[4].y, z: lm3d[4].z },
                  rightEye: { x: lm3d[5].x, y: lm3d[5].y, z: lm3d[5].z },
                  rightEyeOuter: { x: lm3d[6].x, y: lm3d[6].y, z: lm3d[6].z },
                  leftEar: { x: lm3d[7].x, y: lm3d[7].y, z: lm3d[7].z },
                  rightEar: { x: lm3d[8].x, y: lm3d[8].y, z: lm3d[8].z },
                  mouthLeft: { x: lm3d[9].x, y: lm3d[9].y, z: lm3d[9].z },
                  mouthRight: { x: lm3d[10].x, y: lm3d[10].y, z: lm3d[10].z },
                  leftShoulder: { x: lm3d[11].x, y: lm3d[11].y, z: lm3d[11].z },
                  rightShoulder: {
                    x: lm3d[12].x,
                    y: lm3d[12].y,
                    z: lm3d[12].z,
                  },
                });
              }
            }
          });
        }

        rafRef.current = requestAnimationFrame(predict);
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
      {/* Completion Panel */}
      {avgMeasurementData && (
        <div className="mb-8 rounded-xl border border-success bg-gradient-to-r from-success/10 to-success/5 p-8 shadow-soft">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500" />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-text">
                측정이 완료되었습니다!
              </h3>
            </div>
            <Button onClick={handleNextPage} variant="accent" size="lg">
              다음 단계로 이동
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8">
        {/* 개발 디버깅용 안보이는 버튼 */}
        <button
          className=""
          onClick={() => {
            setDeveloperMode(!developerMode);
          }}
        >
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </button>
        <h2 className="mb-2 text-3xl font-bold text-text">초기 정자세 설정</h2>
        <p className="text-muted text-sm">정자세를 유지해주세요.</p>
      </div>

      {/* Control Panel */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={running ? stop : start}
              variant={running ? 'secondary' : 'primary'}
              size="lg"
              disabled={!isReady && !running}
            >
              {running ? 'Stop' : 'Start'}
            </Button>

            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${running ? 'animate-pulse bg-success' : 'bg-muted'}`}
              />
              <span className="text-sm text-text-muted">{status}</span>
            </div>
          </div>
          <div className="ml-auto">
            <Button
              onClick={isMeasuring ? stopMeasurement : startMeasurement}
              variant={isMeasuring ? 'secondary' : 'primary'}
              size="lg"
              disabled={!running}
            >
              {isMeasuring
                ? `측정 중... ${measurementProgress.toFixed(0)}%`
                : '측정 시작'}
            </Button>
          </div>
        </div>
      </div>

      {/* Video + 2D overlay */}
      <div
        className={`relative overflow-hidden rounded-xl border ${isMeasuring ? 'border-blue-500 border-4' : 'border-border'} bg-bg shadow-soft transition-all`}
      >
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
        {isMeasuring && (
          <div className="absolute left-4 top-4 z-20 rounded-lg bg-blue-500 px-4 py-2 text-white font-semibold shadow-lg">
            측정 중... {measurementProgress.toFixed(0)}%
          </div>
        )}
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

      {/* 3D Pose Renderer (개발자 모드) */}
      <div
        className={`mt-6 overflow-hidden rounded-xl border border-border bg-bg shadow-soft ${
          developerMode ? '' : 'hidden'
        }`}
      >
        <div className="border-b border-border px-4 py-3 text-sm text-text-muted">
          3D Pose View (worldLandmarks)
        </div>
        <Pose3DRenderer ref={pose3DRef} className="h-[480px] w-full" />
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
