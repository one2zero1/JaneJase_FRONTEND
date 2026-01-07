import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import panda from '@/assets/imgs/panda.png';
import { ThemeProvider } from './providers/ThemeProvider';
import { Button } from '@/components/common/Button/Button';
import useGoogleStore from '@/stores/useAuthStore';

export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated, user, gLogout, fetchUser, token } = useGoogleStore();

  // 앱 시작시 토큰이 있으면 사용자 정보 가져오기
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  const handleLogout = () => {
    gLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex">
        <div className="flex-1">
          {/* 상단 바 */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
            <div>
              <Link to="/" className="flex items-center gap-2">
                <img
                  src={panda}
                  alt="JaneJase Logo"
                  className="h-8 w-8 md:h-10 md:w-10"
                />
                <p className="text-lg font-black leading-tight tracking-tight text-text md:text-2xl lg:text-3xl">
                  자네 자세
                </p>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <div className="hidden items-center gap-2 md:flex">
                <ThemeProvider />
              </div>

              {/* Auth Section */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="h-8 w-8 rounded-full border-2 border-border"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text">
                        {user.name}
                      </span>
                      <span className="text-xs text-text-muted">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <Button onClick={handleLogout} variant="primary" size="sm">
                    로그아웃
                  </Button>
                </div>
              ) : (
                <Button onClick={() => navigate('/login')} variant="primary">
                  로그인
                </Button>
              )}
            </div>
          </header>
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
