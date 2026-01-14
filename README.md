# JaneJase Frontend (자네자세 프론트엔드)

**자네자세** 프로젝트의 프론트엔드 애플리케이션입니다. React와 Vite를 기반으로 빠르고 효율적인 개발 환경을 제공하며, 사용자에게 직관적인 인터페이스를 제공하기 위해 Tailwind CSS와 다양한 최신 라이브러리를 활용합니다.

## 🛠 기술 스택 (Tech Stack)

이 프로젝트는 다음과 같은 최신 웹 기술을 사용합니다:

- **Build Tool**: [Vite](https://vitejs.dev/) - 빠르고 현대적인 프론트엔드 빌드 툴
- **Framework**: React 19 (TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 퍼스트 CSS 프레임워크
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) - 가볍고 직관적인 상태 관리 라이브러리
- **3D Graphics**: [Three.js](https://threejs.org/) - 웹 브라우저 3D 그래픽 라이브러리
- **AI/Vision**: [MediaPipe](https://developers.google.com/mediapipe) (Tasks Vision) - 실시간 포즈 감지 및 비전 처리
- **Networking**: Axios, React Query (TanStack Query)
- **Routing**: React Router DOM

## 📂 프로젝트 구조 (Project Structure)

`src/` 디렉토리는 다음과 같이 구성되어 있습니다:

```
src/
├── assets/       # 이미지, 폰트 등 정적 자원
├── components/   # 재사용 가능한 UI 컴포넌트
├── hooks/        # 커스텀 React Hooks
├── pages/        # 라우팅 페이지 컴포넌트
├── stores/       # Zustand 상태 관리 스토어
├── utils/        # 유틸리티 함수
├── App.tsx       # 메인 애플리케이션 컴포넌트
└── main.tsx      # 애플리케이션 진입점
```

## 🚀 시작하기 (Getting Started)

### 1. 필수 구성 요소 (Prerequisites)

- Node.js (LTS 버전 권장)
- npm 또는 yarn 패키지 매니저

### 2. 설치 (Installation)

프로젝트 디렉토리로 이동하여 의존성을 설치합니다.

```bash
cd JaneJase_FRONTEND-main
npm install
```

### 3. 개발 서버 실행 (Run Development Server)

로컬 개발 서버를 실행하여 실시간으로 변경 사항을 확인합니다.

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` (또는 터미널에 표시된 포트)으로 접속하세요.

### 4. 빌드 (Build)

배포를 위해 애플리케이션을 빌드합니다.

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 5. 린트 (Lint)

코드 스타일과 오류를 검사합니다.

```bash
npm run lint
```

## ✨ 주요 기능 (Key Features)

- **실시간 포즈 인식**: MediaPipe를 활용한 사용자 자세 실시간 분석
- **3D 시각화**: Three.js를 이용한 직관적인 3D 피드백 제공
- **반응형 디자인**: Tailwind CSS를 활용한 모바일 및 데스크탑 최적화 UI
