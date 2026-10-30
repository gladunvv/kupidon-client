import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import './index.css';
import { ApiError, refreshSession } from '@/api/client';
import { getSession, subscribeSession } from '@/auth/session-store';
import { router } from '@/routes/router';

// A 4xx (not found, forbidden, validation) won't change on retry — fail fast
// instead of three backed-off attempts; network errors and 5xx still retry.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 3,
    },
  },
});

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
