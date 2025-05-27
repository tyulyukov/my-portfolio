import React from 'react';

import { profile } from '@/data/profile';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className='flex h-10 w-full items-center justify-center border-t border-border py-2 text-sm'>
      by &nbsp; {profile.name} &nbsp; {year}
    </footer>
  );
}
