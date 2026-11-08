import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, Navigate, useLocation } from 'react-router';
import { requestOtp, verifyOtp } from '@/api/auth';
import { getErrorMessage } from '@/api/error-messages';
import { signIn } from '@/auth/session-store';
import { useAuth } from '@/auth/use-auth';
import { formatPhoneInput, normalizePhone } from '@/auth/phone';
import { getReturnPath } from '@/routes/return-path';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDialogViewport } from '@/lib/use-visual-viewport';
import { OtpInput } from '@/auth/OtpInput';
import { X, ArrowUpRight, Sparkles } from 'lucide-react';

const FluidBackground = lazy(() => import('@/components/FluidBackground'));

export function LoginPage() {
  const { status, signOutReason } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (status === 'loading') {
    return null;
  }
  if (status === 'authenticated') {
    return <Navigate to={getReturnPath(location.state)} replace />;
  }

  return (
    <main className="landing-page">
      {!open && (
        <Suspense fallback={null}>
          <FluidBackground />
        </Suspense>
      )}
      <div className="landing-copy">
        <span className="eyebrow">
          <Sparkles size={16} /> Совпадения начинаются здесь
        </span>
        <h1>
          Ближе, чем
          <br />
          <span>кажется.</span>
        </h1>
        <p className="landing-description">
          Новые люди. Общие интересы.
          <br />
          Знакомства, которым хочется дать шанс.
        </p>
        <div className="landing-actions">
          <Button size="lg" onClick={() => setOpen(true)}>
            Начать знакомства <ArrowUpRight />
          </Button>
          <Link to="/faq">Как это работает ↗</Link>
        </div>
        <p className="landing-note">
          Вход по номеру телефона · Общение после взаимной симпатии
        </p>
      </div>
      <div className="login-notices">
        {signOutReason === 'account-deleted' && (
          <p
            role="status"
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
          >
            Аккаунт удалён
          </p>
        )}
        {signOutReason === 'session-replaced' && (
          <p
            role="status"
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
          >
            В ваш аккаунт вошли на другом устройстве, поэтому здесь сессия
            завершена. Войдите снова, если это были вы.
          </p>
        )}
      </div>
      {open && (
        <AuthDialog onClose={() => setOpen(false)}>
          {sentTo ? (
            <CodeStep phone={sentTo} onChangePhone={() => setSentTo(null)} />
          ) : (
            <PhoneStep
              phoneInput={phoneInput}
              onPhoneInputChange={setPhoneInput}
              onSent={setSentTo}
            />
          )}
        </AuthDialog>
      )}
    </main>
  );
}

function AuthDialog({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useDialogViewport();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="auth-dialog"
      style={viewport}
      onClose={onClose}
      aria-labelledby="auth-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className="auth-panel">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="auth-close"
          aria-label="Закрыть вход"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </Button>
        {children}
      </div>
    </dialog>
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
    mutation.error && getErrorMessage(mutation.error, 'phone');
  const error = inputError ?? serverError;

  return (
    <>
      <p className="eyebrow">Рады знакомству</p>
      <h2 id="auth-title" className="text-3xl font-semibold">
        Твой номер?
      </h2>
      <p className="text-sm text-muted-foreground">
        Отправим код для входа. Пароль не понадобится.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Label htmlFor="phone">Номер телефона</Label>
        <Input
          id="phone"
          type="tel"
          autoFocus
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 999 123-45-67"
          value={phoneInput}
          onChange={(event) =>
            onPhoneInputChange(formatPhoneInput(event.target.value))
          }
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
  const [digits, setDigits] = useState(['', '', '', '']);
  const code = digits.join('');
  const [inputError, setInputError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: signIn,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(code)) {
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
      <p className="eyebrow">Один шаг до знакомства</p>
      <h2 id="auth-title" className="text-3xl font-semibold">
        Введите код
      </h2>
      <p className="text-muted-foreground">Код отправлен на {phone}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <OtpInput
          value={digits}
          onChange={(value) => {
            setDigits(value);
            setInputError(null);
            mutation.reset();
          }}
          invalid={Boolean(error)}
          disabled={mutation.isPending}
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
