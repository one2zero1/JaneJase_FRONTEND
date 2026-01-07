import React, { useEffect, useRef, useState } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

const TASKS_VERSION = "0.10.0";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export default function PoseWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const initializedRef = useRef(false);

  const [status, setStatus] = useState("초기화 중...");
  const [running, setRunning] = useState(false);

  // 1) Landmarker 초기화(한 번만)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        setStatus("모델/런타임 로딩 중...");

        // wasm 로더 경로(여기만 맞으면 Vite에서도 잘 돕니다)
        const vision = await FilesetResolver.forVisionTasks(
          `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`
        );

        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU", // 문제 생기면 "CPU"로 바꿔서 테스트
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        setStatus("준비 완료! Start를 눌러주세요.");
      } catch (e) {
        console.error(e);
        setStatus("초기화 실패(콘솔 확인). delegate를 CPU로 바꿔보세요.");
      }
    })();

    return () => {
      // 언마운트 시 정리
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    if (running) return;
    if (!landmarkerRef.current) {
      setStatus("아직 로딩 중입니다.");
      return;
    }

    try {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const drawingUtils = new DrawingUtils(ctx);

      // 웹캠 연결
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;

      // 비디오 준비될 때 캔버스 사이즈 맞추기
      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          resolve();
        };
        video.addEventListener("loadeddata", onLoaded, { once: true });
      });

      setRunning(true);
      setStatus("실시간 추적 중...");

      const predict = () => {
        if (!landmarkerRef.current || !videoRef.current || !canvasRef.current) return;
        if (!running) return;

        const nowVideoTime = video.currentTime;
        if (lastVideoTimeRef.current !== nowVideoTime) {
          lastVideoTimeRef.current = nowVideoTime;

          const nowMs = performance.now();
          landmarkerRef.current.detectForVideo(video, nowMs, (result) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const landmark of result.landmarks ?? []) {
              drawingUtils.drawLandmarks(landmark);
              drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            }
          });
        }

        rafRef.current = requestAnimationFrame(predict);
      };

      rafRef.current = requestAnimationFrame(predict);
    } catch (e) {
      console.error(e);
      setStatus("웹캠 권한이 필요합니다(브라우저/OS 설정 확인).");
      setRunning(false);
    }
  }

  function stop() {
    setRunning(false);
    setStatus("중지됨");

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <h2>PoseLandmarker Webcam Test (React)</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={running ? stop : start}>
          {running ? "Stop" : "Start"}
        </button>
        <span style={{ opacity: 0.8 }}>{status}</span>
      </div>

      <div style={{ position: "relative", marginTop: 12 }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }} />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "auto",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
