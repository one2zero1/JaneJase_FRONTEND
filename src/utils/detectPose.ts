import type { Coordinate, MediapipeLandmark } from '../types/poseTypes';

/**
 * 지표 설계 원칙
 * - MediaPipe 2D landmarks는 (x,y)가 이미지 좌표(0~1), y는 아래로 증가
 * - z는 카메라에 가까울수록 더 작은(보통 더 음수) 값
 * - “각도”는 사람이 직관적으로 보기 좋게 0~90 범위로 만드는 것이 목적
 */

// 고개 숙임(목 꺾임) 임계값 ("baseline 대비 얼마나 나빠졌는지" diff 기준)
const dangerThresholdHeaddown = 15;
const warningThresholdHeaddown = 10;

// 거북목(머리 전방) 임계값
const dangerThresholdHeadForward = 20;
const warningThresholdHeadForward = 10;

// 어깨/상체 기울기 임계값
// 기존 코드에서는 danger=5, warning=10으로 되어 warning이 사실상 절대 뜨지 않는 버그가 있었습니다.
const warningThresholdUpperbodyLean = 5;
const dangerThresholdUpperbodyLean = 10;

const EPS = 1e-6;

// ------------------------------
// geometry helpers
// ------------------------------

// 두 좌표 사이의 거리(3D)
export function dist(left: Coordinate, right: Coordinate) {
  return Math.hypot(
    right.x - left.x,
    right.y - left.y,
    (right.z ?? 0) - (left.z ?? 0)
  );
}

// 두 좌표 사이의 거리(2D) - 스케일 정규화용(권장)
export function dist2D(left: Coordinate, right: Coordinate) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

// 두 좌표 사이의 중간점
export function getCenter(left: Coordinate, right: Coordinate) {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: ((left.z ?? 0) + (right.z ?? 0)) / 2,
  };
}

// 두 좌표 간의 차이
export function delta(current: Coordinate, standard: Coordinate) {
  return {
    x: current.x - standard.x,
    y: current.y - standard.y,
    z: (current.z ?? 0) - (standard.z ?? 0),
  };
}

// ------------------------------
// posture metrics
// ------------------------------

/**
 * 고개 숙임 지표 (baseline 대비 "좋은" 각도는 크게 나오게 설계)
 *
 * - verticalUp = shoulderCenter.y - nose.y
 *   (y는 아래로 증가이므로, 코가 어깨보다 위에 있을수록 verticalUp이 큼)
 * - shoulderWidth는 2D(권장)로 정규화
 * - 결과: 0~90도 근처
 *   좋은 자세(코가 충분히 위) → 각도 큼
 *   고개 숙임(코가 내려감) → 각도 작아짐
 */
export function noseToShoulderDegree(
  nose: Coordinate,
  shoulderCenter: Coordinate,
  shoulderWidth2D: number
) {
  const verticalUp = shoulderCenter.y - nose.y;
  const radians = Math.atan2(
    Math.max(verticalUp, 0),
    Math.max(shoulderWidth2D, EPS)
  );
  return (radians * 180) / Math.PI;
}

/**
 * 거북목(머리 전방) 지표
 *
 * 기존 문제점: y(높이)까지 넣어서 "고개 숙임"이 "거북목"으로 과하게 섞이는 현상이 발생.
 * 해결: 전방 이동은 z(깊이)만으로 보고, 스케일은 shoulderWidth2D로 정규화.
 *
 * - forward = shoulderCenter.z - earCenter.z
 *   (z는 가까울수록 더 작은 값 → 머리가 앞으로 가면 ear.z가 더 작아져 forward가 커짐)
 * - 각도는 "좋은" 자세가 크게 나오도록 atan2(width, forward) 사용
 *   forward 커짐(거북목) → 각도 작아짐
 */
export function earsToShoulderDegree(
  leftEar: Coordinate,
  rightEar: Coordinate,
  shoulderCenter: Coordinate,
  shoulderWidth2D: number
) {
  const earCenter = getCenter(leftEar, rightEar);
  const forward = shoulderCenter.z - (earCenter.z ?? 0);

  // forward가 음수면(귀가 어깨보다 멀리 있는 경우) 거북목이 아니라서 0으로 처리
  const f = Math.max(forward, EPS);
  const radians = Math.atan2(Math.max(shoulderWidth2D, EPS), f);
  return (radians * 180) / Math.PI;
}

