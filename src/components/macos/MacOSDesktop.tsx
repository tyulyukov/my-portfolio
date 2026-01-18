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
          className='group flex h-3 w-3 items-center justify-center rounded-full bg-red-500/80 transition-all hover:bg-red-500'
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
      <div className='relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950 via-purple-900 to-blue-950 shadow-2xl shadow-violet-500/10'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.1),transparent_50%)]' />

        <div className='flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3'>
          <span className='text-xs text-white/50'></span>
          <span className='font-mono text-[10px] text-white/30'>mTOS 15.0</span>
          <span className='ml-auto font-mono text-[10px] text-white/40'>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className='p-4'>
          <pre className='pointer-events-none select-none font-mono text-xs leading-relaxed text-transparent md:text-sm'>
            {`$ neofetch --dev
╭───────────────────────────╮
│    ███╗   ███╗████████╗   │
│    ████╗ ████║╚══██╔══╝   │
│    ██╔████╔██║   ██║      │
│    ██║╚██╔╝██║   ██║      │
│    ██║ ╚═╝ ██║   ██║      │
│    ╚═╝     ╚═╝   ╚═╝      │
╰───────────────────────────╯
  Age: 19
  Location: Odesa, Ukraine
  Languages: Ukrainian (native), English (B2)
  Stack: Node.js · TypeScript · AWS
  Passionate: true`}
          </pre>
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
