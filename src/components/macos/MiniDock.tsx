import type { AppId } from '@/types/macos';

import { motion } from 'motion/react';

interface DockItemData {
  id: AppId;
  icon: string;
  label: string;
}

const dockItems: DockItemData[] = [
  { id: 'terminal', icon: '⌘', label: 'Terminal' },
  { id: 'chatgbt', icon: '🤖', label: 'ChatGBT' },
  { id: 'casino', icon: '🎰', label: 'Casino' }
];

interface MiniDockProperties {
  onOpenApp: (appId: AppId) => void;
}

export default function MiniDock({ onOpenApp }: MiniDockProperties) {
  return (
    <div className='flex items-center justify-center gap-2'>
      {dockItems.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => onOpenApp(item.id)}
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className='group relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-white/10 to-white/5 text-sm shadow-lg transition-colors hover:from-white/15 hover:to-white/10'
          title={item.label}
        >
          {item.icon}
          <span className='pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100'>
            {item.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