/**
 * 어깨/상체 기울기(좌우 기울어 앉기) 지표
 *
 * - 어깨선 기울기만 쓰면 "손 들기"(팔 동작)로 어깨 landmark가 흔들릴 때 각도가 급상승할 수 있음.
 * - 해결: 힙(골반) 기울기를 함께 사용해서 안정화.
 *   - armsRaised=true이면 shoulders 비중을 낮추고 hips 비중을 높임
 *
 * 반환값: 0~90도
 */
export function shoulderLeanDegree(
  leftShoulder: Coordinate,
  rightShoulder: Coordinate,
  leftHip: Coordinate,
  rightHip: Coordinate,
  armsRaised = false
) {
  const shoulderRise = Math.abs(rightShoulder.y - leftShoulder.y);
  const shoulderRun = Math.abs(rightShoulder.x - leftShoulder.x) + EPS;
  const shoulderTilt = (Math.atan2(shoulderRise, shoulderRun) * 180) / Math.PI;

  const hipRise = Math.abs(rightHip.y - leftHip.y);
  const hipRun = Math.abs(rightHip.x - leftHip.x) + EPS;
  const hipTilt = (Math.atan2(hipRise, hipRun) * 180) / Math.PI;

  const wShoulder = armsRaised ? 0.2 : 0.7;
  return wShoulder * shoulderTilt + (1 - wShoulder) * hipTilt;
}

// ------------------------------
// classification
// ------------------------------

export function detectBadPose(
  standardNSDegree: number,
  standardESDegree: number,
  standardShoulderLeanDegree: number,
  currentNSDegree: number,
  currentESDegree: number,
  currentShoulderLeanDegree: number
) {
  // diff는 "baseline 대비 얼마나 나빠졌는지"를 + 값으로
  // 고개숙임/거북목 지표는 "좋을수록 각도 큼" → 나빠지면 각도 감소
  const diffNSDegree = Math.max(standardNSDegree - currentNSDegree, 0);
  const diffESDegree = Math.max(standardESDegree - currentESDegree, 0);

  // 어깨 기울기는 0에 가까울수록 좋고, 좌우 어느 방향이든 나쁠 수 있으므로 절댓값 편차
  const diffShoulderLeanDegree = Math.abs(
    currentShoulderLeanDegree - standardShoulderLeanDegree
  );

  let headdownStatus = 'normal';
  let headforwardStatus = 'normal';
  let shoulderLeanStatus = 'normal';

  if (diffNSDegree > dangerThresholdHeaddown) headdownStatus = 'danger';
  else if (diffNSDegree > warningThresholdHeaddown) headdownStatus = 'warning';

  if (diffESDegree > dangerThresholdHeadForward) headforwardStatus = 'danger';
  else if (diffESDegree > warningThresholdHeadForward)
    headforwardStatus = 'warning';

  if (diffShoulderLeanDegree > dangerThresholdUpperbodyLean)
    shoulderLeanStatus = 'danger';
  else if (diffShoulderLeanDegree > warningThresholdUpperbodyLean)
    shoulderLeanStatus = 'warning';

  return {
    diffNSDegree,
    diffESDegree,
    diffShoulderLeanDegree,
    headdownStatus,
    headforwardStatus,
    shoulderLeanStatus,
  };
}

/**
 * 2D 랜드마크를 EMA(Exponential Moving Average) 알고리즘으로 부드럽게 처리하는 순수 함수
 * @param lm - 원본 랜드마크 배열
 * @param emaBuffer - 이전 프레임의 버퍼 (없거나 크기가 안 맞으면 새로 생성됨)
 * @param emaInited - 초기화 여부
 * @param alpha - 평활화 계수 (0~1, 클수록 현재 값 비중 높음)
 * @param minConf - 최소 신뢰도
 * @returns {smoothedLandmarks, updatedBuffer, updatedInited}
 */
export function emaSmooth2DLandmarks(
  lm: MediapipeLandmark[],
  emaBuffer: Float32Array | null,
  emaInited: boolean,
  alpha = 0.25,
  minConf = 0.5
) {
  const n = lm.length;
  const needed = n * 3;

  let buffer = emaBuffer;
  let inited = emaInited;

  if (!buffer || buffer.length !== needed) {
    buffer = new Float32Array(needed);
    inited = false;
  }

  const buf = buffer;

  if (!inited) {
    for (let i = 0; i < n; i++) {
      const p = lm[i];
      buf[i * 3 + 0] = p.x;
      buf[i * 3 + 1] = p.y;
      buf[i * 3 + 2] = p.z ?? 0;
    }
    inited = true;
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

  return { smoothedLandmarks: out, updatedBuffer: buf, updatedInited: inited };
}
