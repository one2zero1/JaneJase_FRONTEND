import type { Coordinate } from '../types/poseTypes';

// 머리숙임 임계값
const dangerThresholdHeaddown = 15;
const warningThresholdHeaddown = 10;
// const dangerThresholdHeaddown = 20;
// const warningThresholdHeaddown = 10;

// 거북목 임계값
const dangerThresholdHeadForward = 20;
const warningThresholdHeadForward = 10;
// const dangerThresholdHeadForward = 50;
// const warningThresholdHeadForward = 45;

// 상체 기울임 임계값
const dangerThresholdUpperbodyLean = 5;
const warningThresholdUpperbodyLean = 10;

// 두 좌표 사이의 거리(유클리드) 계산 함수
export function dist(left: Coordinate, right: Coordinate) {
  return Math.hypot(right.x - left.x, right.y - left.y, right.z - left.z);
}

// 두 좌표 사이의 중간점 계산 함수
export function getCenter(left: Coordinate, right: Coordinate) {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  };
}

// 두 좌표 간의 차이 계산 함수
export function delta(current: Coordinate, standard: Coordinate) {
  return {
    x: current.x - standard.x,
    y: current.y - standard.y,
    z: current.z - standard.z,
  };
}

// 코와 어깨 중심 간의 거리 계산 함수 (RULA 고개 숙임 평가 기준)
export function noseToShoulderDegree(
  nose: Coordinate,
  shoulderCenter: Coordinate
) {
  const y = nose.y - shoulderCenter.y;
  const z = shoulderCenter.z - nose.z;
  const radians = Math.atan2(y, z);
  const degree = Math.abs(radians * (180 / Math.PI));
  return degree;
}

// 귀와 어깨 중심 간의 거리 계산 함수 (CVA 거북목 평가 기준)
export function earsToShoulderDegree(
  leftEar: Coordinate,
  rightEar: Coordinate,
  shoulderCenter: Coordinate
) {
  const earCenter = getCenter(leftEar, rightEar);
  const y = Math.abs(earCenter.y - shoulderCenter.y);
  const z = Math.abs(earCenter.z - shoulderCenter.z);
  const radians = Math.atan2(y, z);
  const degree = Math.abs(radians * (180 / Math.PI));
  return degree;
}

// 어깨 기울기 각도 계산
export function shoulderLeanDegree(
  leftShoulder: Coordinate,
  rightShoulder: Coordinate
) {
  const horizontal = Math.abs(leftShoulder.y - rightShoulder.y);
  const vertical = Math.sqrt(
    Math.pow(rightShoulder.x - leftShoulder.x, 2) +
      Math.pow(rightShoulder.z - leftShoulder.z, 2)
  );
  const radians = Math.atan2(vertical, horizontal);
  const degree = radians * (180 / Math.PI);
  return degree;
}

// 나쁜자세 감지함수
export function detectBadPose(
  standardNSDegree: number,
  standardESDegree: number,
  standardShoulderLeanDegree: number,
  currentNSDegree: number,
  currentESDegree: number,
  currentShoulderLeanDegree: number
) {
  // 각도
  const diffNSDegree = Math.max(standardNSDegree - currentNSDegree, 0);
  const diffESDegree = Math.max(standardESDegree - currentESDegree, 0);
  const diffShoulderLeanDegree =
    standardShoulderLeanDegree - currentShoulderLeanDegree;

  // 상태
  let headdownStatus = 'normal';
  let headforwardStatus = 'normal';
  let shoulderLeanStatus = 'normal';

  if (diffNSDegree > dangerThresholdHeaddown) {
    headdownStatus = 'danger';
  } else if (diffNSDegree > warningThresholdHeaddown) {
    headdownStatus = 'warning';
  }

  if (diffESDegree > dangerThresholdHeadForward) {
    headforwardStatus = 'danger';
  } else if (diffESDegree > warningThresholdHeadForward) {
    headforwardStatus = 'warning';
  }

  if (diffShoulderLeanDegree > dangerThresholdUpperbodyLean) {
    shoulderLeanStatus = 'danger';
  } else if (diffShoulderLeanDegree > warningThresholdUpperbodyLean) {
    shoulderLeanStatus = 'warning';
  }

  return {
    diffNSDegree,
    diffESDegree,
    diffShoulderLeanDegree,
    headdownStatus,
    headforwardStatus,
    shoulderLeanStatus,
  };
}
