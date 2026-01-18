import type { ReactNode } from 'react';

import AnimatedContent from '@/components/AnimatedContent';
import SpotlightCard from '@/components/SpotlightCard';
import { profile } from '@/data/profile';

interface JobCardProperties {
  logo: string;
  company: string;
  role: string;
  period: string;
  blurb: ReactNode;
  index: number;
  isCurrentJob: boolean;
}

function JobCard({ logo, company, role, period, blurb, index, isCurrentJob }: JobCardProperties) {
  return (
    <AnimatedContent
      distance={60}
      direction='vertical'
      reverse={false}
      duration={0.8}
      ease='power3.out'
      initialOpacity={0}
      animateOpacity
      scale={0.95}
      threshold={0.2}
      delay={index * 0.1}
    >
      <SpotlightCard
        className='group h-full border-violet-500/10 bg-violet-500/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)] md:p-8'
        spotlightColor='rgba(139, 92, 246, 0.15)'
      >
        <div className='flex h-full flex-col'>
          <header className='mb-5 flex items-start gap-4'>
            <div className='relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-500/20 bg-black/50 p-2 transition-all duration-300 group-hover:border-violet-500/40 md:h-16 md:w-16'>
              <img
                src={logo}
                alt={company}
                className='h-full w-full object-contain'
                style={{
                  background: logo.includes('lab325')
                    ? 'white'
                    : logo.includes('sda')
                      ? 'black'
                      : 'transparent',
                  borderRadius: '0.5rem',
                  padding: logo.includes('lab325') || logo.includes('sda') ? '0.25rem' : '0'
                }}
              />
            </div>

            <div className='flex flex-col'>
              <div className='flex items-center gap-2'>
                <h3 className='text-lg font-bold text-foreground md:text-xl'>{company}</h3>
              </div>
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <span className='font-medium text-violet-400'>{role}</span>
                <span className='text-violet-500/30'>|</span>
                <span className='font-mono text-xs text-muted-foreground'>{period}</span>
              </div>
            </div>
          </header>

          <div className='mb-4 h-px w-full bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent' />

          <p className='flex-1 text-sm leading-relaxed text-muted-foreground md:text-base'>
            {blurb}
          </p>

          {isCurrentJob && (
            <div className='mt-4 flex items-center gap-2'>
              <div className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500' />
              <span className='font-mono text-xs text-emerald-500/80'>active</span>
            </div>
          )}
        </div>
      </SpotlightCard>
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

      <div className='relative mx-auto max-w-6xl'>
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
          <div className='mb-12 text-center md:mb-16'>
            <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5'>
              <span className='h-2 w-2 animate-pulse rounded-full bg-violet-500' />
              <span className='font-mono text-xs uppercase tracking-widest text-violet-400'>
                work_history.log
              </span>
            </div>
            <h2 className='text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl'>
              Production{' '}
              <span className='bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent'>
                Experience
              </span>
            </h2>
            <p className='mx-auto mt-4 max-w-xl text-muted-foreground'>
              Building high-load distributed systems and mentoring teams across multiple startups.
            </p>
          </div>
        </AnimatedContent>

        <div className='grid gap-6 md:grid-cols-2'>
          {profile.experience.map((job, index) => (
            <JobCard key={job.company} {...job} index={index} isCurrentJob={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
