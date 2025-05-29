import { useEffect, useState } from 'react';

export function useDesktop(breakpoint = '(min-width: 768px)') {
  const [desktop, setDesktop] = useState(() => matchMedia(breakpoint).matches);

  useEffect(() => {
    const media = matchMedia(breakpoint);
    const handler = () => setDesktop(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [breakpoint]);

  return desktop;
}
