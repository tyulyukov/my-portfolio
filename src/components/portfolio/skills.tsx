const toolkit = [
  {
    name: 'AI is part of the job.',
    description:
      'I build and tune agent workflows for the work I do every day. I use them to ship faster and catch mistakes earlier.',
    tools: 'AI agents · LLMs · Workflow automation'
  },
  {
    name: 'I own what ships.',
    description:
      'I own the decisions, review the code, and test what ships. TypeScript and Node.js are where I do most of that work.',
    tools: 'TypeScript · Node.js · NestJS · PostgreSQL · Redis'
  },
  {
    name: 'Fullest Full-Stack ever.',
    description: 'I build the UI and backend, handle the deploy, and fix what production finds.',
    tools: 'AWS · Docker · Kubernetes · CI/CD'
  }
];

export default function Skills() {
  return (
    <section id='skills' className='mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24'>
      <h2 className='max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl'>How I work.</h2>
      <div className='mt-12 grid gap-10 md:grid-cols-3 md:gap-8'>
        {toolkit.map((item) => (
          <article key={item.name} className='min-w-0'>
            <h3 className='text-xl font-semibold'>{item.name}</h3>
            <p className='mt-4 text-sm leading-relaxed text-muted-foreground'>{item.description}</p>
            <p className='mt-6 font-mono text-xs leading-loose text-violet-400'>{item.tools}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
