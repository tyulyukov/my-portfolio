import React from 'react';

import { Link } from 'react-router-dom';

import Logo from './logo';
import ThemeToggle from './ui/theme-toggle';

export default function Navbar() {
  return (
    <header className='fixed top-0 z-30 flex h-16 w-full items-center justify-between bg-background/80 px-5 py-1 backdrop-blur-md'>
      {/* brand icon */}
      <Link to='/' className='text-primary'>
        <Logo className='h-9 w-auto p-2' />
      </Link>

      {/* nav links */}
      <nav className='hidden gap-8 text-sm font-medium md:flex'>
        <a href='#about' className='transition-colors duration-200 hover:text-primary'>
          about
        </a>
        <a href='#work-exp' className='transition-colors duration-200 hover:text-primary'>
          work experience
        </a>
        <a href='#skills' className='transition-colors duration-200 hover:text-primary'>
          skills
        </a>
        <a
          href='https://cv.tyulyukov.com'
          className='transition-colors duration-200 hover:text-primary'
        >
          cv
        </a>
      </nav>

      <ThemeToggle />
    </header>
  );
}
