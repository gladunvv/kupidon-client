import {
  FaqPage,
  LoginPage,
  HomePage,
  ProfilePage,
  ChatPage,
  MatchesPage,
  ChatsPage,
} from '@/routes/lazy-pages';
import { AppShell } from '@/components/AppShell';
import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/routes/protected-route';
import { NotFoundPage, RouteErrorPage } from '@/routes/RouteStatus';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '*', element: <NotFoundPage /> },
      { path: '/faq', element: <FaqPage /> },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/matches', element: <MatchesPage /> },
          { path: '/chats', element: <ChatsPage /> },
          { path: '/chat/:dialogId', element: <ChatPage /> },
        ],
      },
    ],
  },
]);
