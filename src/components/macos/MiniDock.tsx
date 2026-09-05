import React from 'react';

import type { AppId } from '@/types/macos';

import { useMacOS } from '@/contexts/MacOSContext';

const items: Array<{ id: AppId; icon: string; label: string; color: string }> = [
  { id: 'terminal', icon: '>_', label: 'Terminal', color: 'bg-[#25242a]' },
  { id: 'chatgbt', icon: 'G', label: 'ChatGBT', color: 'bg-[#10a37f]' },
  { id: 'casino', icon: '🎰', label: 'Casino', color: 'bg-[#d5a62f]' }
];

export default function MiniDock({ onOpenApp }: { onOpenApp: (appId: AppId) => void }) {
  const { openWindows } = useMacOS();
  return (
    <nav
      aria-label='Dock'
      className='absolute bottom-3 left-1/2 z-[999] flex -translate-x-1/2 gap-3 rounded-[22px] border border-white/70 bg-white/40 px-3 pb-3 pt-2 shadow-lg backdrop-blur-xl'
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onOpenApp(item.id)}
          aria-label={`Open ${item.label}`}
          className={`group relative grid h-12 w-12 place-items-center rounded-[14px] ${item.color} text-2xl font-bold text-white shadow-[inset_0_1px_1px_#ffffff55,0_3px_6px_#22173733] transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-violet-600 motion-reduce:transform-none sm:h-14 sm:w-14`}
        >
          <span aria-hidden='true'>{item.icon}</span>
          <span
            aria-hidden='true'
            className='pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-[#30283de8] px-2 py-1 text-xs font-normal opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
          >
            {item.label}
          </span>
          {openWindows.some((window) => window.appId === item.id) && (
            <span className='absolute -bottom-2 h-1 w-1 rounded-full bg-[#30283d]' />
          )}
        </button>
      ))}
    </nav>
  );
}
