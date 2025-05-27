import React, { ReactNode } from 'react';

import { Glow } from '@codaworks/react-glow';

import { cn } from '@/lib/utils';

interface CardProps {
  logo: string;
  company: string;
  role: string;
  period: string;
  blurb: ReactNode;
  className?: string;
}

export default function NebulaCard({ logo, company, role, period, blurb, className }: CardProps) {
  return (
    /* one Glow per card – keeps each logical unit self-contained */
    <Glow color='#8b5cf6'>
      <article
        /* the border is always visible; the glow variant enhances it on hover */
        className={cn(
          'relative flex h-full flex-col rounded-3xl border',
          'border-white/10 bg-[#763CAC]/30 p-8 transition-all',
          /* glow: styles fire only while the pointer sits over the card
             (rules added by @codaworks/react-glow Tailwind plugin)           */
          'glow:border-glow/80 glow:bg-[#8b5cf6]/20 glow:shadow-[0_0_24px_var(--glow)]',
          className
        )}
      >
        {/* ── header row ───────────────────────────────────────────── */}
        <header className='mb-4 flex items-start gap-4'>
          <div className='h-12 w-12 shrink-0 sm:h-16 sm:w-16'>
            <img
              src={logo}
              alt={company}
              className={cn(
                'h-full w-full rounded-2xl border border-white/10 object-contain transition-all glow:border-glow/80 glow:shadow-[0_0_24px_var(--glow)]',
                {
                  'bg-white p-2': logo.includes('lab325'),
                  'bg-black p-2': logo.includes('sda')
                }
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

        {/* ── description ─────────────────────────────────────────── */}
        <p className='flex-1 text-sm leading-relaxed'>{blurb}</p>
      </article>
    </Glow>
  );
}
