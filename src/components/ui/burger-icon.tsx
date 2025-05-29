import React from 'react';

import { cn } from '@/lib/utils';

type Properties = { open: boolean; className?: string };

export default function BurgerIcon({ open, className }: Properties) {
  const bar = 'absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300';

  return (
    <div className={cn('relative h-5 w-6', className)}>
      {/* top */}
      <span className={cn(bar, open ? 'top-2 rotate-45' : 'top-0 rotate-0')} />
      {/* middle (fades out) */}
      <span className={cn(bar, open ? 'opacity-0' : 'top-2 opacity-100')} />
      {/* bottom */}
      <span className={cn(bar, open ? 'top-2 -rotate-45' : 'top-4 rotate-0')} />
    </div>
  );
}
