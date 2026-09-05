import { lazy, Suspense, useRef, useState } from 'react';

import type { AvatarHandle } from './avatar-3d';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowDown, Terminal } from 'lucide-react';

import { avatarAssets } from '@/data/avatar';
import { profile } from '@/data/profile';

const Avatar3D = lazy(() => import('./avatar-3d'));
const MacOSDesktop = lazy(() => import('@/components/macos/MacOSDesktop'));

export default function Hero() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const avatarReference = useRef<AvatarHandle>(null);
  const desktopButtonReference = useRef<HTMLButtonElement>(null);
  const closeDesktop = () => {
    setDesktopOpen(false);
    requestAnimationFrame(() => desktopButtonReference.current?.focus());
  };
  const openDesktop = () => {
    void import('@/components/macos/MacOSDesktop');
    if (avatarReference.current) avatarReference.current.enterDesktop();
    else setDesktopOpen(true);
  };

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
                  src={avatarAssets.poster}
                  alt='Maksym with his laptop'
                  className='aspect-square w-full max-w-[400px] object-contain p-3'
                />
              }
            >
              <Avatar3D
                desktopOpen={desktopOpen}
                ref={avatarReference}
                onEnterDesktop={() => setDesktopOpen(true)}
              />
            </Suspense>
          </div>
          <div className='mt-4 text-center'>
            <button
              type='button'
              ref={desktopButtonReference}
              aria-expanded={desktopOpen}
              aria-haspopup='dialog'
              onClick={openDesktop}
              className='inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-mono text-xs text-muted-foreground hover:text-violet-400'
            >
              <Terminal aria-hidden='true' className='h-4 w-4' />
              {desktopOpen ? 'close my desktop' : 'psst. open my desktop'}
            </button>
          </div>
        </div>
      </div>
      {desktopOpen && (
        <Suspense fallback={<p role='status'>Booting mTOS...</p>}>
          <MacOSDesktop onClose={closeDesktop} />
        </Suspense>
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
