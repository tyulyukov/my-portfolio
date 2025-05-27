import React from 'react';

import Hero from '@/components/portfolio/hero';
import Skills from '@/components/portfolio/skills';
import WorkExperience from '@/components/portfolio/work-experience';

export default function Home() {
  return (
    <>
      <Hero />
      <WorkExperience />
      <Skills />
    </>
  );
}
