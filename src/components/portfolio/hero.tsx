import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@/components/ui/button';
import { profile } from '@/data/profile';

export default function Hero() {
  return (
    <section
      id='about'
      /* takes full viewport height minus navbar → always vertically centred */
      className='bg-fluid relative flex min-h-[100vh] flex-col items-center justify-center px-4'
    >
      {/* avatar + soft glow */}
      <div className='relative mb-12'>
        <div
          className='absolute inset-0 rounded-full'
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #763CAC 0%, rgba(50,15,133,0) 100%)'
          }}
        />
        <img
          src='/avatar.webp'
          alt='avatar'
          className='relative h-40 w-40 rounded-full md:h-52 md:w-52'
        />
      </div>

      {/* copy */}
      <div className='max-w-3xl space-y-6 text-center'>
        <p className='text-sm text-muted-foreground md:text-base'>
          Hello! I&#39;m {profile.name} 🇺🇦 &nbsp;
          {Math.ceil((Date.now() - new Date('2022-08-01').getTime()) / (1000 * 60 * 60 * 24 * 365))}
          + yrs in industry
        </p>

        {/* headline */}
        <h1 className='overflow-visible font-extrabold leading-tight tracking-tight'>
          {/* desktop / tablet (≥ md) → exactly 2 lines */}
          <span className='hidden text-4xl md:block lg:text-6xl'>
            a backend dev who keeps your app&nbsp;
            <span className='bg-gradient-to-r from-[#b295ff] via-[#8455ff] to-[#4020d6] bg-clip-text text-transparent'>
              running at scale.
            </span>
          </span>

          {/* mobile → 3 tidy lines */}
          <span className='block text-4xl md:hidden'>a backend dev who</span>
          <span className='block text-4xl md:hidden'>keeps your app</span>
          <span className='block bg-gradient-to-r from-[#b295ff] via-[#8455ff] to-[#4020d6] bg-clip-text text-4xl text-transparent md:hidden'>
            running at scale.
          </span>
        </h1>

        {/* sub-headline */}
        {/*<h2 className='text-2xl font-semibold md:text-3xl'>i build resilient systems.</h2>*/}

        <p className='mx-auto max-w-xl text-sm text-muted-foreground md:text-base'>
          {profile.summary}
        </p>

        {/* contact buttons */}
        <div className='flex flex-wrap justify-center gap-3 pt-2'>
          {profile.contacts.map((c) => (
            <Button
              key={c.href}
              asChild
              variant='secondary'
              size='sm'
              className='transition-all duration-200 hover:scale-105'
              style={{
                backgroundColor: c.color,
                color: '#ffffff'
              }}
            >
              <a href={c.href} target='_blank' rel='noreferrer' className='flex items-center gap-2'>
                <FontAwesomeIcon icon={c.icon} />
                {c.label}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
