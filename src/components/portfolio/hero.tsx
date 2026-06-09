import { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Aurora from '@/components/Aurora';
import DecryptedText from '@/components/DecryptedText';
import MacOSDesktop from '@/components/macos/MacOSDesktop';
import ShinyText from '@/components/ShinyText';
import SplitText from '@/components/SplitText';
import { profile } from '@/data/profile';

const yearsExp = Math.ceil(
  (Date.now() - new Date('2022-08-01').getTime()) / (1000 * 60 * 60 * 24 * 365)
);

const birthDate = new Date('2006-01-25');
const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365));

const neofetch = `$ neofetch --dev
╭───────────────────────────╮
│    ███╗   ███╗████████╗   │
│    ████╗ ████║╚══██╔══╝   │
│    ██╔████╔██║   ██║      │
│    ██║╚██╔╝██║   ██║      │
│    ██║ ╚═╝ ██║   ██║      │
│    ╚═╝     ╚═╝   ╚═╝      │
╰───────────────────────────╯
  Age: ${age}
  Location: Odesa, Ukraine
  Languages: Ukrainian (native), English (B2)
  Stack: Node.js · TypeScript · AWS
  Passionate: true`;

export default function Hero() {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [showOS, setShowOS] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => setTerminalOpen(true), 500);
    return () => clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    if (!terminalOpen) return;

    let index = 0;
    const typeTimer = setInterval(() => {
      if (index < neofetch.length) {
        setDisplayedText(neofetch.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeTimer);
        setTimeout(() => setShowCursor(false), 1000);
      }
    }, 8);

    return () => clearInterval(typeTimer);
  }, [terminalOpen]);

  return (
    <section
      id='about'
      className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden'
    >
      <div className='pointer-events-none absolute inset-0 z-0'>
        <Aurora
          colorStops={['#3b0764', '#7c3aed', '#2563eb']}
          amplitude={1}
          blend={0.6}
          speed={0.4}
        />
      </div>

      <div className='pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/80 via-background/40 to-background' />

      <div className='relative z-10 flex w-full max-w-6xl flex-col items-center px-4 pb-20 pt-24 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:pb-0 lg:pt-0'>
        <div className='flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left'>
          <div className='mb-8 flex items-center gap-4'>
            <div className='relative'>
              <div className='absolute -inset-2 rounded-full bg-gradient-to-r from-violet-600/40 to-blue-600/40 blur-xl' />
              <img
                src='/avatar.webp'
                alt='avatar'
                className='relative h-20 w-20 rounded-full border-2 border-violet-500/30 md:h-24 md:w-24'
              />
              <div className='absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-violet-500/50 bg-background text-xs'>
                🤖
              </div>
            </div>
            <div className='flex flex-col items-start gap-0.5'>
              <DecryptedText
                text={profile.name}
                className='text-lg font-semibold text-foreground md:text-xl'
                animateOn='view'
                speed={30}
                sequential
                revealDirection='start'
                characters='01'
              />
              <ShinyText
                text={`${yearsExp}+ years · Backend & AI`}
                className='font-mono text-sm text-violet-400'
                speed={3}
              />
            </div>
          </div>

          <h1 className='mb-7 text-4xl font-semibold leading-[1.1] tracking-tight [word-spacing:0.12em] md:text-5xl lg:text-6xl'>
            <SplitText
              text='I architect systems'
              className='text-foreground'
              tag='span'
              textAlign='inherit'
              delay={25}
              duration={0.5}
              ease='power2.out'
              splitType='chars'
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin='-20px'
            />
            <span className='text-gradient-accent block pb-1'>that scale infinitely.</span>
          </h1>

          <p className='mb-10 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg'>
            {profile.summary}
          </p>

          <div className='flex flex-wrap justify-center gap-3 lg:justify-start'>
            {profile.contacts.map((c) => (
              <a
                key={c.href}
                href={c.href}
                target='_blank'
                rel='noreferrer'
                className='group flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-2.5 text-sm font-medium text-foreground/90 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-[0_0_24px_rgba(139,92,246,0.15)]'
              >
                <FontAwesomeIcon
                  icon={c.icon}
                  className='h-4 w-4 text-violet-400 transition-transform duration-300 group-hover:scale-110'
                />
                {c.label}
              </a>
            ))}
          </div>
        </div>

        <div className='mt-14 hidden lg:block'>
          <div
            className={`relative transition-all duration-700 ease-out ${
              terminalOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-4 scale-95 opacity-0'
            }`}
          >
            <div className='absolute -inset-4 rounded-2xl bg-gradient-to-r from-violet-600/20 to-blue-600/20 blur-2xl' />
            {showOS ? (
              <MacOSDesktop />
            ) : (
              <div className='relative overflow-hidden rounded-xl border border-violet-500/20 bg-black/80 shadow-2xl shadow-violet-500/10'>
                <div className='flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3'>
                  <button
                    onClick={() => setShowOS(true)}
                    className='h-3 w-3 rounded-full bg-red-500/80 transition-transform hover:scale-110 focus:outline-none'
                    aria-label='Close terminal'
                  />
                  <div className='h-3 w-3 rounded-full bg-yellow-500/80' />
                  <div className='h-3 w-3 rounded-full bg-green-500/80' />
                  <span className='ml-2 font-mono text-xs text-muted-foreground'>
                    terminal — zsh
                  </span>
                </div>
                <div className='relative p-4'>
                  <pre className='pointer-events-none select-none font-mono text-xs leading-relaxed text-transparent md:text-sm'>
                    {neofetch}
                  </pre>
                  <pre className='absolute inset-4 font-mono text-xs leading-relaxed text-emerald-400/90 md:text-sm'>
                    {displayedText}
                    {showCursor && terminalOpen && <span className='animate-pulse'>▊</span>}
                  </pre>
                </div>
                <div className='border-t border-white/10 bg-white/5 px-4 py-2'>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 animate-pulse rounded-full bg-emerald-500' />
                    <span className='font-mono text-xs text-emerald-400'>System online</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}
