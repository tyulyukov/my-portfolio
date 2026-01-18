import type { DockItemData } from '@/components/Dock';

import { Briefcase, Code2, ExternalLink, FileText, User } from 'lucide-react';

import Dock from '@/components/Dock';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const navItems: DockItemData[] = [
  {
    icon: <User className='h-5 w-5 text-white/80' />,
    label: 'About',
    onClick: () => scrollToSection('about')
  },
  {
    icon: <Briefcase className='h-5 w-5 text-white/80' />,
    label: 'Experience',
    onClick: () => scrollToSection('work-exp')
  },
  {
    icon: <Code2 className='h-5 w-5 text-white/80' />,
    label: 'Skills',
    onClick: () => scrollToSection('skills')
  },
  {
    icon: (
      <div className='relative'>
        <FileText className='h-5 w-5 text-white/80' />
        <ExternalLink className='absolute -right-1 -top-1 h-2.5 w-2.5 text-violet-400' />
      </div>
    ),
    label: 'CV',
    onClick: () => window.open('https://cdn.tyulyukov.com/cv.pdf', '_blank')
  }
];

export default function Navbar() {
  return (
    <nav className='fixed inset-x-0 bottom-0 z-50 flex items-end justify-center pb-6'>
      <Dock
        items={navItems}
        baseItemSize={48}
        magnification={64}
        distance={120}
        panelHeight={56}
        className='border-white/10 bg-black/80 backdrop-blur-xl'
        spring={{ mass: 0.1, stiffness: 200, damping: 15 }}
      />
    </nav>
  );
}
