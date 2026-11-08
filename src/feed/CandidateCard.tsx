import { PhotoGallery } from '@/feed/PhotoGallery';
import type { ReactNode } from 'react';
import type { Candidate } from '@/types/candidate';

export function CandidateCard({
  candidate,
  cityName,
  goalNames,
  actions,
}: {
  candidate: Candidate;
  cityName?: string;
  goalNames: string[];
  actions?: ReactNode;
}) {
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
    <article className="candidate-card">
      <PhotoGallery
        key={candidate._id}
        photos={candidate.photos}
        name={candidate.name ?? 'Без имени'}
      />
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
        {actions}
      </div>
    </article>
  );
}
