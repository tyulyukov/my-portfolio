import type { ReactNode } from 'react';

import AnimatedContent from '@/components/AnimatedContent';
import SpotlightCard from '@/components/SpotlightCard';
import { profile } from '@/data/profile';

const logoBackgrounds: Record<string, string> = {
  '/lab325.png': 'bg-white p-1',
  '/sda.svg': 'bg-black p-1'
};

interface JobEntryProperties {
  logo: string;
  company: string;
  role: string;
  period: string;
  blurb: ReactNode;
  index: number;
  isCurrentJob: boolean;
}

function JobEntry({ logo, company, role, period, blurb, index, isCurrentJob }: JobEntryProperties) {
  return (
    <AnimatedContent
      distance={50}
      direction='vertical'
      reverse={false}
      duration={0.8}
      ease='power3.out'
      initialOpacity={0}
      animateOpacity
      threshold={0.2}
      delay={index * 0.08}
    >
      <div className='relative flex gap-5 md:gap-8'>
        <div className='relative flex flex-col items-center'>
          <div className='relative z-10 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-500/25 bg-background shadow-[0_0_20px_rgba(139,92,246,0.1)] md:h-14 md:w-14'>
            <img
              src={logo}
              alt={company}
              className={`h-full w-full rounded-lg object-contain ${logoBackgrounds[logo] ?? ''}`}
            />
          </div>
          {isCurrentJob && (
            <span className='absolute -right-1 -top-1 z-20 flex h-3 w-3'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60' />
              <span className='relative inline-flex h-3 w-3 rounded-full bg-emerald-500' />
            </span>
          )}
        </div>

        <SpotlightCard
          className='group mb-8 flex-1 border-violet-500/10 bg-violet-500/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)] md:p-7'
          spotlightColor='rgba(139, 92, 246, 0.15)'
        >
          <header className='mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <h3 className='text-lg font-semibold text-foreground md:text-xl'>{company}</h3>
            <span className='text-sm font-medium text-violet-400'>{role}</span>
            <span className='ml-auto font-mono text-xs text-muted-foreground'>{period}</span>
          </header>

          <p className='text-sm leading-relaxed text-muted-foreground md:text-base'>{blurb}</p>
        </SpotlightCard>
      </div>
    </AnimatedContent>
  );
}

export default function WorkExperience() {
  return (
    <section id='work-exp' className='relative px-4 py-24 md:py-32'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute left-0 top-1/4 h-96 w-96 rounded-full bg-violet-600/5 blur-[100px]' />
        <div className='absolute bottom-1/4 right-0 h-96 w-96 rounded-full bg-blue-600/5 blur-[100px]' />
      </div>

      <div className='relative mx-auto max-w-4xl'>
        <AnimatedContent
          distance={40}
          direction='vertical'
          reverse={false}
          duration={0.8}
          ease='power3.out'
          initialOpacity={0}
          animateOpacity
          threshold={0.2}
        >
          <div className='mb-14 text-center md:mb-20'>
            <p className='mb-4 font-mono text-xs tracking-widest text-violet-400'>
              <span className='text-muted-foreground'>$</span> cat work_history.log
            </p>
            <h2 className='text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl'>
              Production <span className='text-gradient-accent'>Experience</span>
            </h2>
            <p className='mx-auto mt-4 max-w-xl text-muted-foreground'>
              Building high-load distributed systems and mentoring teams across multiple startups.
            </p>
          </div>
        </AnimatedContent>

        <div className='relative'>
          <div className='pointer-events-none absolute bottom-8 left-6 top-2 w-px bg-gradient-to-b from-violet-500/30 via-violet-500/10 to-transparent md:left-7' />
          {profile.experience.map((job, index) => (
            <JobEntry key={job.company} {...job} index={index} isCurrentJob={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
