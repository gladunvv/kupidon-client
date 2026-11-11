import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '@/components/ui/button';

export function PageLoading() {
  return (
    <div role="status" className="p-8 text-center text-muted-foreground">
      Загрузка…
    </div>
  );
}

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-lg space-y-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Страница не найдена</h1>
      <p className="text-muted-foreground">
        Проверьте адрес или вернитесь на главную.
      </p>
      <a className="underline underline-offset-4" href="/">
        На главную
      </a>
    </main>
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Не удалось открыть страницу</h1>
      <p role="alert" className="text-muted-foreground">
        Проверьте соединение и попробуйте обновить страницу.
      </p>
      <Button onClick={() => window.location.reload()}>
        Обновить страницу
      </Button>
      <p>
        <a className="underline underline-offset-4" href="/">
          На главную
        </a>
      </p>
    </main>
  );
}
