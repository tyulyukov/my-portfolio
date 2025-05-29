import React from 'react';

import { GlowCapture } from '@codaworks/react-glow';

import { profile } from '@/data/profile';
import { useDesktop } from '@/hooks/use-desktop';

import NebulaCard from './nebula-card';

export default function WorkExperience() {
  const desktop = useDesktop();

  const body = (
    <section id='work-exp' className='px-4 py-24'>
      <div className='mx-auto max-w-6xl'>
        <h3 className='mb-8 text-center text-2xl font-bold'>work experience</h3>

        <div className='grid gap-10 md:grid-cols-2'>
          {profile.experience.map((job) => (
            <NebulaCard key={job.company} {...job} glow={desktop} />
          ))}
        </div>
      </div>
    </section>
  );

  return desktop ? <GlowCapture size={400}>{body}</GlowCapture> : body;
}
