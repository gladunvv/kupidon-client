import type { Candidate } from '@/types/candidate';

export function CandidateCard({
  candidate,
  cityName,
  goalNames,
}: {
  candidate: Candidate;
  cityName?: string;
  goalNames: string[];
}) {
  const [photo] = candidate.photos;
  const title = [candidate.name ?? 'Без имени', candidate.age]
    .filter(Boolean)
    .join(', ');
  const place = [
    cityName,
    candidate.distance !== undefined &&
      `${Math.max(1, Math.round(candidate.distance / 1000))} км`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="overflow-hidden rounded-xl border border-border">
      {photo ? (
        <img
          src={photo}
          alt={candidate.name ?? 'Фото кандидата'}
          className="aspect-[4/5] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Нет фото
        </div>
      )}
      <div className="flex flex-col gap-2 p-4">
        <h2 className="text-lg font-semibold">
          {title}
          {candidate.isVerified && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ✓ подтверждён
            </span>
          )}
        </h2>
        {place && <p className="text-sm text-muted-foreground">{place}</p>}
        {candidate.occupation && (
          <p className="text-sm">{candidate.occupation}</p>
        )}
        {candidate.about && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {candidate.about}
          </p>
        )}
        {goalNames.length > 0 && (
          <p className="text-sm">Ищет: {goalNames.join(', ')}</p>
        )}
        {candidate.interests && candidate.interests.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {candidate.interests.map((interest) => (
              <li
                key={interest}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                {interest}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
