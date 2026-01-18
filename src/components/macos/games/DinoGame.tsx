import { useCallback, useEffect, useRef, useState } from 'react';

interface Dino {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  isJumping: boolean;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

const GROUND_Y = 150;
const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const INITIAL_SPEED = 6;

export default function DinoGame() {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameReference = useRef({
    dino: null as Dino | null,
    obstacles: [] as Obstacle[],
    speed: INITIAL_SPEED,
    frameCount: 0,
    animationId: 0
  });

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);

    gameReference.current = {
      dino: {
        x: 50,
        y: GROUND_Y,
        vy: 0,
        width: 20,
        height: 22,
        isJumping: false
      },
      obstacles: [],
      speed: INITIAL_SPEED,
      frameCount: 0,
      animationId: 0
    };
  }, []);

  const jump = useCallback(() => {
    const game = gameReference.current;
    if (game.dino && !game.dino.isJumping) {
      game.dino.vy = JUMP_FORCE;
      game.dino.isJumping = true;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameStarted || gameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, startGame, jump]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasReference.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const game = gameReference.current;

    const animate = () => {
      const dino = game.dino;
      if (!dino) return;

      game.frameCount++;

      dino.vy += GRAVITY;
      dino.y += dino.vy;

      if (dino.y >= GROUND_Y) {
        dino.y = GROUND_Y;
        dino.vy = 0;
        dino.isJumping = false;
      }

      if (game.frameCount % Math.floor(80 / (game.speed / INITIAL_SPEED)) === 0) {
        const height = 20 + Math.random() * 15;
        game.obstacles.push({
          x: canvas.width,
          width: 15 + Math.random() * 10,
          height
        });
      }

      game.obstacles = game.obstacles.filter((obs) => {
        obs.x -= game.speed;
        return obs.x > -obs.width;
      });

      for (const obs of game.obstacles) {
        if (
          dino.x < obs.x + obs.width &&
          dino.x + dino.width > obs.x &&
          dino.y + dino.height > GROUND_Y + dino.height - obs.height
        ) {
          setGameOver(true);
          cancelAnimationFrame(game.animationId);
          return;
        }
      }

      game.speed += 0.001;
      setScore(Math.floor(game.frameCount / 5));

      context.fillStyle = '#f7f7f7';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = '#535353';
      context.beginPath();
      context.moveTo(0, GROUND_Y + dino.height + 2);
      context.lineTo(canvas.width, GROUND_Y + dino.height + 2);
      context.stroke();

      context.fillStyle = '#535353';
      context.fillRect(dino.x, dino.y, dino.width, dino.height);

      const legOffset = Math.floor(game.frameCount / 5) % 2 === 0 ? 0 : 3;
      context.fillRect(dino.x + 2, dino.y + dino.height, 4, 6 - legOffset);
      context.fillRect(dino.x + dino.width - 6, dino.y + dino.height, 4, 6 + (legOffset ? -3 : 0));

      context.fillStyle = '#fff';
      context.fillRect(dino.x + dino.width - 6, dino.y + 3, 3, 3);

      for (const obs of game.obstacles) {
        context.fillStyle = '#535353';
        context.fillRect(obs.x, GROUND_Y + dino.height - obs.height, obs.width, obs.height);

        context.fillRect(obs.x + obs.width / 2 - 2, GROUND_Y + dino.height - obs.height - 5, 4, 5);
      }

      context.fillStyle = '#535353';
      context.font = 'bold 12px monospace';
      context.textAlign = 'right';
      context.fillText(score.toString().padStart(5, '0'), canvas.width - 10, 20);

      game.animationId = requestAnimationFrame(animate);
    };

    game.animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(game.animationId);
  }, [gameStarted, gameOver, score]);

  return (
    <div
      className='fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f7f7f7]'
      onClick={() => {
        if (!gameStarted || gameOver) {
          startGame();
        } else {
          jump();
        }
      }}
    >
      <div className='mb-8 text-center'>
        <div className='mb-4 font-mono text-2xl text-[#535353]'>
          {gameOver ? 'GAME OVER' : gameStarted ? '' : 'No Internet'}
        </div>
        {!gameStarted && (
          <>
            <p className='mb-2 font-mono text-sm text-[#535353]'>
              Unable to connect to the Internet
            </p>
            <p className='font-mono text-xs text-[#757575]'>ERR_GREED_DETECTED</p>
          </>
        )}
        {(gameOver || !gameStarted) && (
          <p className='mt-4 font-mono text-xs text-[#757575]'>
            Press SPACE to {gameOver ? 'restart' : 'play'}
          </p>
        )}
      </div>

      <canvas
        ref={canvasReference}
        width={600}
        height={200}
        className='rounded border border-[#e0e0e0]'
      />

      {gameOver && <div className='mt-4 font-mono text-lg text-[#535353]'>Score: {score}</div>}
    </div>
  );
}
