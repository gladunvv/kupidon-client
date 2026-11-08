import { useSyncExternalStore, type CSSProperties } from 'react';

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  window.addEventListener('resize', onChange);
  viewport?.addEventListener('resize', onChange);
  viewport?.addEventListener('scroll', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    viewport?.removeEventListener('resize', onChange);
    viewport?.removeEventListener('scroll', onChange);
  };
}

function getSnapshot() {
  const viewport = window.visualViewport;
  // Keyboards can resize and pan the visual viewport while the layout
  // viewport stays fixed. Keep the layout unchanged during pinch zoom.
  return viewport && viewport.scale === 1
    ? `${viewport.height}:${viewport.offsetTop}`
    : `${window.innerHeight}:0`;
}

export function useVisualViewport() {
  const [height, top] = useSyncExternalStore(subscribe, getSnapshot)
    .split(':')
    .map(Number);
  return { height, top };
}

export function useDialogViewport(): CSSProperties {
  const { height, top } = useVisualViewport();
  return {
    maxHeight: Math.max(0, height - 32),
    top: top + height / 2,
    bottom: 'auto',
    marginBlock: 0,
    transform: 'translateY(-50%)',
  };
}
