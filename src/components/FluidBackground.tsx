import { useEffect, useRef } from 'react';

export default function FluidBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    async function start() {
      if (motion.matches || disposed) return;
      const { FluidSimulation } = await import('react-webgl-fluid');
      if (disposed || !element) return;
      try {
        const simulation = new FluidSimulation(element, {
          DYE_RESOLUTION: 256,
          SIM_RESOLUTION: 64,
          PRESSURE_ITERATIONS: 8,
          DENSITY_DISSIPATION: 2.5,
          VELOCITY_DISSIPATION: 0.8,
          SPLAT_RADIUS: 0.25,
          SPLAT_FORCE: 4000,
          CURL: 8,
          COLORFUL: true,
          SHADING: true,
          BLOOM: false,
          SUNRAYS: false,
          BACK_COLOR: document.documentElement.classList.contains('dark')
            ? { r: 16, g: 17, b: 20 }
            : { r: 245, g: 246, b: 242 },
          TRANSPARENT: false,
          TRIGGER_MODE: 'hover',
        });
        simulation.addEventListeners();
        simulation.randomSplats(6);
        simulation.start();
        const theme = new MutationObserver(() => {
          simulation.updateConfig({
            BACK_COLOR: document.documentElement.classList.contains('dark')
              ? { r: 16, g: 17, b: 20 }
              : { r: 245, g: 246, b: 242 },
          });
        });
        theme.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        });
        const visibility = () =>
          document.hidden || motion.matches
            ? simulation.pause()
            : simulation.resume();
        document.addEventListener('visibilitychange', visibility);
        motion.addEventListener('change', visibility);
        visibility();
        stop = () => {
          simulation.stop();
          simulation.removeEventListeners();
          theme.disconnect();
          document.removeEventListener('visibilitychange', visibility);
          motion.removeEventListener('change', visibility);
        };
      } catch {
        /* The static background also works without WebGL. */
      }
    }
    void start().catch(() => undefined);
    return () => {
      disposed = true;
      stop?.();
    };
  }, []);
  return <canvas ref={canvas} className="fluid-canvas" aria-hidden="true" />;
}
