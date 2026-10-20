import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { getErrorMessage } from '@/api/error-messages';
import { useProfile, useUpdateProfile } from '@/api/users';
import {
  buildProfilePayload,
  toFormValues,
  type ProfileFormErrors,
  type ProfileFormValues,
} from '@/profile/profile-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Profile } from '@/types/user';

export function ProfilePage() {
  const profile = useProfile();

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col gap-6 px-4 py-8">
      <Link to="/" className="text-sm text-muted-foreground">
        ← Лента
      </Link>
      <h1 className="text-2xl font-semibold">Профиль</h1>
      {profile.isPending && (
        <p className="text-muted-foreground">Загружаем профиль…</p>
      )}
      {profile.error && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="text-sm text-destructive">
            Не удалось загрузить профиль: {getErrorMessage(profile.error)}
          </p>
          <Button variant="outline" onClick={() => profile.refetch()}>
            Повторить
          </Button>
        </div>
      )}
      {profile.data && <ProfileForm profile={profile.data} />}
    </main>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const [values, setValues] = useState(() => toFormValues(profile));
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const mutation = useUpdateProfile();

  function set(field: keyof ProfileFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    mutation.reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = buildProfilePayload(values);
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0) return;
    mutation.mutate(result.payload, {
      onSuccess: (saved) => setValues(toFormValues(saved)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field id="phone" label="Телефон">
        <Input id="phone" value={profile.phone} disabled />
      </Field>
      <Field id="name" label="Имя" error={errors.name}>
        <Input
          id="name"
          autoComplete="given-name"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={errors.name ? true : undefined}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="age" label="Возраст" error={errors.age}>
          <Input
            id="age"
            inputMode="numeric"
            value={values.age}
            onChange={(e) => set('age', e.target.value)}
            aria-invalid={errors.age ? true : undefined}
          />
        </Field>
        <Field id="height" label="Рост, см" error={errors.height}>
          <Input
            id="height"
            inputMode="numeric"
            value={values.height}
            onChange={(e) => set('height', e.target.value)}
            aria-invalid={errors.height ? true : undefined}
          />
        </Field>
      </div>
      <Field id="gender" label="Пол">
        <select
          id="gender"
          value={values.gender}
          onChange={(e) => set('gender', e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base md:text-sm"
        >
          <option value="">Не указан</option>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
          {values.gender === 'other' && (
            <option value="other" disabled>
              Другой
            </option>
          )}
        </select>
      </Field>
      <Field id="about" label="О себе" error={errors.about}>
        <Textarea
          id="about"
          rows={4}
          value={values.about}
          onChange={(e) => set('about', e.target.value)}
          aria-invalid={errors.about ? true : undefined}
        />
        <p className="text-xs text-muted-foreground">
          {values.about.trim().length}/500
        </p>
      </Field>
      <Field id="occupation" label="Работа" error={errors.occupation}>
        <Input
          id="occupation"
          value={values.occupation}
          onChange={(e) => set('occupation', e.target.value)}
          aria-invalid={errors.occupation ? true : undefined}
        />
      </Field>
      <Field id="education" label="Образование" error={errors.education}>
        <Input
          id="education"
          value={values.education}
          onChange={(e) => set('education', e.target.value)}
          aria-invalid={errors.education ? true : undefined}
        />
      </Field>
      {mutation.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось сохранить: {getErrorMessage(mutation.error)}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="text-sm text-muted-foreground">
          Сохранено
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
