import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Coordinate } from '@/types/poseTypes';
import * as THREE from 'three';
import { PoseLandmarker } from '@mediapipe/tasks-vision';

type MPConnection = { start: number; end: number };

export interface Pose3DRendererRef {
  updateWorldLandmarks: (
    worldLandmarks: Array<{
      x: number;
      y: number;
      z: number;
      visibility?: number;
      presence?: number;
    }>
  ) => void;
  clear: () => void;
}

interface Pose3DRendererProps {
  className?: string;
}

export const Pose3DRenderer = forwardRef<
  Pose3DRendererRef,
  Pose3DRendererProps
>(({ className }, ref) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    pointsGeom: THREE.BufferGeometry;
    points: THREE.Points;
    linesGeom: THREE.BufferGeometry;
    lines: THREE.LineSegments;
    positionsPoints: Float32Array;
    positionsLines: Float32Array;
    connections: MPConnection[];
    resizeObserver?: ResizeObserver;
  } | null>(null);

  const emaWorldRef = useRef<Float32Array | null>(null);
  const emaInitedRef = useRef(false);

  /**
   * Three.js 3D 렌더링 환경을 초기화
   * - WebGL 렌더러, 씬, 카메라 생성
   * - 포즈 랜드마크 점과 연결선을 위한 지오메트리 설정
   * - 반응형 크기 조정을 위한 ResizeObserver 설정
   */
  const initThree = () => {
    const mount = mountRef.current;
    if (!mount) return;
    if (threeRef.current) return;

    mount.innerHTML = '';

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth || 800, mount.clientHeight || 480);
    renderer.setClearColor(0x0b1020, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);

    const aspect = (mount.clientWidth || 800) / (mount.clientHeight || 480);
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.01, 50);
    camera.position.set(0, 0.2, 2.2);
    camera.lookAt(0, 0.2, 0);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const N = 33;

    const positionsPoints = new Float32Array(N * 3);
    const pointsGeom = new THREE.BufferGeometry();
    pointsGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(positionsPoints, 3)
    );
    const pointsMat = new THREE.PointsMaterial({ size: 0.04, color: 0xff3355 });
    const points = new THREE.Points(pointsGeom, pointsMat);
    scene.add(points);

    const connections =
      PoseLandmarker.POSE_CONNECTIONS as unknown as MPConnection[];
    const positionsLines = new Float32Array(connections.length * 2 * 3);
    const linesGeom = new THREE.BufferGeometry();
    linesGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(positionsLines, 3)
    );
    const linesMat = new THREE.LineBasicMaterial({ color: 0x22c55e });
    const lines = new THREE.LineSegments(linesGeom, linesMat);
    scene.add(lines);
    scene.add(new THREE.AxesHelper(0.5));

    renderer.render(scene, camera);

    const ro = new ResizeObserver(() => {
      if (!threeRef.current || !mountRef.current) return;
      const mw = mountRef.current.clientWidth;
      const mh = mountRef.current.clientHeight;
      threeRef.current.renderer.setSize(mw, mh);
      threeRef.current.camera.aspect = mw / mh;
      threeRef.current.camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    threeRef.current = {
      renderer,
      scene,
      camera,
      pointsGeom,
      points,
      linesGeom,
      lines,
      positionsPoints,
      positionsLines,
      connections,
      resizeObserver: ro,
    };
  };

  /**
   * Three.js 리소스를 정리하고 메모리 해제
   * - 지오메트리, 머티리얼, 렌더러 dispose
   * - ResizeObserver 연결 해제
   */
  const disposeThree = () => {
    const t = threeRef.current;
    if (!t) return;

    t.resizeObserver?.disconnect();
    t.pointsGeom.dispose();
    (t.points.material as THREE.Material).dispose();
    t.linesGeom.dispose();
    (t.lines.material as THREE.Material).dispose();
    t.renderer.dispose();

    if (mountRef.current) mountRef.current.innerHTML = '';
    threeRef.current = null;
  };

  useEffect(() => {
    initThree();
    return () => {
      disposeThree();
    };
  }, []);

  /**
   * 3D 월드 랜드마크 데이터를 Three.js 씬에 반영
   * - 양 어깨 중심점을 기준으로 좌표 정규화
   * - 포즈 점과 연결선의 버퍼 지오메트리 업데이트
   * @param worldLm - 3D 월드 좌표 랜드마크 배열
   */
  const updateThreeFromWorldLandmarks = (worldLm: Array<Coordinate>) => {
    const t = threeRef.current;
    if (!t) return;
    if (worldLm.length < 13) return;

    const LS = worldLm[11];
    const RS = worldLm[12];
    const cx = (LS.x + RS.x) / 2;
    const cy = (LS.y + RS.y) / 2;
    const cz = (LS.z + RS.z) / 2;

    const SCALE = 2.5;

    for (let i = 0; i < Math.min(33, worldLm.length); i++) {
      const p = worldLm[i];
      const x = (p.x - cx) * SCALE;
      const y = -(p.y - cy) * SCALE;
      const z = -(p.z - cz) * SCALE;

      t.positionsPoints[i * 3 + 0] = x;
      t.positionsPoints[i * 3 + 1] = y;
      t.positionsPoints[i * 3 + 2] = z;
    }
    (t.pointsGeom.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;

    let k = 0;
    for (const c of t.connections) {
      const a = c.start;
      const b = c.end;

      const pa = worldLm[a];
      const pb = worldLm[b];
      if (!pa || !pb) continue;

      const ax = (pa.x - cx) * SCALE;
      const ay = -(pa.y - cy) * SCALE;
      const az = -(pa.z - cz) * SCALE;

      const bx = (pb.x - cx) * SCALE;
      const by = -(pb.y - cy) * SCALE;
      const bz = -(pb.z - cz) * SCALE;

      t.positionsLines[k++] = ax;
      t.positionsLines[k++] = ay;
      t.positionsLines[k++] = az;

      t.positionsLines[k++] = bx;
      t.positionsLines[k++] = by;
      t.positionsLines[k++] = bz;
    }
    (t.linesGeom.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;

    t.renderer.render(t.scene, t.camera);
  };

  /**
   * 3D 월드 랜드마크를 EMA(Exponential Moving Average) 알고리즘으로 부드럽게 처리
   * @param worldLm - 원본 3D 월드 랜드마크 배열
   * @param alpha - 평활화 계수 (0~1, 높을수록 현재 값에 가중치)
   * @param minConf - 최소 신뢰도 임계값 (이보다 낮은 랜드마크는 평활화에서 제외)
   * @returns 평활화된 3D 랜드마크 배열
   */
  const emaSmoothWorldLandmarks = (
    worldLm: Array<{
      x: number;
      y: number;
      z: number;
      visibility?: number;
      presence?: number;
    }>,
    alpha = 0.2,
    minConf = 0.5
  ): Array<Coordinate> => {
    const n = worldLm.length;
    const needed = n * 3;

    if (!emaWorldRef.current || emaWorldRef.current.length !== needed) {
      emaWorldRef.current = new Float32Array(needed);
      emaInitedRef.current = false;
    }

    const buf = emaWorldRef.current;

    if (!emaInitedRef.current) {
      for (let i = 0; i < n; i++) {
        const p = worldLm[i];
        buf[i * 3 + 0] = p.x;
        buf[i * 3 + 1] = p.y;
        buf[i * 3 + 2] = p.z;
      }
      emaInitedRef.current = true;
    } else {
      for (let i = 0; i < n; i++) {
        const p = worldLm[i];
        const conf = Math.min(p.visibility ?? 1, p.presence ?? 1);
        if (conf < minConf) continue;

        const ix = i * 3;
        buf[ix + 0] = alpha * p.x + (1 - alpha) * buf[ix + 0];
        buf[ix + 1] = alpha * p.y + (1 - alpha) * buf[ix + 1];
        buf[ix + 2] = alpha * p.z + (1 - alpha) * buf[ix + 2];
      }
    }

    const smoothed: Array<Coordinate> = new Array(n);
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      smoothed[i] = { x: buf[ix + 0], y: buf[ix + 1], z: buf[ix + 2] };
    }
    return smoothed;
  };

  useImperativeHandle(ref, () => ({
    /**
     * 3D 씬에 월드 랜드마크를 업데이트
     * @param worldLandmarks - 업데이트할 3D 월드 랜드마크 데이터
     */
    updateWorldLandmarks: worldLandmarks => {
      if (worldLandmarks && worldLandmarks.length) {
        const smoothed = emaSmoothWorldLandmarks(worldLandmarks, 0.2, 0.5);
        updateThreeFromWorldLandmarks(smoothed);
      }
    },

    /**
     * EMA 평활화 버퍼를 초기화
     */
    clear: () => {
      emaWorldRef.current = null;
      emaInitedRef.current = false;
    },
  }));

  return <div ref={mountRef} className={className} />;
});

Pose3DRenderer.displayName = 'Pose3DRenderer';
