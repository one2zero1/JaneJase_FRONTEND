import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGoogleStore from '@/stores/useAuthStore';

export default function CallbackPage() {
  const navigate = useNavigate();
  const { setToken, fetchUser } = useGoogleStore();

  useEffect(() => {
    // URL에서 token 파라미터 추출
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // 1. 토큰을 스토어에 저장
      setToken(token);

      // 2. 사용자 정보 가져오기
      fetchUser().then(() => {
        // 3. 메인 페이지로 이동
        navigate('/', { replace: true });
      });
    } else {
      // 토큰이 없으면 로그인 페이지로 리디렉션
      console.error('No token found in callback URL');
      navigate('/login', { replace: true });
    }
  }, [navigate, setToken, fetchUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-text-muted">로그인 처리 중...</p>
      </div>
    </div>
  );
}
