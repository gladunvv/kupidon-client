import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import './index.css';
import { refreshSession } from '@/api/client';
import { getSession, subscribeSession } from '@/auth/session-store';
import { router } from '@/routes/router';

const queryClient = new QueryClient();

subscribeSession(() => {
  if (getSession().status === 'unauthenticated') {
    queryClient.clear();
  }
});

void refreshSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
