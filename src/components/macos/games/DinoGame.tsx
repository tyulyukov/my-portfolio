import { useCallback, useEffect, useRef, useState } from 'react';

import { useMacOS } from '@/contexts/MacOSContext';

const GROUND_Y = 150;
const STEP = 1000 / 60;

export default function DinoGame() {
  const { returnToDesktop } = useMacOS();
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const actionReference = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<'ready' | 'running' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const gameReference = useRef({
    y: GROUND_Y,
    velocity: 0,
    ticks: 0,
    nextObstacle: 90,
    obstacles: [] as Array<{ x: number; width: number; height: number }>
  });

  const play = useCallback(() => {
    if (phase !== 'running') {
      gameReference.current = {
        y: GROUND_Y,
        velocity: 0,
        ticks: 0,
        nextObstacle: 90,
        obstacles: []
      };
      setScore(0);
      setPhase('running');
    } else if (gameReference.current.y === GROUND_Y) {
      gameReference.current.velocity = -14;
    }
  }, [phase]);

  useEffect(() => {
    actionReference.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        returnToDesktop();
      } else if (
        event.code === 'ArrowUp' ||
        (event.code === 'Space' && !(event.target instanceof HTMLButtonElement))
      ) {
        event.preventDefault();
        if (!event.repeat) play();
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [play, returnToDesktop]);

  useEffect(() => {
    const canvas = canvasReference.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const game = gameReference.current;
    let animation = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const draw = () => {
      context.fillStyle = '#f7f7f7';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#c6c6c6';
      context.beginPath();
      context.moveTo(0, GROUND_Y + 26);
      context.lineTo(canvas.width, GROUND_Y + 26);
      context.stroke();
      context.fillStyle = '#535353';
      const y = game.y;
      context.fillRect(50, y + 6, 23, 18);
      context.fillRect(64, y - 5, 24, 17);
      context.fillRect(43, y + 2, 9, 12);
      context.fillRect(39, y - 3, 5, 11);
      context.fillRect(71, y + 15, 10, 4);
      const leg = phase === 'running' && y === GROUND_Y ? (Math.floor(game.ticks / 6) % 2) * 4 : 0;
      context.fillRect(52, y + 22, 5, 7 - leg);
      context.fillRect(65, y + 22, 5, 3 + leg);
      context.fillStyle = '#fff';
      context.fillRect(79, y - 1, 4, 4);
      context.fillStyle = '#8b5cf6';
      context.fillRect(62, y - 1, 3, 8);
      context.fillRect(56, y + 2, 3, 6);
      for (const obstacle of game.obstacles) {
        const top = GROUND_Y + 26 - obstacle.height;
        context.fillStyle = '#535353';
        context.fillRect(obstacle.x, top, obstacle.width, obstacle.height);
        context.fillRect(obstacle.x - 6, top + 7, 6, 6);
        context.fillRect(obstacle.x - 6, top + 1, 3, 9);
        context.fillRect(obstacle.x + obstacle.width, top + 12, 6, 5);
        context.fillRect(obstacle.x + obstacle.width + 3, top + 5, 3, 9);
      }
      context.fillStyle = '#aaa';
      context.font = '12px monospace';
      context.fillText('404', 440, 42);
    };
    const animate = (now: number) => {
      accumulator += document.hidden ? 0 : Math.min(100, now - lastTime);
      lastTime = now;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        game.ticks++;
        game.velocity += 0.8;
        game.y = Math.min(GROUND_Y, game.y + game.velocity);
        if (game.y === GROUND_Y) game.velocity = 0;
        const speed = Math.min(11, 6 + game.ticks * 0.001);
        if (game.ticks >= game.nextObstacle) {
          game.obstacles.push({
            x: canvas.width,
            width: 15 + Math.random() * 10,
            height: 24 + Math.random() * 12
          });
          game.nextObstacle =
            game.ticks + Math.max(60, Math.round(95 - speed * 3)) + Math.floor(Math.random() * 30);
        }
        for (const obstacle of game.obstacles) obstacle.x -= speed;
        game.obstacles = game.obstacles.filter((obstacle) => obstacle.x > -30);
        if (
          game.obstacles.some(
            (obstacle) =>
              73 > obstacle.x &&
              50 < obstacle.x + obstacle.width &&
              game.y + 22 > GROUND_Y + 26 - obstacle.height
          )
        ) {
          setScore(Math.floor(game.ticks / 5));
          setPhase('over');
          draw();
          return;
        }
        if (game.ticks % 6 === 0) setScore(Math.floor(game.ticks / 5));
      }
      draw();
      animation = requestAnimationFrame(animate);
    };
    draw();
    if (phase === 'running') animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, [phase]);

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='dino-title'
      className='fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-[#f7f7f7] px-4 text-[#535353]'
    >
      <div className='text-center'>
        <h2 id='dino-title' className='font-mono text-2xl'>
          {phase === 'over' ? 'GAME OVER' : 'No Internet'}
        </h2>
        <p className='mt-3 font-mono text-sm'>You cashed out so hard the internet left.</p>
        <p className='mt-2 font-mono text-xs text-[#666666]'>ERR_GREED_DETECTED</p>
      </div>
      <button
        ref={actionReference}
        type='button'
        onClick={play}
        aria-label={
          phase === 'running' ? 'Jump' : phase === 'over' ? 'Retry dino game' : 'Start dino game'
        }
        className='w-full max-w-[600px] touch-manipulation rounded border border-[#d0d0d0] text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600'
      >
        <canvas
          ref={canvasReference}
          width={600}
          height={200}
          className='block w-full'
          aria-hidden='true'
        />
        <span className='block border-t border-[#d0d0d0] py-3 font-mono text-xs'>
          {phase === 'running'
            ? 'Tap or Space to jump'
            : phase === 'over'
              ? 'One more run? Tap or Space.'
              : 'Tap or Space to play'}
        </span>
      </button>
      <p className='font-mono text-sm'>Score: {score}</p>
      <button
        type='button'
        onClick={returnToDesktop}
        className='min-h-11 rounded border border-[#535353]/40 px-4 py-2 font-mono text-xs hover:bg-[#535353] hover:text-white'
      >
        Return to desktop
      </button>
    </div>
  );
}
