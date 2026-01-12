import { useRef, useImperativeHandle, forwardRef } from 'react';
import { PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { emaSmooth2DLandmarks } from '@/utils/detectPose';
import type { MediapipeLandmark } from '@/types/poseTypes';

export interface Pose2DRendererRef {
  updateLandmarks: (landmarks: MediapipeLandmark[]) => void;
  clear: () => void;
  setCanvasSize: (width: number, height: number) => void;
}

interface Pose2DRendererProps {
  className?: string;
}

export const Pose2DRenderer = forwardRef<
  Pose2DRendererRef,
  Pose2DRendererProps
>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const ema2DRef = useRef<Float32Array | null>(null);
  const ema2DInitedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    /**
     * 2D 캔버스에 포즈 랜드마크를 그리기 (점과 연결선)
     * @param landmarks - 업데이트할 랜드마크 데이터
     */
    updateLandmarks: landmarks => {
      if (!canvasRef.current || !ctxRef.current || !drawingUtilsRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const drawingUtils = drawingUtilsRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks && landmarks.length) {
        const { smoothedLandmarks, updatedBuffer, updatedInited } =
          emaSmooth2DLandmarks(
            landmarks,
            ema2DRef.current,
            ema2DInitedRef.current,
            0.25,
            0.5
          );

        ema2DRef.current = updatedBuffer;
        ema2DInitedRef.current = updatedInited;

        drawingUtils.drawLandmarks(smoothedLandmarks, { radius: 4 });
        drawingUtils.drawConnectors(
          smoothedLandmarks,
          PoseLandmarker.POSE_CONNECTIONS,
          {
            lineWidth: 2,
          }
        );
      }
    },

    /**
     * 캔버스를 초기화하고 EMA 버퍼를 리셋
     */
    clear: () => {
      if (!canvasRef.current || !ctxRef.current) return;
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ema2DRef.current = null;
      ema2DInitedRef.current = false;
    },

    /**
     * 캔버스 크기를 설정하고 그리기 컨텍스트를 초기화
     * @param width - 캔버스 너비
     * @param height - 캔버스 높이
     */
    setCanvasSize: (width, height) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx) {
        ctxRef.current = ctx;
        drawingUtilsRef.current = new DrawingUtils(ctx);
      }
    },
  }));

  return <canvas ref={canvasRef} className={className} />;
});

Pose2DRenderer.displayName = 'Pose2DRenderer';
