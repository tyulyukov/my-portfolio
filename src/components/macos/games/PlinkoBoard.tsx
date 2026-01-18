import { useCallback, useEffect, useRef, useState } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  betAmount: number;
}

interface Peg {
  x: number;
  y: number;
  radius: number;
}

interface PlinkoBoardProperties {
  onResult: (multiplier: number, betAmount: number) => void;
  dropBall: number;
  betAmount: number;
}

const MULTIPLIERS = [0.2, 0.5, 0.5, 1, 2, 5, 2, 1, 0.5, 0.5, 0.2];
const MULTIPLIER_COLORS = [
  '#ef4444',
  '#f97316',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#10b981',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#f97316',
  '#ef4444'
];

export default function PlinkoBoard({ onResult, dropBall, betAmount }: PlinkoBoardProperties) {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const animationReference = useRef<number>(0);
  const ballsReference = useRef<Ball[]>([]);
  const pegsReference = useRef<Peg[]>([]);
  const ballIdReference = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const initPegs = useCallback((width: number, height: number) => {
    const pegs: Peg[] = [];
    const rows = 8;
    const pegRadius = 3;
    const startY = 30;
    const rowHeight = (height - 60) / rows;

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * 25;
      const startX = (width - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        pegs.push({
          x: startX + col * 25,
          y: startY + row * rowHeight,
          radius: pegRadius
        });
      }
    }

    pegsReference.current = pegs;
  }, []);

  useEffect(() => {
    const canvas = canvasReference.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setDimensions({ width: rect.width, height: rect.height });
      initPegs(rect.width, rect.height);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [initPegs]);

  useEffect(() => {
    if (dropBall === 0 || !dimensions.width) return;

    const newBall: Ball = {
      id: ++ballIdReference.current,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 20,
      y: 8,
      vx: 0,
      vy: 0,
      radius: 5,
      betAmount
    };

    ballsReference.current.push(newBall);
  }, [dropBall, dimensions.width, betAmount]);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasReference.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height } = dimensions;
    const GRAVITY = 0.25;
    const BOUNCE = 0.7;
    const slotWidth = width / MULTIPLIERS.length;

    const animate = () => {
      context.clearRect(0, 0, width, height);

      for (const [index, mult] of MULTIPLIERS.entries()) {
        context.fillStyle = MULTIPLIER_COLORS[index];
        context.globalAlpha = 0.3;
        context.fillRect(index * slotWidth, height - 20, slotWidth, 20);
        context.globalAlpha = 1;
        context.fillStyle = '#fff';
        context.font = 'bold 8px monospace';
        context.textAlign = 'center';
        context.fillText(`${mult}x`, index * slotWidth + slotWidth / 2, height - 6);
      }

      for (const peg of pegsReference.current) {
        context.beginPath();
        context.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        context.fillStyle = '#a78bfa';
        context.fill();
      }

      const completedBalls: Ball[] = [];

      for (const ball of ballsReference.current) {
        ball.vy += GRAVITY;
        ball.x += ball.vx;
        ball.y += ball.vy;

        for (const peg of pegsReference.current) {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const distribution = Math.hypot(dx, dy);
          const minDistribution = ball.radius + peg.radius;

          if (distribution < minDistribution) {
            const angle = Math.atan2(dy, dx);
            const speed = Math.hypot(ball.vx, ball.vy);

            ball.vx = Math.cos(angle) * speed * BOUNCE + (Math.random() - 0.5) * 1.5;
            ball.vy = Math.sin(angle) * speed * BOUNCE;

            ball.x = peg.x + (minDistribution + 1) * Math.cos(angle);
            ball.y = peg.y + (minDistribution + 1) * Math.sin(angle);
          }
        }

        if (ball.x < ball.radius) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx) * BOUNCE;
        }
        if (ball.x > width - ball.radius) {
          ball.x = width - ball.radius;
          ball.vx = -Math.abs(ball.vx) * BOUNCE;
        }

        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fillStyle = '#fbbf24';
        context.fill();
        context.strokeStyle = '#f59e0b';
        context.lineWidth = 1.5;
        context.stroke();

        if (ball.y >= height - 20 - ball.radius) {
          completedBalls.push(ball);
        }
      }

      for (const ball of completedBalls) {
        const slotIndex = Math.min(
          MULTIPLIERS.length - 1,
          Math.max(0, Math.floor(ball.x / slotWidth))
        );
        const multiplier = MULTIPLIERS[slotIndex];
        onResult(multiplier, ball.betAmount);
        ballsReference.current = ballsReference.current.filter((b) => b.id !== ball.id);
      }

      animationReference.current = requestAnimationFrame(animate);
    };

    animationReference.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationReference.current);
    };
  }, [dimensions, onResult]);

  return <canvas ref={canvasReference} className='h-full w-full' />;
}
