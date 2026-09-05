import { useEffect, useRef, useState } from 'react';

import { useMacOS } from '@/contexts/MacOSContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}
const COLORS = ['#ff4d2e', '#ffd23f', '#ff8c42', '#fff4c2', '#b85cff'];

export default function ExplosionEffect() {
  const skipReference = useRef<HTMLButtonElement>(null);
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const { showDinoGame } = useMacOS();
  const [started, setStarted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    skipReference.current?.focus();
    setReduceMotion(globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const timer = globalThis.setTimeout(() => setStarted(true), 900);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        showDinoGame();
        return;
      }
      if (['Enter', ' '].includes(event.key) && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        setStarted(true);
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => {
      globalThis.clearTimeout(timer);
      globalThis.removeEventListener('keydown', onKeyDown);
    };
  }, [showDinoGame]);
  useEffect(() => {
    if (!started || reduceMotion) return;
    const canvas = canvasReference.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      showDinoGame();
      return;
    }
    const resize = () => {
      canvas.width = globalThis.innerWidth;
      canvas.height = globalThis.innerHeight;
    };
    resize();
    globalThis.addEventListener('resize', resize);
    const origin = () => ({ x: canvas.width / 2, y: canvas.height / 2 });
    const particles: Particle[] = Array.from({ length: 130 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 220 + Math.random() * 650;
      const { x, y } = origin();
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 12,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 14
      };
    });
    const duration = 2200;
    const launchedAt = performance.now();
    let animationId = 0;
    const draw = (now: number) => {
      const elapsed = now - launchedAt;
      const progress = Math.min(1, elapsed / duration);
      const { x, y } = origin();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = `rgba(6, 4, 14, ${0.45 + progress * 0.4})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = `rgba(255, 210, 63, ${1 - progress})`;
      context.lineWidth = 8 * (1 - progress) + 2;
      context.beginPath();
      context.arc(
        x,
        y,
        Math.min(canvas.width, canvas.height) * (0.12 + progress * 0.75),
        0,
        Math.PI * 2
      );
      context.stroke();
      for (const particle of particles) {
        const time = elapsed / 1000;
        context.save();
        context.translate(
          particle.x + particle.vx * time,
          particle.y + particle.vy * time + 420 * time * time
        );
        context.rotate(particle.rotation + particle.rotationSpeed * time);
        context.globalAlpha = 1 - progress;
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        context.restore();
      }
      if (elapsed < 900) {
        context.save();
        context.translate(x, y);
        context.scale(1 + Math.sin(elapsed / 50) * 0.06, 1);
        context.fillStyle = '#fff4c2';
        context.strokeStyle = '#25113f';
        context.lineWidth = 12;
        context.font = `900 ${Math.min(170, Math.max(58, globalThis.innerWidth * 0.18))}px ui-rounded, system-ui`;
        context.textAlign = 'center';
        context.strokeText('BOOM!', 0, 40);
        context.fillText('BOOM!', 0, 40);
        context.restore();
      }
      if (progress >= 1) {
        showDinoGame();
        return;
      }
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      globalThis.removeEventListener('resize', resize);
    };
  }, [reduceMotion, showDinoGame, started]);
  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Casino cash-out catastrophe'
      className='fixed inset-0 z-[9999] grid place-items-center bg-[#06040e] text-center'
    >
      {!started && (
        <button
          type='button'
          onClick={() => setStarted(true)}
          className='rounded-xl border border-amber-200/30 bg-amber-400 px-5 py-3 font-mono text-sm font-black text-violet-950 shadow-[0_0_80px_rgba(251,191,36,.35)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
        >
          Cash-out machine is suspiciously loud.
          <span className='mt-1 block text-xs font-bold'>
            Something is definitely about to happen.
          </span>
        </button>
      )}
      <canvas
        ref={canvasReference}
        className='pointer-events-none absolute inset-0 h-full w-full'
      />
      <button
        ref={skipReference}
        type='button'
        onClick={showDinoGame}
        className='absolute right-5 top-5 min-h-11 rounded border border-white/40 px-3 py-2 font-mono text-xs text-white hover:bg-white/15'
      >
        Skip to dino
      </button>
      {started && reduceMotion && (
        <div className='relative rounded-xl border-8 border-violet-950 bg-amber-300 px-8 py-5 font-black text-violet-950 shadow-[0_0_90px_rgba(251,191,36,.55)]'>
          <p className='text-6xl'>BOOM!</p>
          <button
            type='button'
            onClick={showDinoGame}
            className='mt-3 rounded bg-violet-950 px-3 py-2 font-mono text-xs text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          >
            Continue to dino
          </button>
        </div>
      )}
      {started && (
        <p className='absolute bottom-8 font-mono text-xs text-white/70'>
          incoming consequences...
        </p>
      )}
    </div>
  );
}
