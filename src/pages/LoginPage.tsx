import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate } from 'react-router';
import { requestOtp, verifyOtp } from '@/api/auth';
import { ApiError } from '@/api/client';
import { getErrorMessage } from '@/api/error-messages';
import { signIn } from '@/auth/session-store';
import { useAuth } from '@/auth/use-auth';
import { normalizePhone } from '@/auth/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const { status, signOutReason } = useAuth();
  const [phoneInput, setPhoneInput] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (status === 'loading') {
    return null;
  }
  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      {signOutReason === 'session-replaced' && (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
        >
          В ваш аккаунт вошли на другом устройстве, поэтому здесь сессия
          завершена. Войдите снова, если это были вы.
        </p>
      )}
      {sentTo ? (
        <CodeStep phone={sentTo} onChangePhone={() => setSentTo(null)} />
      ) : (
        <PhoneStep
          phoneInput={phoneInput}
          onPhoneInputChange={setPhoneInput}
          onSent={setSentTo}
        />
      )}
    </main>
  );
}

function PhoneStep({
  phoneInput,
  onPhoneInputChange,
  onSent,
}: {
  phoneInput: string;
  onPhoneInputChange: (value: string) => void;
  onSent: (phone: string) => void;
}) {
  const [inputError, setInputError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: requestOtp,
    onSuccess: (_data, { phone }) => onSent(phone),
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

  const serverError =
    mutation.error instanceof ApiError && mutation.error.code === 'BAD_REQUEST'
      ? 'Сервер не принял номер. Проверьте его'
      : mutation.error && getErrorMessage(mutation.error);
  const error = inputError ?? serverError;

  return (
    <>
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
          onChange={(event) => onPhoneInputChange(event.target.value)}
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
    </>
  );
}

function CodeStep({
  phone,
  onChangePhone,
}: {
  phone: string;
  onChangePhone: () => void;
}) {
  const [code, setCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: signIn,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4,8}$/.test(code)) {
      setInputError('Введите код из СМС');
      return;
    }
    setInputError(null);
    mutation.mutate({ phone, otp: code });
  }

  const error =
    inputError ?? (mutation.error && getErrorMessage(mutation.error));

  return (
    <>
      <h1 className="text-2xl font-semibold">Введите код</h1>
      <p className="text-muted-foreground">Код отправлен на {phone}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Label htmlFor="otp">Код из СМС</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'otp-error' : undefined}
        />
        {error && (
          <p id="otp-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Проверяем…' : 'Войти'}
        </Button>
        <Button type="button" variant="outline" onClick={onChangePhone}>
          Изменить номер
        </Button>
      </form>
    </>
  );
}
