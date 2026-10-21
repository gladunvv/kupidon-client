import { useEffect, useState } from 'react';
import { useCities } from '@/api/reference';
import { getErrorMessage } from '@/api/error-messages';
import { Input } from '@/components/ui/input';
import type { City } from '@/types/reference';

export function CityPicker({
  value,
  onChange,
}: {
  value: City | null;
  onChange: (city: City) => void;
}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(value === null);
  const cities = useCities(debounced);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  if (!open && value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-input px-2.5 py-1.5 text-sm">
        <span>{value.fullName ?? value.name}</span>
        <button
          type="button"
          className="text-muted-foreground underline underline-offset-4"
          onClick={() => setOpen(true)}
        >
          Изменить
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        id="city"
        placeholder="Начните вводить город"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {cities.isPending && (
        <p className="text-sm text-muted-foreground">Ищем…</p>
      )}
      {cities.error && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(cities.error)}
        </p>
      )}
      {cities.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">Ничего не найдено</p>
      )}
      <ul className="flex flex-col">
        {cities.data?.map((city) => (
          <li key={city._id}>
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                onChange(city);
                setOpen(false);
                setSearch('');
              }}
            >
              {city.fullName ?? city.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
