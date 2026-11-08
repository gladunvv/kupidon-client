import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react';

export function OtpInput({
  value,
  onChange,
  invalid,
  disabled,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  invalid: boolean;
  disabled: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  function insert(index: number, raw: string) {
    const digits = raw.replace(/\D/g, '');
    const next = [...value];
    if (digits.length === 4) {
      onChange(digits.split(''));
      inputs.current[3]?.focus();
      return;
    }
    next[index] = digits.slice(-1);
    onChange(next);
    if (digits) inputs.current[Math.min(3, index + 1)]?.focus();
  }
  function keyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      event.preventDefault();
      const next = [...value];
      next[index - 1] = '';
      onChange(next);
      inputs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      inputs.current[
        Math.max(0, Math.min(3, index + (event.key === 'ArrowLeft' ? -1 : 1)))
      ]?.focus();
    }
  }
  function paste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    insert(index, event.clipboardData.getData('text'));
  }
  return (
    <fieldset className="otp-group" disabled={disabled}>
      <legend className="sr-only">Четырёхзначный код из СМС</legend>
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(input) => {
            inputs.current[index] = input;
          }}
          autoFocus={index === 0}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={4}
          value={digit}
          aria-label={`Цифра ${index + 1} из 4`}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? 'otp-error' : undefined}
          onFocus={(event) => event.target.select()}
          onChange={(event) => insert(index, event.target.value)}
          onKeyDown={(event) => keyDown(index, event)}
          onPaste={(event) => paste(index, event)}
        />
      ))}
    </fieldset>
  );
}
