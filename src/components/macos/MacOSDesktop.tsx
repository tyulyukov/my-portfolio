import { useEffect } from 'react';

import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { MacOSProvider, useMacOS } from '@/contexts/MacOSContext';

import CasinoApp from './apps/CasinoApp';
import ChatGBTApp from './apps/ChatGBTApp';
import TerminalApp from './apps/TerminalApp';
import ExplosionEffect from './effects/ExplosionEffect';
import DinoGame from './games/DinoGame';
import MiniDock from './MiniDock';

function FullScreenWindow({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className='absolute inset-0 z-50 flex flex-col overflow-hidden rounded-xl border border-violet-500/20 bg-black shadow-2xl shadow-violet-500/10'
    >
      <div className='flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3'>
        <button
          onClick={onClose}
          aria-label={`Close ${title}`}
          className='group flex h-3 w-3 items-center justify-center rounded-full bg-red-500/80 transition-all hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
        >
          <span className='hidden text-[8px] leading-none text-red-900 group-hover:block'>×</span>
        </button>
        <div className='h-3 w-3 rounded-full bg-yellow-500/80' />
        <div className='h-3 w-3 rounded-full bg-green-500/80' />
        <span className='ml-2 font-mono text-xs text-muted-foreground'>{title}</span>
      </div>
      <div className='flex-1 overflow-hidden'>{children}</div>
    </motion.div>
  );
}

function MacOSDesktopInner() {
  const { openWindows, gamePhase, openApp, closeWindow } = useMacOS();

  const overlayOpen = gamePhase !== 'normal';
  useEffect(() => {
    if (!overlayOpen) return;
    const root = document.getElementById('root');
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    return () => {
      if (root) root.inert = false;
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [overlayOpen]);

  const activeWindow = openWindows.at(-1);

  const renderAppContent = (appId: string) => {
    switch (appId) {
      case 'terminal': {
        return <TerminalApp />;
      }
      case 'chatgbt': {
        return <ChatGBTApp />;
      }
      case 'casino': {
        return <CasinoApp />;
      }
      default: {
        return null;
      }
    }
  };

  const getWindowTitle = (appId: string) => {
    switch (appId) {
      case 'terminal': {
        return 'terminal — zsh';
      }
      case 'chatgbt': {
        return 'ChatGBT — Always Helpful';
      }
      case 'casino': {
        return 'Lucky Plinko Casino';
      }
      default: {
        return appId;
      }
    }
  };

  return (
    <>
      <div className='relative w-full max-w-[440px] overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950 via-purple-900 to-blue-950 shadow-2xl shadow-violet-500/10'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.1),transparent_50%)]' />

        <div className='flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3'>
          <span className='text-xs text-white/50'></span>
          <span className='font-mono text-[10px] text-white/30'>mTOS 15.0</span>
          <span className='ml-auto font-mono text-[10px] text-white/40'>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className='flex h-[320px] flex-col items-center justify-center text-white/50'>
          <p className='font-display text-5xl font-semibold tracking-tight'>mTOS</p>
          <p className='mt-2 font-mono text-xs'>very serious operating system</p>
        </div>

        <div className='border-t border-white/10 bg-white/5 px-4 py-2'>
          <MiniDock onOpenApp={openApp} />
        </div>

        <AnimatePresence mode='wait'>
          {activeWindow && (
            <FullScreenWindow
              key={activeWindow.id}
              title={getWindowTitle(activeWindow.appId)}
              onClose={() => closeWindow(activeWindow.id)}
            >
              {renderAppContent(activeWindow.appId)}
            </FullScreenWindow>
          )}
        </AnimatePresence>
      </div>

      {gamePhase === 'exploding' && createPortal(<ExplosionEffect />, document.body)}
      {gamePhase === 'dino' && createPortal(<DinoGame />, document.body)}
    </>
  );
}

export default function MacOSDesktop() {
  return (
    <MacOSProvider>
      <MacOSDesktopInner />
    </MacOSProvider>
  );
}
