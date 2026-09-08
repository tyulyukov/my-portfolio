import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { AppId, WindowState } from '@/types/macos';
import type { ReactElement, RefObject } from 'react';

import { motion, useDragControls, useMotionValue } from 'motion/react';
import { createPortal } from 'react-dom';

import { MacOSProvider, useMacOS } from '@/contexts/MacOSContext';

import CasinoApp from './apps/CasinoApp';
import ChatGBTApp from './apps/ChatGBTApp';
import TerminalApp from './apps/TerminalApp';
import ExplosionEffect from './effects/ExplosionEffect';
import DinoGame from './games/DinoGame';
import MiniDock from './MiniDock';

import './mtos.css';

const titles: Record<AppId, string> = {
  terminal: 'Terminal',
  chatgbt: 'ChatGBT',
  casino: 'Lucky Arcade'
};
const content: Record<AppId, () => ReactElement> = {
  terminal: TerminalApp,
  chatgbt: ChatGBTApp,
  casino: CasinoApp
};
const sizes: Record<AppId, { width: number; height: number; top: number }> = {
  terminal: { width: 600, height: 420, top: 28 },
  chatgbt: { width: 760, height: 570, top: 58 },
  casino: { width: 860, height: 600, top: 88 }
};

function AppWindow({
  window,
  workarea
}: {
  window: WindowState;
  workarea: RefObject<HTMLDivElement | null>;
}) {
  const { closeWindow, focusWindow, minimizeWindow, toggleMaximizeWindow } = useMacOS();
  const controls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 640px)').matches);
  const App = content[window.appId];
  const size = sizes[window.appId];
  useLayoutEffect(() => {
    x.set(0);
    y.set(0);
  }, [window.maximized, x, y]);
  useEffect(() => {
    const area = workarea.current;
    if (!area) return;
    const observer = new ResizeObserver(() => {
      setMobile(matchMedia('(max-width: 640px)').matches);
      x.set(0);
      y.set(0);
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [workarea, x, y]);
  return (
    <motion.section
      role='region'
      aria-label={titles[window.appId]}
      onPointerDown={() => focusWindow(window.id)}
      onFocusCapture={() => focusWindow(window.id)}
      drag={!mobile && !window.maximized}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={workarea}
      style={{
        x,
        y,
        zIndex: window.zIndex,
        width: `min(${size.width}px, calc(100% - 24px))`,
        height: `min(${size.height}px, calc(100% - min(${size.top}px, 8vh) - 12px))`,
        top: `min(${size.top}px, 8vh)`,
        left: `calc((100% - min(${size.width}px, calc(100% - 24px))) / 2)`
      }}
      className={`mtos-window ${window.maximized ? 'mtos-window-maximized' : ''} ${window.minimized ? 'pointer-events-none invisible' : ''}`}
      inert={window.minimized}
    >
      <div
        onPointerDown={(event) => {
          if (!mobile && !window.maximized) controls.start(event);
        }}
        onDoubleClick={() => toggleMaximizeWindow(window.id)}
        className='mtos-titlebar'
      >
        <div className='flex gap-1'>
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onClick={() => closeWindow(window.id)}
            aria-label={`Close ${titles[window.appId]}`}
            className='mtos-light mtos-close'
          >
            ×
          </button>
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onClick={() => minimizeWindow(window.id)}
            aria-label={`Minimize ${titles[window.appId]}`}
            className='mtos-light mtos-minimize'
          >
            −
          </button>
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onClick={() => toggleMaximizeWindow(window.id)}
            aria-label={`${window.maximized ? 'Restore' : 'Maximize'} ${titles[window.appId]}`}
            className='mtos-light mtos-maximize'
          >
            +
          </button>
        </div>
        <span>{titles[window.appId]}</span>
        <span className='w-[76px]' />
      </div>
      <div className='min-h-0 flex-1 overflow-hidden'>
        <App />
      </div>
    </motion.section>
  );
}

function Shell({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const appsButtonReference = useRef<HTMLButtonElement>(null);
  const menuReference = useRef<HTMLDivElement>(null);
  const shellReference = useRef<HTMLDivElement>(null);
  const previousControl = useRef<HTMLElement | undefined>(undefined);
  const workarea = useRef<HTMLDivElement>(null);
  const [appsOpen, setAppsOpen] = useState(false);
  const [clock, setClock] = useState('');
  const { openWindows, focusedWindowId, openApp, gamePhase } = useMacOS();
  const focused = openWindows.find((item) => item.id === focusedWindowId);
  const closeAppsMenu = () => {
    if (menuReference.current?.contains(document.activeElement))
      appsButtonReference.current?.focus();
    setAppsOpen(false);
  };
  const overlay = gamePhase !== 'normal';
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const update = () =>
      setClock(
        new Intl.DateTimeFormat(undefined, {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date())
      );
    update();
    const timer = setInterval(update, 30_000);
    return () => {
      clearInterval(timer);
      node?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  useLayoutEffect(() => {
    const node = shellReference.current;
    if (!node) return;
    node.inert = overlay;
    if (!overlay && previousControl.current?.isConnected) previousControl.current.focus();
  }, [overlay]);
  return createPortal(
    <dialog
      ref={dialog}
      aria-label='mTOS desktop'
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && (overlay || appsOpen)) {
          event.preventDefault();
          if (appsOpen) closeAppsMenu();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (appsOpen) closeAppsMenu();
        else if (!overlay) onClose();
      }}
      className='mtos-dialog'
    >
      <div
        ref={shellReference}
        className='mtos-shell'
        onPointerDownCapture={(event) => {
          if (appsOpen && event.target instanceof Element && !event.target.closest('.mtos-menubar'))
            closeAppsMenu();
        }}
        onFocusCapture={(event) => {
          previousControl.current = event.target;
        }}
      >
        <header className='mtos-menubar'>
          <button
            ref={appsButtonReference}
            onClick={() => setAppsOpen((open) => !open)}
            aria-expanded={appsOpen}
            aria-controls={appsOpen ? 'mtos-apps-menu' : undefined}
            className='mtos-menu-button'
          >
            <strong className='text-base tracking-tight'>mt.</strong>
            <span>Apps</span>
          </button>
          {appsOpen && (
            <>
              <div ref={menuReference} id='mtos-apps-menu' className='mtos-apps-menu'>
                {(['terminal', 'chatgbt', 'casino'] as AppId[]).map((app) => (
                  <button
                    key={app}
                    onClick={() => {
                      openApp(app);
                      closeAppsMenu();
                    }}
                  >
                    {titles[app]}
                  </button>
                ))}
              </div>
            </>
          )}
          <span className='ml-5 text-xs font-semibold'>
            {focused ? titles[focused.appId] : 'mTOS'}
          </span>
          <span className='ml-auto text-xs'>{clock}</span>
          <button onClick={onClose} className='ml-4 rounded-md px-2 py-1 text-xs hover:bg-white/40'>
            Exit mTOS
          </button>
        </header>
        <div
          id='mtos-workarea'
          ref={workarea}
          className='relative mb-[90px] min-h-0 flex-1 overflow-hidden'
        >
          {openWindows.map((window) => (
            <AppWindow key={window.id} window={window} workarea={workarea} />
          ))}
        </div>
        <MiniDock onOpenApp={openApp} />
      </div>
      {gamePhase === 'exploding' && <ExplosionEffect />}
      {gamePhase === 'dino' && <DinoGame />}
    </dialog>,
    document.body
  );
}

export default function MacOSDesktop({ onClose }: { onClose: () => void }) {
  return (
    <MacOSProvider>
      <Shell onClose={onClose} />
    </MacOSProvider>
  );
}
