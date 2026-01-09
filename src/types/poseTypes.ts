// 3차원 좌표 타입
export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

export interface detectBadPoseInform {
  diffNSDegree: number;
  diffESDegree: number;
  diffShoulderLeanDegree: number;
  headdownStatus: string;
  headforwardStatus: string;
  shoulderLeanStatus: string;
}

// 보내주신 ref 구조와 일치하는 데이터 타입
export interface MeasurementData {
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
  shoulderCenter: Coordinate;
  shoulderWidth: number;
}

// location.state의 전체 구조
export interface LocationState {
  measurementData: MeasurementData | null; // ref.current는 null일 수도 있으므로
}
