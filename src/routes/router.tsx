import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/routes/protected-route';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ChatPage } from '@/pages/ChatPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/chat/:dialogId', element: <ChatPage /> },
    ],
  },
]);
