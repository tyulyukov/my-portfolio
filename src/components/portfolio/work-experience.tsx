import { profile } from '@/data/profile';

const logoBackgrounds: Record<string, string> = {
  '/lab325.png': 'bg-white p-1',
  '/sda.svg': 'bg-black p-1'
};

export default function WorkExperience() {
  return (
    <section id='work-exp' className='border-y border-border bg-card/40'>
      <div className='mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24'>
        <div className='mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end'>
          <h2 className='text-4xl font-semibold tracking-tight md:text-5xl'>Where I've worked.</h2>
        </div>
        <div>
          {profile.experience.map((job) => (
            <article
              key={job.company}
              className='grid gap-5 border-t border-border py-8 md:grid-cols-[280px_1fr] md:gap-12'
            >
              <header className='flex items-start gap-4'>
                <img
                  src={job.logo}
                  alt=''
                  loading='lazy'
                  className={`h-11 w-11 shrink-0 rounded-lg border border-border object-contain ${logoBackgrounds[job.logo] ?? ''}`}
                />
                <div>
                  <h3 className='text-lg font-semibold'>{job.company}</h3>
                  <p className='mt-1 text-sm text-muted-foreground'>{job.role}</p>
                  <p className='mt-2 font-mono text-xs text-muted-foreground'>{job.period}</p>
                </div>
              </header>
              <p className='text-base leading-relaxed text-muted-foreground [&_b]:font-medium [&_b]:text-foreground'>
                {job.blurb}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
