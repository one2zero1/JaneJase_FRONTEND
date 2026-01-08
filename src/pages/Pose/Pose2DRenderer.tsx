import { useRef, useImperativeHandle, forwardRef } from 'react';
import { PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

export interface Pose2DRendererRef {
  updateLandmarks: (
    landmarks: Array<{
      x: number;
      y: number;
      z?: number;
      visibility?: number;
      presence?: number;
    }>
  ) => void;
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

  function emaSmooth2DLandmarks(
    lm: Array<{
      x: number;
      y: number;
      z?: number;
      visibility?: number;
      presence?: number;
    }>,
    alpha = 0.25,
    minConf = 0.5
  ) {
    const n = lm.length;
    const needed = n * 3;

    if (!ema2DRef.current || ema2DRef.current.length !== needed) {
      ema2DRef.current = new Float32Array(needed);
      ema2DInitedRef.current = false;
    }

    const buf = ema2DRef.current;

    if (!ema2DInitedRef.current) {
      for (let i = 0; i < n; i++) {
        const p = lm[i];
        buf[i * 3 + 0] = p.x;
        buf[i * 3 + 1] = p.y;
        buf[i * 3 + 2] = p.z ?? 0;
      }
      ema2DInitedRef.current = true;
    } else {
      for (let i = 0; i < n; i++) {
        const p = lm[i];
        const conf = Math.min(p.visibility ?? 1, p.presence ?? 1);
        if (conf < minConf) continue;

        const ix = i * 3;
        buf[ix + 0] = alpha * p.x + (1 - alpha) * buf[ix + 0];
        buf[ix + 1] = alpha * p.y + (1 - alpha) * buf[ix + 1];
        buf[ix + 2] = alpha * (p.z ?? 0) + (1 - alpha) * buf[ix + 2];
      }
    }

    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      out[i] = {
        x: buf[ix + 0],
        y: buf[ix + 1],
        z: buf[ix + 2],
        visibility: lm[i].visibility,
        presence: lm[i].presence,
      };
    }
    return out;
  }

  useImperativeHandle(ref, () => ({
    updateLandmarks: landmarks => {
      if (!canvasRef.current || !ctxRef.current || !drawingUtilsRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const drawingUtils = drawingUtilsRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks && landmarks.length) {
        const smoothed = emaSmooth2DLandmarks(landmarks, 0.25, 0.5);
        drawingUtils.drawLandmarks(smoothed, { radius: 4 });
        drawingUtils.drawConnectors(smoothed, PoseLandmarker.POSE_CONNECTIONS, {
          lineWidth: 2,
        });
      }
    },

    clear: () => {
      if (!canvasRef.current || !ctxRef.current) return;
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ema2DRef.current = null;
      ema2DInitedRef.current = false;
    },

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
