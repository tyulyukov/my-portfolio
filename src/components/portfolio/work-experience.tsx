import React from 'react';

import { GlowCapture } from '@codaworks/react-glow';

import { profile } from '@/data/profile';

import NebulaCard from './nebula-card';

export default function WorkExperience() {
  return (
    <GlowCapture size={400}>
      <section id='work-exp' className='px-4 py-24'>
        <div className='mx-auto max-w-6xl'>
          <h3 className='mb-8 text-center text-2xl font-bold'>work experience</h3>

          <div className='grid gap-10 md:grid-cols-2'>
            {profile.experience.map((job) => (
              <NebulaCard
                key={job.company}
                logo={job.logo}
                company={job.company}
                role={job.role}
                period={job.period}
                blurb={job.blurb}
              />
            ))}
          </div>
        </div>
      </section>
    </GlowCapture>
  );
}
