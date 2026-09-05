import { lazy, Suspense, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowDown, Terminal, X } from 'lucide-react';

import { profile } from '@/data/profile';

const Avatar3D = lazy(() => import('./avatar-3d'));
const MacOSDesktop = lazy(() => import('@/components/macos/MacOSDesktop'));

export default function Hero() {
  const [desktopOpen, setDesktopOpen] = useState(false);

  return (
    <section
      id='about'
      className='relative mx-auto max-w-6xl px-5 pb-16 pt-32 sm:px-8 lg:pb-24 lg:pt-44'
    >
      <div className='grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12'>
        <div>
          <p className='mb-5 font-mono text-xs tracking-wide text-muted-foreground'>
            {profile.name} <span className='mx-2 text-violet-400'>/</span> Odesa, Ukraine
          </p>
          <h1 className='text-[clamp(3.4rem,6.5vw,5.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] [word-spacing:0.03em]'>
            AI nerd.
            <br />
            <span className='text-violet-400'>I ship. A lot.</span>
          </h1>
          <p className='mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground'>
            {profile.summary}
          </p>
          <p className='mt-4 max-w-lg text-base leading-relaxed text-muted-foreground'>
            Give me a hard problem and a slightly unreasonable deadline. That is my kind of fun.
          </p>
          <div className='mt-8 flex flex-wrap gap-x-6 gap-y-4'>
            {profile.contacts.map((contact) => (
              <a
                key={contact.href}
                href={contact.href}
                target='_blank'
                rel='noreferrer'
                className='inline-flex min-h-10 items-center gap-2 text-sm font-medium text-foreground hover:text-violet-400'
              >
                <FontAwesomeIcon icon={contact.icon} className='h-4 w-4 text-muted-foreground' />
                {contact.label}
              </a>
            ))}
          </div>
        </div>
        <div className='min-w-0'>
          <div className='relative flex min-h-[400px] items-center justify-center'>
            <Suspense
              fallback={
                <img
                  src='/avatar-3d.webp'
                  alt='Maksym with his laptop'
                  className='h-72 w-72 object-contain'
                />
              }
            >
              <Avatar3D />
            </Suspense>
          </div>
          <div className='mt-4 text-center'>
            <button
              type='button'
              aria-expanded={desktopOpen}
              aria-controls={desktopOpen ? 'secret-desktop' : undefined}
              onClick={() => setDesktopOpen((open) => !open)}
              className='inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-mono text-xs text-muted-foreground hover:text-violet-400'
            >
              <Terminal aria-hidden='true' className='h-4 w-4' />
              {desktopOpen ? 'close my desktop' : 'psst. open my desktop'}
            </button>
          </div>
        </div>
      </div>
      {desktopOpen && (
        <div
          id='secret-desktop'
          className='mt-12 grid items-center gap-6 border-t border-border pt-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12'
        >
          <div>
            <p className='font-mono text-xs text-violet-400'>You found the side quest.</p>
            <h2 className='mt-3 text-3xl font-semibold tracking-tight'>
              This is a perfectly normal desktop.
            </h2>
            <p className='mt-4 max-w-sm text-muted-foreground'>
              The casino is fake. The terrible financial decisions are yours.
            </p>
            <button
              type='button'
              onClick={() => setDesktopOpen(false)}
              className='mt-5 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground'
            >
              <X aria-hidden='true' className='h-4 w-4' /> Back to the portfolio
            </button>
          </div>
          <div className='min-w-0'>
            <Suspense
              fallback={
                <p className='p-8 font-mono text-sm text-muted-foreground'>Booting mTOS...</p>
              }
            >
              <MacOSDesktop />
            </Suspense>
          </div>
        </div>
      )}
      <a
        href='#work-exp'
        className='mt-12 inline-flex min-h-11 items-center gap-3 text-sm text-muted-foreground hover:text-foreground lg:mt-16'
      >
        The work behind the words <ArrowDown aria-hidden='true' className='h-4 w-4' />
      </a>
    </section>
  );
}
