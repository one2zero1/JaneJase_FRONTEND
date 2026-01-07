import { Navigate } from 'react-router-dom';
import useGoogleStore from '@/stores/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useGoogleStore();

  if (!isAuthenticated) {
    // 인증되지 않은 경우 로그인 페이지로 리디렉션
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
