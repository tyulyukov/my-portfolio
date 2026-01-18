import { useEffect, useState } from 'react';

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
  }, []);

  return (
    <div className='relative h-full bg-black/50 p-4'>
      <pre className='pointer-events-none select-none font-mono text-xs leading-relaxed text-transparent md:text-sm'>
        {neofetch}
      </pre>
      <pre className='absolute inset-4 font-mono text-xs leading-relaxed text-emerald-400/90 md:text-sm'>
        {displayedText}
        {showCursor && <span className='animate-pulse'>▊</span>}
      </pre>
    </div>
  );
}
