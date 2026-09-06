import { useEffect, useRef, useState } from 'react';

const symbols = ['🍒', '🍋', '🍀', '⭐', '7'];
const payouts: Record<string, number> = { '7': 12, '⭐': 6, '🍀': 4, '🍋': 2, '🍒': 2 };
interface SlotMachineProperties {
  betAmount: number;
  balance: number;
  disabled: boolean;
  onStart: () => boolean;
  onResult: (multiplier: number, originalBet: number) => void;
}
export default function SlotMachine({
  betAmount,
  balance,
  disabled,
  onStart,
  onResult
}: SlotMachineProperties) {
  const [reels, setReels] = useState(['🍒', '🍋', '🍀']);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reelTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearInterval(reelTimer.current);
    },
    []
  );
  const spin = () => {
    if (disabled || spinning || betAmount > balance || !onStart()) return;
    setSpinning(true);
    const next = Array.from(
      { length: 3 },
      () => symbols[Math.floor(Math.random() * symbols.length)]
    );
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reelTimer.current = setInterval(
        () =>
          setReels(
            Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)])
          ),
        70
      );
    }
    timer.current = setTimeout(() => {
      clearInterval(reelTimer.current);
      setReels(next);
      setSpinning(false);
      const multiplier = next.every((symbol) => symbol === next[0])
        ? payouts[next[0]]
        : next[0] === next[1] || next[1] === next[2]
          ? 1.5
          : 0;
      onResult(multiplier, betAmount);
    }, 700);
  };
  return (
    <div className='flex h-full min-h-0 flex-col items-center justify-center gap-4 rounded-xl border border-[#d6b56a]/60 bg-[radial-gradient(circle_at_top,#18715d,#063f35)] p-4 text-[#fff6d9]'>
      <div className='text-center'>
        <p className='text-xl font-bold tracking-tight text-[#f1d789]'>Lucky slots</p>
        <p className='mt-1 text-[11px] text-white/70'>
          Three of a kind pays up to 12×. An adjacent pair pays 1.5×.
        </p>
      </div>
      <div className='flex rounded-xl border-4 border-[#b98b35] bg-[#fbf0c9] p-2 shadow-[0_7px_0_#755115]'>
        <div className='flex gap-2'>
          {reels.map((symbol, index) => (
            <div
              key={index}
              className='grid h-[clamp(80px,15vh,140px)] w-[clamp(58px,12vw,110px)] place-items-center rounded-lg bg-white text-5xl font-bold text-[#173b31] shadow-inner'
            >
              {symbol}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={spin}
        disabled={disabled || spinning || betAmount > balance}
        className='rounded-lg bg-[#d1a53d] px-7 py-2 text-xs font-bold text-[#173b31] shadow-[0_3px_0_#80621f] transition hover:bg-[#e7bd58] disabled:opacity-45'
      >
        {spinning ? 'Spinning...' : `Spin ${betAmount} credits`}
      </button>
    </div>
  );
}
