import { useCallback, useEffect, useRef, useState } from 'react';

interface Ball {
  id: number;
  launchedAt: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  betAmount: number;
  trail: Array<{ x: number; y: number }>;
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
  const lastDropReference = useRef(0);
  const betAmountReference = useRef(betAmount);
  const pegGlowReference = useRef(new Map<number, number>());
  const landingGlowReference = useRef({ slot: -1, until: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, pixelRatio: 1 });
  useEffect(() => {
    betAmountReference.current = betAmount;
  }, [betAmount]);

  const initPegs = useCallback((width: number, height: number) => {
    const pegs: Peg[] = [];
    const rows = 9;
    const usableWidth = width - Math.max(30, width * 0.1);
    const pegSpacing = usableWidth / 11;
    const pegRadius = Math.max(2.5, Math.min(4, pegSpacing * 0.1));
    const startY = 26;
    const rowHeight = Math.max(18, (height - 62) / rows);

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacing;
      const startX = (width - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        pegs.push({
          x: startX + col * pegSpacing,
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
      const rect = {
        width: Math.floor(canvas.clientWidth),
        height: Math.floor(canvas.clientHeight)
      };
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * pixelRatio;
      canvas.height = rect.height * pixelRatio;
      setDimensions({ ...rect, pixelRatio });
      initPegs(rect.width, rect.height);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [initPegs]);

  useEffect(() => {
    if (dropBall === 0 || !dimensions.width || dropBall === lastDropReference.current) return;
    lastDropReference.current = dropBall;

    const newBall: Ball = {
      id: ++ballIdReference.current,
      launchedAt: performance.now(),
      x: dimensions.width / 2 + (Math.random() - 0.5) * 20,
      y: 8,
      vx: 0,
      vy: 0,
      radius: 5,
      betAmount: betAmountReference.current,
      trail: []
    };

    ballsReference.current.push(newBall);
  }, [dropBall, dimensions.width]);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasReference.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height, pixelRatio } = dimensions;
    const GRAVITY = 0.25;
    const BOUNCE = 0.7;
    const slotWidth = width / MULTIPLIERS.length;

    const animateBall = ({
      ball,
      frameScale,
      now
    }: {
      ball: Ball;
      frameScale: number;
      now: number;
    }) => {
      ball.vy += GRAVITY * frameScale;
      ball.x += ball.vx * frameScale;
      ball.y += ball.vy * frameScale;
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();

      for (const [pegIndex, peg] of pegsReference.current.entries()) {
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
          pegGlowReference.current.set(pegIndex, now + 120);
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

      for (const [trailIndex, trailPoint] of ball.trail.entries()) {
        context.beginPath();
        context.arc(trailPoint.x, trailPoint.y, (trailIndex + 1) / 3, 0, Math.PI * 2);
        context.fillStyle = `rgba(251, 191, 36, ${(trailIndex + 1) / (ball.trail.length * 3)})`;
        context.fill();
      }
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      context.fillStyle = '#fbbf24';
      context.fill();
      context.strokeStyle = '#f59e0b';
      context.lineWidth = 1.5;
      context.stroke();
    };

    let previousFrame = performance.now();
    const animate = () => {
      const frameTime = performance.now();
      const frameScale = Math.min(2, (frameTime - previousFrame) / (1000 / 60));
      previousFrame = frameTime;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      for (const [index, mult] of MULTIPLIERS.entries()) {
        context.fillStyle = MULTIPLIER_COLORS[index];
        context.globalAlpha = 0.3;
        context.fillRect(index * slotWidth, height - 20, slotWidth, 20);
        context.globalAlpha = 1;
        context.fillStyle = '#fff';
        context.font = `bold ${Math.min(12, Math.max(8, slotWidth * 0.25))}px monospace`;
        context.textAlign = 'center';
        context.fillText(`${mult}x`, index * slotWidth + slotWidth / 2, height - 6);
      }

      const now = performance.now();
      for (const [pegIndex, peg] of pegsReference.current.entries()) {
        const glow = pegGlowReference.current.get(pegIndex) ?? 0;
        context.beginPath();
        context.arc(peg.x, peg.y, peg.radius + (glow > now ? 3 : 0), 0, Math.PI * 2);
        context.fillStyle = glow > now ? '#fbbf24' : '#ecdeb0';
        context.fill();
      }

      const completedBalls: Ball[] = [];

      for (const ball of ballsReference.current) {
        animateBall({ ball, frameScale, now });

        if (ball.y >= height - 20 - ball.radius || now - ball.launchedAt >= 6000) {
          completedBalls.push(ball);
        }
      }

      for (const ball of completedBalls) {
        const slotIndex = Math.min(
          MULTIPLIERS.length - 1,
          Math.max(0, Math.floor(ball.x / slotWidth))
        );
        const multiplier = MULTIPLIERS[slotIndex];
        landingGlowReference.current = { slot: slotIndex, until: now + 500 };
        onResult(multiplier, ball.betAmount);
        ballsReference.current = ballsReference.current.filter((b) => b.id !== ball.id);
      }

      if (landingGlowReference.current.until > now) {
        const slot = landingGlowReference.current.slot;
        context.fillStyle = 'rgba(255,255,255,.5)';
        context.fillRect(slot * slotWidth, height - 20, slotWidth, 20);
      }

      animationReference.current = requestAnimationFrame(animate);
    };

    animationReference.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationReference.current);
    };
  }, [dimensions, onResult]);

  return (
    <canvas
      ref={canvasReference}
      className='h-full min-h-[210px] w-full rounded-xl'
      aria-label='Plinko board'
    />
  );
}
