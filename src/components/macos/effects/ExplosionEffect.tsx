import { useEffect, useRef, useState } from 'react';

import { useMacOS } from '@/contexts/MacOSContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS = ['#ff6b35', '#f7c59f', '#ff4500', '#ffd700', '#ffffff', '#ff1744'];

export default function ExplosionEffect() {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const { showDinoGame } = useMacOS();
  const [showProcessing, setShowProcessing] = useState(true);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const processingTimer = setTimeout(() => {
      setShowProcessing(false);
      setShake(true);

      setTimeout(() => setShake(false), 500);
    }, 1500);

    return () => clearTimeout(processingTimer);
  }, []);

  useEffect(() => {
    if (showProcessing) return;

    const canvas = canvasReference.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let index = 0; index < 250; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 15;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        maxLife: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      });
    }

    let frame = 0;
    const maxFrames = 180;

    const animate = () => {
      frame++;

      context.fillStyle = `rgba(0, 0, 0, ${frame < 60 ? 0.1 : 0.15})`;
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.vx *= 0.99;
        p.life -= 0.008;
        p.rotation += p.rotationSpeed;

        if (p.life > 0) {
          context.save();
          context.translate(p.x, p.y);
          context.rotate(p.rotation);
          context.globalAlpha = p.life;
          context.fillStyle = p.color;
          context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          context.restore();
        }
      }

      if (frame >= maxFrames) {
        context.fillStyle = '#fff';
        context.globalAlpha = (frame - maxFrames) / 30;
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (frame >= maxFrames + 30) {
          showDinoGame();
          return;
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [showProcessing, showDinoGame]);

  if (showProcessing) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-black'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent' />
          <p className='font-mono text-sm text-emerald-400'>Processing withdrawal...</p>
          <p className='mt-2 font-mono text-xs text-white/50'>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] bg-black ${shake ? 'animate-shake' : ''}`}>
      <canvas ref={canvasReference} className='h-full w-full' />
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
