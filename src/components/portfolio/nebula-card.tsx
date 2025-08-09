import React from 'react';

import type { ReactNode } from 'react';

import { Glow } from '@codaworks/react-glow';

import { cn } from '@/lib/utils';

interface CardProperties {
  logo: string;
  company: string;
  role: string;
  period: string;
  blurb: ReactNode;
  glow?: boolean;
  className?: string;
}

export default function NebulaCard({
  logo,
  company,
  role,
  period,
  blurb,
  glow = true,
  className
}: CardProperties) {
  const card = (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-3xl border border-white/10 bg-[#763CAC]/30 p-8 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]',
        glow && 'glow:border-glow/80 glow:bg-[#8b5cf6]/20 glow:shadow-[0_0_24px_var(--glow)]',
        className
      )}
    >
      <header className='mb-4 flex items-start gap-4'>
        <div className='h-12 w-12 shrink-0 sm:h-16 sm:w-16'>
          <img
            src={logo}
            alt={company}
            className={cn(
              'h-full w-full rounded-2xl border border-white/10 object-contain transition-all',
              glow && 'glow:border-glow/80 glow:shadow-[0_0_24px_var(--glow)]',
              logo.includes('lab325') && 'bg-white p-2',
              logo.includes('sda') && 'bg-black p-2'
            )}
          />
        </div>

        <div className='self-center'>
          <h3 className='text-xl font-bold leading-tight sm:text-2xl'>{company}</h3>
          <p className='text-xs sm:text-sm'>
            <span className='font-medium text-primary/90'>{role}</span>
            <span className='mx-1.5'>·</span>
            <span className='font-normal'>{period}</span>
          </p>
        </div>
      </header>

      <p className='flex-1 text-sm leading-relaxed'>{blurb}</p>
    </article>
  );

  return glow ? <Glow color='#8b5cf6'>{card}</Glow> : card;
}
