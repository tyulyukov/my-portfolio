import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { profile } from '@/data/profile';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className='relative border-t border-violet-500/10 pb-28 md:pb-8'>
      <div className='mx-auto max-w-6xl px-4 py-12'>
        <div className='flex flex-col items-center justify-between gap-8 md:flex-row'>
          <div className='flex flex-col items-center gap-2 md:items-start'>
            <div className='flex items-center gap-2 font-mono text-sm'>
              <span className='text-violet-400'>const</span>
              <span className='text-foreground'>developer</span>
              <span className='text-white'>=</span>
              <span className='text-amber-300'>"{profile.name}"</span>;
            </div>
            <p className='text-sm text-muted-foreground'>Backend Engineer & AI Enthusiast</p>
          </div>

          <div className='flex items-center gap-4'>
            {profile.contacts.map((c) => (
              <a
                key={c.href}
                href={c.href}
                target='_blank'
                rel='noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/5 text-muted-foreground transition-all duration-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-400'
              >
                <FontAwesomeIcon icon={c.icon} className='h-4 w-4' />
              </a>
            ))}
          </div>
        </div>

        <div className='mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row'>
          <p className='font-mono text-xs text-muted-foreground'>
            <span className='text-violet-400'>&copy;</span> {year} · {profile.name}
          </p>

          <div className='flex items-center gap-2 font-mono text-xs text-muted-foreground'>
            <div className='h-2 w-2 animate-pulse rounded-full bg-emerald-500' />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
