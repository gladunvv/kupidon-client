import { useState, type FormEvent } from 'react';
import { getErrorMessage } from '@/api/error-messages';
import { useUpdateLocation, useUpdateSearchPreferences } from '@/api/search';
import { useProfile } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GeolocationFailure, getRoundedPosition } from '@/feed/geolocation';
import {
  buildSearchPreferences,
  toSearchForm,
  type SearchFormErrors,
  type SearchFormValues,
} from '@/feed/search-form';
import { ChipGroup } from '@/profile/ChipGroup';
import { toggleId } from '@/profile/profile-form';
import type { Gender, Profile } from '@/types/user';

const GENDER_LABELS: Record<Gender, string> = {
  female: 'Женщины',
  male: 'Мужчины',
  other: 'Другие',
};

export function FeedFilters() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  if (!profile.data) return null;

  const prefs = profile.data.searchPreferences;
  const hasLocation = (profile.data.coordinates?.length ?? 0) >= 2;
  const summary = [
    `${prefs.minAge}–${prefs.maxAge} лет`,
    prefs.genders.length > 0
      ? prefs.genders.map((g) => GENDER_LABELS[g]).join(', ')
      : 'пол по умолчанию',
    hasLocation ? `до ${prefs.maxDistance} км` : 'без учёта расстояния',
  ].join(' · ');

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">{summary}</p>
        <Button
          size="sm"
          variant="outline"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Свернуть' : 'Фильтры'}
        </Button>
      </div>
      {open && (
        <FiltersForm
          key={JSON.stringify(prefs)}
          profile={profile.data}
          hasLocation={hasLocation}
          onSaved={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function FiltersForm({
  profile,
  hasLocation,
  onSaved,
}: {
  profile: Profile;
  hasLocation: boolean;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<SearchFormValues>(() =>
    toSearchForm(profile.searchPreferences),
  );
  const [errors, setErrors] = useState<SearchFormErrors>({});
  const save = useUpdateSearchPreferences();

  function set(patch: Partial<SearchFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
    save.reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = buildSearchPreferences(values);
    setErrors(result.errors);
    if (result.payload) save.mutate(result.payload, { onSuccess: onSaved });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="minAge"
          label="Возраст от"
          value={values.minAge}
          error={errors.minAge}
          onChange={(minAge) => set({ minAge })}
        />
        <NumberField
          id="maxAge"
          label="до"
          value={values.maxAge}
          error={errors.maxAge}
          onChange={(maxAge) => set({ maxAge })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Кого показывать</p>
        <ChipGroup
          label="Кого показывать"
          items={(Object.keys(GENDER_LABELS) as Gender[]).map((g) => ({
            id: g,
            label: GENDER_LABELS[g],
          }))}
          selected={values.genders}
          onToggle={(id) =>
            setValues((current) => ({
              ...current,
              genders: toggleId(current.genders, id) as Gender[],
            }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Ничего не выбрано — противоположный пол, если он указан в профиле.
        </p>
      </div>
      <NumberField
        id="maxDistance"
        label="Расстояние до, км"
        value={values.maxDistance}
        error={errors.maxDistance}
        onChange={(maxDistance) => set({ maxDistance })}
      />
      <LocationRow hasLocation={hasLocation} />
      {save.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось сохранить фильтры: {getErrorMessage(save.error)}
        </p>
      )}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? 'Применяем…' : 'Применить'}
      </Button>
    </form>
  );
}

function LocationRow({ hasLocation }: { hasLocation: boolean }) {
  const location = useUpdateLocation();
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  async function detect() {
    setGeoError(null);
    location.reset();
    setLocating(true);
    try {
      location.mutate(await getRoundedPosition());
    } catch (error) {
      setGeoError(
        error instanceof GeolocationFailure
          ? error.message
          : 'Не удалось определить местоположение',
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <p className="text-muted-foreground">
        {hasLocation
          ? 'Местоположение указано (с точностью около 1 км). Анкеты без местоположения при этом не показываются.'
          : 'Местоположение не указано — расстояние не учитывается.'}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={locating || location.isPending}
        onClick={detect}
      >
        {locating || location.isPending
          ? 'Определяем…'
          : hasLocation
            ? 'Обновить местоположение'
            : 'Определить местоположение'}
      </Button>
      {(geoError || location.error) && (
        <p role="alert" className="text-destructive">
          {geoError ?? getErrorMessage(location.error)}
        </p>
      )}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
