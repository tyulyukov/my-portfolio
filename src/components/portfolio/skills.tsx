const toolkit = [
  {
    name: 'AI is part of the job.',
    description:
      'I build agent workflows and keep experimenting with LLMs. The point is better work in production, not a bigger pile of generated code.',
    tools: 'AI agents · LLMs · Workflow automation'
  },
  {
    name: 'Still an engineer.',
    description:
      'I own the decisions, review the code, and test what ships. TypeScript and Node.js are where I do most of that work.',
    tools: 'TypeScript · Node.js · NestJS · PostgreSQL · Redis'
  },
  {
    name: 'All the way to live.',
    description:
      'Building it is part of the job. I also handle the deploy, see how it behaves, and fix what the real world finds.',
    tools: 'AWS · Docker · Kubernetes · CI/CD'
  }
];

export default function Skills() {
  return (
    <section id='skills' className='mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28'>
      <p className='mb-4 font-mono text-xs text-violet-400'>02 / How I work</p>
      <h2 className='max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl'>
        More output. More care.
      </h2>
      <p className='mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground'>
        I use AI to move faster and spend more time on the decisions that need me.
      </p>
      <div className='mt-12 grid gap-10 md:grid-cols-3 md:gap-8'>
        {toolkit.map((item) => (
          <article key={item.name} className='border-t border-border pt-6'>
            <h3 className='text-xl font-semibold'>{item.name}</h3>
            <p className='mt-4 text-sm leading-relaxed text-muted-foreground'>{item.description}</p>
            <p className='mt-6 font-mono text-xs leading-loose text-violet-400'>{item.tools}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
