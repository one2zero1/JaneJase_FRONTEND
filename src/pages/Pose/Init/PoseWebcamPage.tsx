import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pose2DRenderer } from '../Pose2DRenderer';
import { Pose3DRenderer } from '../Pose3DRenderer';
import type { Pose2DRendererRef } from '../Pose2DRenderer';
import type { Pose3DRendererRef } from '../Pose3DRenderer';
import type { Coordinate, MeasurementData } from '@/types/poseTypes';
import { getCenter, dist2D } from '@/utils/detectPose';
import { usePoseStore } from '@/stores/usePoseStore';
import useGoogleStore from '@/stores/useAuthStore';
import standardPoseImg from '@/assets/imgs/standardPose.png';

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
      nose: Coordinate;
      leftEyeInner: Coordinate;
      leftEye: Coordinate;
      leftEyeOuter: Coordinate;
      rightEyeInner: Coordinate;
      rightEye: Coordinate;
      rightEyeOuter: Coordinate;
      leftEar: Coordinate;
      rightEar: Coordinate;
      mouthLeft: Coordinate;
      mouthRight: Coordinate;
      leftShoulder: Coordinate;
      rightShoulder: Coordinate;
      leftHip: Coordinate;
      rightHip: Coordinate;
    }>
  >([]);

  const measurementTimerRef = useRef<number | null>(null);
  const measurementStartTimeRef = useRef<number>(0);

  const saveStandardData = usePoseStore(state => state.saveStandardData);
  const user = useGoogleStore(state => state.user);

  const handleNextPage = async () => {
    try {
      if (!avgMeasurementData) {
        throw new Error('측정 데이터가 없습니다.');
      }

      const pose_id = await saveStandardData({
        user_id: user?.id || '',
        measurement: avgMeasurementData,
        ended_at: null,
      });

      if (pose_id) {
        navigate('/pose/dashboard', {
          state: {
            measurementData: avgMeasurementData,
            pose_id: pose_id,
          },
        });
      }
    } catch (error) {
      console.error('Standard Data 저장 실패:', error);
    }
  };

  const calculateAverage = (points: Array<Coordinate>) => {
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
        leftHip: calculateAverage(data.map(d => d.leftHip)),
        rightHip: calculateAverage(data.map(d => d.rightHip)),
      };

      // 어깨/힙 중심과 너비 계산 및 추가 (스케일은 2D로 정규화하는 것이 더 안정적)
      const shoulderCenter = getCenter(
        avgData.leftShoulder,
        avgData.rightShoulder
      );
      const shoulderWidth = dist2D(avgData.leftShoulder, avgData.rightShoulder);
      const hipCenter = getCenter(avgData.leftHip, avgData.rightHip);
      const hipWidth = dist2D(avgData.leftHip, avgData.rightHip);

      setAvgMeasurementData({
        ...avgData,
        shoulderCenter,
        shoulderWidth,
        hipCenter,
        hipWidth,
      });

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

              // 측정 중일 때 랜드마크 데이터 수집
              // hip(23,24)까지 쓰므로 길이 체크
              if (isMeasuringRef.current && lm2d.length >= 25) {
                measurementDataRef.current.push({
                  nose: { x: lm2d[0].x, y: lm2d[0].y, z: lm2d[0].z },
                  leftEyeInner: { x: lm2d[1].x, y: lm2d[1].y, z: lm2d[1].z },
                  leftEye: { x: lm2d[2].x, y: lm2d[2].y, z: lm2d[2].z },
                  leftEyeOuter: { x: lm2d[3].x, y: lm2d[3].y, z: lm2d[3].z },
                  rightEyeInner: { x: lm2d[4].x, y: lm2d[4].y, z: lm2d[4].z },
                  rightEye: { x: lm2d[5].x, y: lm2d[5].y, z: lm2d[5].z },
                  rightEyeOuter: { x: lm2d[6].x, y: lm2d[6].y, z: lm2d[6].z },
                  leftEar: { x: lm2d[7].x, y: lm2d[7].y, z: lm2d[7].z },
                  rightEar: { x: lm2d[8].x, y: lm2d[8].y, z: lm2d[8].z },
                  mouthLeft: { x: lm2d[9].x, y: lm2d[9].y, z: lm2d[9].z },
                  mouthRight: { x: lm2d[10].x, y: lm2d[10].y, z: lm2d[10].z },
                  leftShoulder: { x: lm2d[11].x, y: lm2d[11].y, z: lm2d[11].z },
                  rightShoulder: {
                    x: lm2d[12].x,
                    y: lm2d[12].y,
                    z: lm2d[12].z,
                  },
                  leftHip: { x: lm2d[23].x, y: lm2d[23].y, z: lm2d[23].z },
                  rightHip: { x: lm2d[24].x, y: lm2d[24].y, z: lm2d[24].z },
                });
              }
            }

            // 3D 월드 랜드마크 업데이트
            const lm3d = result.worldLandmarks?.[0];
            if (lm3d && lm3d.length) {
              pose3DRef.current?.updateWorldLandmarks(lm3d as any);
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
    <div className="mx-auto w-full max-w-4xl px-4 py-4 md:py-8">
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
        <div className="flex items-center gap-2 mb-2 relative z-50">
          <h2 className="text-2xl font-bold text-text md:text-3xl">
            초기 정자세 설정
          </h2>
          <div className="relative group">
            <span className="material-symbols-outlined text-2xl text-text-muted hover:text-text cursor-help transition-colors">
              help
            </span>
            {/* Tooltip Content */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 absolute left-full top-48 -translate-y-1/2 ml-4 w-[400px] bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border p-4 z-50 pointer-events-none group-hover:pointer-events-auto">
              <div className="space-y-3">
                <div className="font-bold text-lg mb-2">정자세 가이드</div>
                <div className="flex justify-center overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
                  <img
                    src={standardPoseImg}
                    alt="정자세 가이드"
                    className="w-full object-contain"
                  />
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  위 예시처럼 정면을 보고 허리를 펴 바른 자세를 취해주세요.
                  <br />
                  Start 버튼을 누르고 측정 시작을 눌러 10초간 자세를 유지하면
                  측정이 완료됩니다.
                </p>
              </div>
              {/* Arrow */}
              <div className="absolute right-[100%] top-1/2 -translate-y-1/2 border-8 border-transparent border-r-surface dark:border-r-surface-dark drop-shadow-sm"></div>
            </div>
          </div>
        </div>
        <p className="text-muted text-sm">정자세를 유지해주세요.</p>
      </div>

      {/* Control Panel */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
            <Button
              className={`w-full md:w-auto`}
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
          <div className="ml-auto w-full md:w-auto">
            <Button
              className={`w-full md:w-auto`}
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

      {/* Completion Panel */}
      {avgMeasurementData && (
        <div className="mb-8 rounded-xl border border-success bg-gradient-to-r from-success/10 to-success/5 p-4 shadow-soft md:p-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
              <span className="material-symbols-outlined text-4xl text-white">
                check_circle
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-text">
                측정이 완료되었습니다!
              </h3>
            </div>
            <Button onClick={handleNextPage} variant="accent" size="lg">
              자세 교정하러 가기
            </Button>
          </div>
        </div>
      )}

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
                videocam
              </span>
              <p className="text-muted">
                웹캠을 시작하려면 Start 버튼을 눌러주세요
              </p>
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
