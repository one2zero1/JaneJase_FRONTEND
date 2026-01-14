import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useGoogleStore from '@/stores/useAuthStore';
import useMypageStore from '@/stores/useMypageStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface LocationState {
  stats?: {
    warnings: number;
    unfocusTime: number;
  };
}

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { user, gLogout } = useGoogleStore();
  const { history, fetchHistory, deleteHistory, isLoading } = useMypageStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  // 최근 세션 데이터 (방금 끝난 것)
  const recentStats = state?.stats;

  useEffect(() => {
    if (user?.id) {
      fetchHistory(user.id);
    }
  }, [user?.id, fetchHistory]);

  return (
    <main className="flex-grow flex flex-col items-center justify-start p-8 min-h-screen">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-soft border border-border p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-text">마이 페이지</h1>
            <p className="text-text-muted">내 정보 및 활동 내역</p>
          </div>

          {/* User Profile */}
          <div className="flex flex-col items-center space-y-4 py-4 border-b border-border">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-24 h-24 rounded-full border-2 border-primary"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                <span className="material-symbols-outlined text-4xl text-primary">
                  person
                </span>
              </div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-bold text-text">{user?.name}</h2>
              <p className="text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>

          {/* Recent Session Stats (Just Finished) */}
          {recentStats && (
            <div className="bg-primary-soft/50 rounded-lg p-4 space-y-3 animate-fade-in">
              <h3 className="font-semibold text-text flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  check_circle
                </span>
                방금 완료한 교정 결과
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-surface p-3 rounded-lg border border-border/50">
                  <div className="text-2xl font-bold text-danger">
                    {recentStats.warnings}
                  </div>
                  <div className="text-xs text-text-muted">경고 횟수</div>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-border/50">
                  <div className="text-2xl font-bold text-text">
                    {recentStats.unfocusTime}분
                  </div>
                  <div className="text-xs text-text-muted">흐트러진 시간</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/pose/init')}
            >
              새 교정 시작
            </Button>
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                gLogout();
                navigate('/');
              }}
            >
              로그아웃
            </Button>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-text flex items-center gap-2">
            <span className="material-symbols-outlined">history</span>
            지난 교정 기록
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-text-muted bg-surface dark:bg-surface-dark rounded-xl border border-border">
              아직 교정 기록이 없습니다.
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map(session => (
                <div
                  key={session.pose_id}
                  className="bg-surface dark:bg-surface-dark rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm text-text-muted mb-1">
                      {new Date(session.created_at).toLocaleDateString()}{' '}
                      {new Date(session.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="flex gap-4 text-right items-center">
                    <div>
                      <div className="text-lg font-bold text-danger">
                        {session.warning_count}
                      </div>
                      <div className="text-xs text-text-muted">경고</div>
                    </div>
                    <div className="w-px bg-border h-8"></div>
                    <div>
                      <div className="text-lg font-bold text-text">
                        {Math.round(session.total_unfocus_time / 60)}분
                      </div>
                      <div className="text-xs text-text-muted">흐트러짐</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSessionId(session.pose_id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSessionId(null);
        }}
        title="기록 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            정말로 이 교정 기록을 삭제하시겠습니까?
            <br />
            삭제된 데이터는 복구할 수 없습니다.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedSessionId(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (selectedSessionId && user?.id) {
                  deleteHistory(selectedSessionId);
                  setIsDeleteModalOpen(false);
                  setSelectedSessionId(null);
                }
              }}
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
