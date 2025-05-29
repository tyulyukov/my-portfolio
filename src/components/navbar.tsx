import React, { useEffect, useState } from 'react';

import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import Logo from './logo';
import BurgerIcon from './ui/burger-icon';
import ThemeToggle from './ui/theme-toggle';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  useEffect(() => {
    const md = 768;
    const onResize = () => {
      if (window.innerWidth >= md) setOpen(false);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <a href='#about' className='nav-link' onClick={onClick}>
        about
      </a>
      <a href='#work-exp' className='nav-link' onClick={onClick}>
        work experience
      </a>
      <a href='#skills' className='nav-link' onClick={onClick}>
        skills
      </a>
      <a
        href='https://cdn.tyulyukov.com/cv.pdf'
        target='_blank'
        rel='noreferrer'
        className='nav-link inline-flex items-center gap-1'
        onClick={onClick}
      >
        cv <ExternalLink className='h-[0.9rem] w-[0.9rem] opacity-70' />
      </a>
    </>
  );

  return (
    <>
      <header className='fixed top-0 z-30 flex h-16 w-full items-center justify-between bg-background/80 px-5 py-1 backdrop-blur-md'>
        <Link to='/' className='text-primary'>
          <Logo className='h-9 w-auto p-2' />
        </Link>

        <nav className='hidden gap-8 text-sm font-medium md:flex'>
          <NavLinks />
        </nav>

        <div className='flex items-center gap-4'>
          <ThemeToggle />
          <button
            aria-label={open ? 'close menu' : 'open menu'}
            onClick={() => setOpen((o) => !o)}
            className='rounded p-2 text-foreground/80 transition-colors hover:text-primary md:hidden'
          >
            <BurgerIcon open={open} />
          </button>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-20 flex flex-col items-center justify-center gap-12',
          'bg-background/90 backdrop-blur-lg transition-transform duration-500',
          open ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <nav className='flex flex-col items-center gap-8 text-3xl font-extrabold'>
          <NavLinks onClick={() => setOpen(false)} />
        </nav>
      </div>
    </>
  );
}
