import { useCallback, useState } from 'react';

import { useMacOS } from '@/contexts/MacOSContext';

import PlinkoBoard from '../games/PlinkoBoard';

export default function CasinoApp() {
  const { casinoBalance, hasPlayedCasino, updateBalance, markCasinoPlayed, triggerExplosion } =
    useMacOS();
  const [betAmount, setBetAmount] = useState(10);
  const [dropCounter, setDropCounter] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [lastResult, setLastResult] = useState<{ multiplier: number; won: boolean }>();

  const handleDrop = () => {
    if (betAmount > casinoBalance || isDropping) return;
    updateBalance(-betAmount);
    setDropCounter((previous) => previous + 1);
    markCasinoPlayed();
    setLastResult(undefined);
    setIsDropping(true);
  };

  const handleResult = useCallback(
    (multiplier: number, originalBet: number) => {
      const winnings = originalBet * multiplier;
      updateBalance(winnings);
      setLastResult({ multiplier, won: multiplier >= 1 });
      setIsDropping(false);
    },
    [updateBalance]
  );

  const handleWithdraw = () => {
    triggerExplosion();
  };

  return (
    <div className='flex h-full flex-col bg-gradient-to-b from-purple-950 to-black'>
      <div className='flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-amber-600 to-orange-600 px-2 py-1.5'>
        <div>
          <span className='text-xs font-bold text-white'>🎰 Lucky Plinko</span>
        </div>
        <div className='rounded bg-black/30 px-1.5 py-0.5'>
          <span className='font-mono text-xs font-bold text-emerald-400'>
            {Math.floor(casinoBalance)} fake credits
          </span>
        </div>
      </div>

      <div className='min-h-0 flex-1 p-1.5'>
        <PlinkoBoard onResult={handleResult} dropBall={dropCounter} betAmount={betAmount} />
      </div>

      <div
        role='status'
        aria-live='polite'
        className={`mx-1.5 flex h-5 shrink-0 items-center justify-center rounded text-xs font-bold ${
          lastResult
            ? lastResult.won
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
            : ''
        }`}
      >
        {lastResult && (
          <span>
            {lastResult.won ? '🎉 nice bounce' : '😢 the board is evil'} · {lastResult.multiplier}x
          </span>
        )}
      </div>

      <div className='space-y-1.5 border-t border-white/10 bg-black/30 p-1.5'>
        <div className='flex items-center gap-1.5'>
          <span className='text-[11px] text-white/50'>Fake bet:</span>
          <div className='flex gap-1'>
            {[5, 10, 25, 50].map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={amount > casinoBalance || isDropping}
                className={`rounded px-1.5 py-2 font-mono text-[11px] transition-colors ${
                  betAmount === amount
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                } disabled:opacity-30`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        <div className='flex gap-1.5'>
          <button
            onClick={handleDrop}
            disabled={betAmount > casinoBalance || isDropping}
            className='min-h-10 flex-1 rounded bg-gradient-to-r from-violet-600 to-purple-600 py-2 text-xs font-bold text-white transition-all hover:from-violet-500 hover:to-purple-500 disabled:opacity-50'
          >
            {isDropping ? 'Ball is vibing...' : 'Drop Ball'}
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!hasPlayedCasino || isDropping}
            className={`min-h-10 rounded px-2 py-2 text-xs font-bold transition-all ${
              hasPlayedCasino
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500'
                : 'bg-white/10 text-white/30'
            }`}
          >
            💰 Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
