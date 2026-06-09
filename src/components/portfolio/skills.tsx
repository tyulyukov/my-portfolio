import AnimatedContent from '@/components/AnimatedContent';
import ScrollVelocity from '@/components/ScrollVelocity';
import SpotlightCard from '@/components/SpotlightCard';

const skillCategories = [
  {
    name: 'Backend',
    items: ['Node.js', 'Nest.js', 'TypeScript', 'SocketIO'],
    dotClass: 'bg-emerald-500'
  },
  {
    name: 'Databases',
    items: ['PostgreSQL', 'MongoDB', 'Redis', 'ElasticSearch'],
    dotClass: 'bg-blue-500'
  },
  {
    name: 'ORM & Queues',
    items: ['Prisma', 'TypeORM', 'RabbitMQ', 'BullMQ'],
    dotClass: 'bg-violet-500'
  },
  {
    name: 'Cloud & DevOps',
    items: ['AWS', 'Docker', 'Kubernetes', 'Firebase'],
    dotClass: 'bg-amber-500'
  }
];

const allSkills = [
  'Node.js',
  'Nest.js',
  'TypeScript',
  'PostgreSQL',
  'MongoDB',
  'Prisma',
  'TypeORM',
  'Redis',
  'SocketIO',
  'RabbitMQ',
  'BullMQ',
  'ElasticSearch',
  'Firebase',
  'AWS',
  'Docker',
  'Kubernetes',
  'Git'
];

export default function Skills() {
  return (
    <section id='skills' className='relative overflow-hidden py-24 md:py-32'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[120px]' />
        <div className='absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px]' />
      </div>

      <div className='relative mx-auto max-w-6xl px-4'>
        <AnimatedContent
          distance={40}
          direction='vertical'
          duration={0.8}
          ease='power3.out'
          initialOpacity={0}
          animateOpacity
          threshold={0.2}
        >
          <div className='mb-14 text-center md:mb-16'>
            <p className='mb-4 font-mono text-xs tracking-widest text-violet-400'>
              <span className='text-muted-foreground'>$</span> ls ~/stack
            </p>
            <h2 className='text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl'>
              Tech <span className='text-gradient-accent'>Stack</span>
            </h2>
          </div>
        </AnimatedContent>

        <div className='mb-14 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] md:mb-16'>
          <ScrollVelocity
            texts={[allSkills.join(' · ') + ' ·', [...allSkills].reverse().join(' · ') + ' ·']}
            velocity={40}
            className='text-violet-500/20'
            numCopies={4}
            scrollerClassName='text-3xl md:text-5xl font-semibold tracking-tight font-mono'
          />
        </div>

        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {skillCategories.map((category, catIndex) => (
            <AnimatedContent
              key={category.name}
              distance={50}
              direction='vertical'
              duration={0.8}
              ease='power3.out'
              initialOpacity={0}
              animateOpacity
              threshold={0.2}
              delay={catIndex * 0.1}
            >
              <SpotlightCard
                className='h-full border-violet-500/10 bg-violet-500/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]'
                spotlightColor='rgba(139, 92, 246, 0.15)'
              >
                <div className='mb-4 flex items-center gap-2'>
                  <div className={`h-2 w-2 rounded-full ${category.dotClass}`} />
                  <span className='font-mono text-sm text-muted-foreground'>
                    {category.name.toLowerCase()}/
                  </span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {category.items.map((skill) => (
                    <div
                      key={skill}
                      className='cursor-default rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm text-foreground/80 transition-all duration-300 hover:border-violet-500/50 hover:bg-violet-500/20 hover:text-foreground hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
