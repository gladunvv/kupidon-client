import { lazy } from 'react';

export const FaqPage = lazy(() =>
  import('@/pages/FaqPage').then((module) => ({ default: module.FaqPage })),
);
export const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
export const HomePage = lazy(() =>
  import('@/pages/HomePage').then((module) => ({ default: module.HomePage })),
);
export const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
);
export const ChatPage = lazy(() =>
  import('@/pages/ChatPage').then((module) => ({ default: module.ChatPage })),
);
export const MatchesPage = lazy(() =>
  import('@/pages/MatchesPage').then((module) => ({
    default: module.MatchesPage,
  })),
);
export const ChatsPage = lazy(() =>
  import('@/pages/ChatsPage').then((module) => ({ default: module.ChatsPage })),
);
