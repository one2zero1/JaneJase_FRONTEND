import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from '@/pages/Home';
import LoginPage from '@/pages/Auth/LoginPage';
import CallbackPage from '@/pages/Auth/CallbackPage';
import NotFoundPage from '@/pages/NotFound';
import PoseWebcamPage from '@/pages/Pose/Init/PoseWebcamPage';
import DashboardPage from '@/pages/Pose/Dashboard/DashboardPage';
import MyPage from '@/pages/User/MyPage';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/auth/callback', element: <CallbackPage /> },
      { path: '/pose/init', element: <PoseWebcamPage /> },
      { path: '/pose/dashboard', element: <DashboardPage /> },
      { path: '/mypage', element: <MyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
