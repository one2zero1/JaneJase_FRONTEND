import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button/Button';
import useGoogleStore from '@/stores/useAuthStore';

function GoogleIcon() {
  return (
    <svg
      className="block h-full w-full"
      version="1.1"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        fill="#EA4335"
      />
      <path
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        fill="#4285F4"
      />
      <path
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        fill="#FBBC05"
      />
      <path
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        fill="#34A853"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3C6.48 3 2 6.48 2 10.76C2 13.53 3.78 15.98 6.54 17.34L5.61 20.77C5.55 21.01 5.82 21.2 6.03 21.06L10.39 18.17C10.92 18.23 11.45 18.27 12 18.27C17.52 18.27 22 14.79 22 10.51C22 6.23 17.52 3 12 3Z" />
    </svg>
  );
}

export default function LoginPage() {
  const { gLogin, isAuthenticated } = useGoogleStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // 이미 로그인된 사용자는 홈으로 리디렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // URL에서 에러 파라미터 확인
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      console.log('Login error:', errorParam);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    setError(null);
    gLogin(); // Zustand store의 login 함수 호출 - 구글 OAuth 페이지로 리디렉션
  };

  const handleKakaoLogin = () => {
    // TODO: Implement Kakao OAuth
    console.log('Kakao login clicked');
  };

  return (
    <div className="relative -m-6 flex min-h-screen w-[calc(100%+48px)] flex-col items-center justify-center overflow-hidden bg-bg p-4">
      {/* Abstract Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-accent/5 blur-[80px]"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center rounded-2xl border border-border bg-surface p-8 shadow-soft md:p-10">
        {/* Hero Icon/Illustration */}
        <div className="mb-6 animate-pulse rounded-full bg-primary/10 p-4">
          <span className="material-symbols-outlined text-4xl text-primary">
            JaneJase
          </span>
        </div>

        {/* Headlines */}
        <h1 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-text">
          JaneJase
        </h1>
        <p className="mb-10 text-center text-sm font-medium leading-relaxed text-text-muted">
          바른 자세, 집중의 시작
          <br />
          실시간 AI 자세 교정 파트너와 함께하세요
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 w-full rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Login Buttons */}
        <div className="flex w-full flex-col gap-3">
          {/* Google Login */}
          <Button
            onClick={handleGoogleLogin}
            variant="ghost"
            className="gap-3 !border-[#E2E8F0] !bg-[#ffffff] py-3.5 !text-[#371D1E] hover:!bg-[#ffffff] hover:brightness-95"
          >
            <div className="h-5 w-5">
              <GoogleIcon />
            </div>
            <span>Google 계정으로 시작하기</span>
          </Button>

          {/* Kakao Login */}
          <Button
            onClick={handleKakaoLogin}
            variant="ghost"
            className="gap-3 !border-[#FEE500] !bg-[#FEE500] py-3.5 !text-[#371D1E] hover:!bg-[#FEE500] hover:brightness-95"
          >
            <div className="h-5 w-5 text-[#371D1E]">
              <KakaoIcon />
            </div>
            <span>카카오톡으로 시작하기</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="mt-8 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border"></div>
          <span className="text-xs font-medium text-muted">
            안전한 로그인을 지원합니다
          </span>
          <div className="h-px flex-1 bg-border"></div>
        </div>

        {/* Decorative secure badge */}
        <div className="mt-8 flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs text-success">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>개인정보는 암호화되어 보호됩니다</span>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 mt-8 text-center">
        <div className="flex items-center justify-center gap-6 text-xs font-medium text-muted">
          <a className="transition-colors hover:text-primary" href="#">
            이용약관
          </a>
          <span className="h-3 w-px bg-border"></span>
          <a className="transition-colors hover:text-primary" href="#">
            개인정보처리방침
          </a>
        </div>
        <p className="mt-4 text-[10px] text-muted">
          © 2024 JaneJase. All rights reserved.
        </p>
      </footer>

      {/* Decorative background pattern */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 opacity-5"
        style={{
          backgroundImage:
            'radial-gradient(rgb(var(--jj-primary)) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      ></div>
    </div>
  );
}
