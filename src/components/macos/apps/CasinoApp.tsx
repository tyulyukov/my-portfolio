import { useCallback, useRef, useState } from 'react';

import { useMacOS } from '@/contexts/MacOSContext';

import PlinkoBoard from '../games/PlinkoBoard';
import SlotMachine from '../games/SlotMachine';

type Game = 'plinko' | 'slots';
export default function CasinoApp() {
  const { casinoBalance, hasPlayedCasino, updateBalance, markCasinoPlayed, triggerExplosion } =
    useMacOS();
  const [betAmount, setBetAmount] = useState(10);
  const [dropCounter, setDropCounter] = useState(0);
  const [game, setGame] = useState<Game>('plinko');
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState('Pick a game and make it interesting.');
  const activeBetsReference = useRef(0);
  const balanceReference = useRef(casinoBalance);
  const startBet = () => {
    if (
      (game === 'slots' && activeBetsReference.current > 0) ||
      betAmount > balanceReference.current
    )
      return false;
    activeBetsReference.current += 1;
    balanceReference.current -= betAmount;
    updateBalance(-betAmount);
    markCasinoPlayed();
    setIsBusy(true);
    setResult('The house is watching.');
    return true;
  };
  const drop = () => {
    if (startBet()) setDropCounter((count) => count + 1);
  };
  const finish = useCallback(
    (multiplier: number, originalBet: number) => {
      const payout = originalBet * multiplier;
      balanceReference.current += payout;
      updateBalance(payout);
      setResult(
        payout
          ? `${multiplier}× landed. ${payout} ${payout === 1 ? 'credit' : 'credits'} returned.`
          : 'The board took it personally.'
      );
      activeBetsReference.current -= 1;
      setIsBusy(activeBetsReference.current > 0);
    },
    [updateBalance]
  );
  const borrow = () => {
    if (activeBetsReference.current === 0 && balanceReference.current < 5) {
      balanceReference.current += 100;
      updateBalance(100);
      setResult('A discreet 100-credit loan appeared under the felt.');
    }
  };
  return (
    <div className='flex h-full min-h-0 flex-col bg-[#f4e8c4] font-sans text-[#1f4137]'>
      <header className='flex shrink-0 items-center justify-between border-b border-[#cdb471] bg-[#fff9e8]/90 px-3 py-2'>
        <div>
          <h2 className='text-sm font-bold tracking-tight'>Lucky Arcade</h2>
          <p className='text-[10px] text-[#76694b]'>Excellent odds. For someone.</p>
        </div>
        <div className='rounded-lg border border-[#d7ba70] bg-[#f7e6b6] px-2.5 py-1 text-right'>
          <p className='text-[9px] uppercase tracking-wider text-[#806c38]'>Credits</p>
          <output aria-label='Credit balance' className='block font-mono text-sm font-bold'>
            {casinoBalance}
          </output>
        </div>
      </header>
      <div className='flex shrink-0 gap-1 border-b border-[#d4bd82] bg-[#eee0bb] px-3 pt-2'>
        <button
          onClick={() => {
            setGame('plinko');
          }}
          disabled={isBusy}
          className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold ${game === 'plinko' ? 'bg-[#08604d] text-[#fff7dc]' : 'text-[#645b45] hover:bg-white/40'}`}
        >
          Plinko
        </button>
        <button
          onClick={() => setGame('slots')}
          disabled={isBusy}
          className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold ${game === 'slots' ? 'bg-[#08604d] text-[#fff7dc]' : 'text-[#645b45] hover:bg-white/40'}`}
        >
          Slots
        </button>
      </div>
      <div className='min-h-0 flex-1 p-2.5'>
        {game === 'plinko' ? (
          <div className='h-full min-h-[210px] rounded-xl border-4 border-[#b88d3b] bg-[#075847] p-1.5 shadow-inner'>
            <PlinkoBoard onResult={finish} dropBall={dropCounter} betAmount={betAmount} />
          </div>
        ) : (
          <SlotMachine
            betAmount={betAmount}
            balance={casinoBalance}
            disabled={isBusy}
            onStart={startBet}
            onResult={finish}
          />
        )}
      </div>
      <div
        role='status'
        aria-label='Game result'
        aria-live='polite'
        className='mx-3 mb-2 rounded-md bg-[#e4d3a1] px-2 py-1.5 text-center text-[11px] text-[#5c5139]'
      >
        {result}
      </div>
      <footer className='shrink-0 border-t border-[#cdb471] bg-[#fff9e8] p-2.5'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-1'>
            <span className='mr-1 text-[11px] text-[#76694b]'>Bet</span>
            {[5, 10, 25, 50].map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={isBusy || amount > casinoBalance}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${betAmount === amount ? 'bg-[#08604d] text-white' : 'bg-[#ecdfb9] text-[#4c493a] hover:bg-[#e2cd91]'} disabled:opacity-40`}
              >
                {amount}
              </button>
            ))}
          </div>
          <button
            onClick={borrow}
            disabled={isBusy || casinoBalance >= 5}
            className='text-[10px] font-medium text-[#07604d] underline decoration-[#a88b47] underline-offset-2 disabled:hidden'
          >
            Borrow 100 credits
          </button>
        </div>
        <div className='mt-2 flex gap-2'>
          <button
            hidden={game !== 'plinko'}
            onClick={drop}
            disabled={game !== 'plinko' || betAmount > casinoBalance}
            className='flex-1 rounded-lg bg-[#08604d] py-2 text-xs font-bold text-[#fff8e4] transition hover:bg-[#0b735d] disabled:opacity-40'
          >
            Drop ball
          </button>
          <button
            onClick={triggerExplosion}
            disabled={!hasPlayedCasino || isBusy}
            className='rounded-lg border border-[#b38d41] bg-[#d4ad52] px-3 py-2 text-xs font-bold text-[#3d351e] transition hover:bg-[#e4c36b] disabled:opacity-40'
          >
            Cash out
          </button>
        </div>
      </footer>
    </div>
  );
}
