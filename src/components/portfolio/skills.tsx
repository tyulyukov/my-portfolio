import React from 'react';

import {
  faAws,
  faDocker,
  faJs,
  faNodeJs,
  IconDefinition
} from '@fortawesome/free-brands-svg-icons';
import { faDatabase, faServer } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { profile } from '@/data/profile';

import Orbit from './orbit';

const iconMap: Record<string, IconDefinition> = {
  'Node.js': faNodeJs,
  AWS: faAws,
  Docker: faDocker,
  TypeScript: faJs,
  'Nest.js': faServer,
  PostgreSQL: faDatabase,
  Redis: faDatabase,
  RabbitMQ: faDatabase,
  MongoDB: faDatabase
};

export default function Skills() {
  return (
    <section id='skills' className='py-24'>
      <div className='container mx-auto px-4 text-center'>
        <h3 className='mb-8 text-2xl font-bold'>i’ve worked with these fellas</h3>

        {/* icon cloud */}
        <div className='mx-auto flex max-w-4xl flex-wrap justify-center gap-6'>
          {profile.skills.map((skill) => (
            <div key={skill} className='flex flex-col items-center gap-2' title={skill}>
              <span className='flex h-16 w-16 items-center justify-center rounded-full bg-[#763CAC]/30 backdrop-blur-md'>
                <FontAwesomeIcon icon={iconMap[skill]} size='lg' />
              </span>
              <span className='text-xs'>{skill}</span>
            </div>
          ))}
        </div>

        <Orbit />
      </div>
    </section>
  );
}
