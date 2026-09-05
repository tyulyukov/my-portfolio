import React, { useEffect, useState } from 'react';

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

export default function TerminalApp() {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(neofetch);
      setShowCursor(false);
      return;
    }
    let index = 0;
    let cursorTimer: ReturnType<typeof setTimeout> | undefined;
    const typeTimer = setInterval(() => {
      setDisplayedText(neofetch.slice(0, ++index));
      if (index >= neofetch.length) {
        clearInterval(typeTimer);
        cursorTimer = setTimeout(() => setShowCursor(false), 1000);
      }
    }, 8);
    return () => {
      clearInterval(typeTimer);
      clearTimeout(cursorTimer);
    };
  }, []);
  return (
    <div className='h-full overflow-auto bg-[#151719] p-4'>
      <pre
        aria-label='Terminal output'
        className='min-w-max font-mono text-xs leading-relaxed text-violet-200 md:text-sm'
      >
        {displayedText}
        {showCursor && (
          <span aria-hidden='true' className='animate-pulse motion-reduce:animate-none'>
            ▊
          </span>
        )}
      </pre>
    </div>
  );
}
