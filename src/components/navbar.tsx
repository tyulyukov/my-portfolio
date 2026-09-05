import { FileText } from 'lucide-react';

export default function Navbar() {
  return (
    <header className='fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl'>
      <nav
        aria-label='Main navigation'
        className='mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8'
      >
        <a
          href='#about'
          aria-label='Maksym Tyulyukov, home'
          className='font-display text-xl font-semibold tracking-tight'
        >
          mt<span className='text-violet-400'>.</span>
        </a>
        <div className='flex items-center gap-1 text-sm sm:gap-5'>
          <a
            href='#about'
            className='rounded-md px-2 py-3 text-muted-foreground hover:text-foreground'
          >
            About
          </a>
          <a
            href='#work-exp'
            className='rounded-md px-2 py-3 text-muted-foreground hover:text-foreground'
          >
            Work
          </a>
          <a
            href='#skills'
            className='rounded-md px-2 py-3 text-muted-foreground hover:text-foreground'
          >
            Toolkit
          </a>
          <a
            href='https://cdn.tyulyukov.com/cv.pdf'
            target='_blank'
            rel='noreferrer'
            className='ml-1 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-3 py-2.5 font-semibold text-white hover:bg-violet-600 sm:px-4'
          >
            <FileText aria-hidden='true' className='h-4 w-4' />
            <span>
              CV<span className='hidden sm:inline'> / résumé</span>
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
}
