import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { requestOtp } from '@/api/auth';
import { ApiError } from '@/api/client';
import { getErrorMessage } from '@/api/error-messages';
import { normalizePhone } from '@/auth/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: requestOtp,
    onSuccess: (_data, { phone }) => setSentTo(phone),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const phone = normalizePhone(phoneInput);
    if (!phone) {
      setInputError('Введите номер в формате +7 999 123-45-67');
      return;
    }
    setInputError(null);
    mutation.mutate({ phone });
  }

  if (sentTo) {
    return (
      <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold">Код отправлен</h1>
        <p className="text-muted-foreground">
          Мы отправили код на {sentTo}. Ввод кода появится в задаче AUTH-02.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSentTo(null);
            mutation.reset();
          }}
        >
          Изменить номер
        </Button>
      </main>
    );
  }

  const serverError =
    mutation.error instanceof ApiError && mutation.error.code === 'BAD_REQUEST'
      ? 'Сервер не принял номер. Проверьте его'
      : mutation.error && getErrorMessage(mutation.error);
  const error = inputError ?? serverError;

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Вход</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Label htmlFor="phone">Номер телефона</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 999 123-45-67"
          value={phoneInput}
          onChange={(event) => setPhoneInput(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'phone-error' : undefined}
        />
        {error && (
          <p id="phone-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Отправляем…' : 'Получить код'}
        </Button>
      </form>
    </main>
  );
}
