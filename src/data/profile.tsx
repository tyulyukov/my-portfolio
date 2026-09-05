import { faGithub, faLinkedin, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

export const profile = {
  name: 'Maksym Tyulyukov',
  summary:
    'I build with AI every day. My agent workflows help me deliver faster and raise the quality of what ships. Then I keep pushing them further.',
  contacts: [
    {
      label: 'Email',
      href: 'mailto:makstyulyukov@gmail.com',
      color: '#D44638', // Gmail color
      icon: faEnvelope
    },
    {
      label: 'Telegram',
      href: 'https://t.me/tyulyukov',
      color: '#24A1DE',
      icon: faTelegram
    },
    {
      label: 'GitHub',
      href: 'https://github.com/tyulyukov',
      color: '#171515',
      icon: faGithub
    },
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/tyulyukov',
      color: '#0A66C2',
      icon: faLinkedin
    }
  ],
  experience: [
    {
      logo: '/obrio.svg',
      company: 'OBRIO',
      role: 'Back-End Engineer',
      period: 'Aug 2025 to present',
      blurb: (
        <>
          Building marketing automation at <b>OBRIO</b> for Nebula. I work on the tools behind user
          acquisition and campaigns, and use AI to push delivery further.
        </>
      )
    },
    {
      logo: '/sda.svg',
      company: 'SDA',
      role: 'Node.js Developer',
      period: 'Nov 2024 to Jul 2025',
      blurb: (
        <>
          Cut the monthly AWS bill by <b>about 50%</b>. Owned application and database design,
          shipped payments across four providers, and helped four developers get up to speed.
        </>
      )
    },
    {
      logo: '/cowchain.png',
      company: 'Cowchain',
      role: 'Node.js Developer',
      period: 'Aug 2024 to Nov 2024',
      blurb: (
        <>
          Built APIs for Web3 games serving <b>40M+ users</b>. Took one service&apos;s first load
          from <b>30 seconds to 750 milliseconds</b> and shipped matchmaking and voting systems.
        </>
      )
    },
    {
      logo: '/lab325.png',
      company: 'LAB325',
      role: 'Node.js Developer',
      period: 'Apr 2023 to Aug 2024',
      blurb: (
        <>
          Built APIs for AI and healthcare products. Led payment integrations for an AI psychologist
          platform and moved its JavaScript codebase to <b>strict TypeScript</b>.
        </>
      )
    },
    {
      logo: '/gribble.svg',
      company: 'Gribble',
      role: 'Full-stack Developer',
      period: 'Aug 2022 to Mar 2023',
      blurb: (
        <>
          Led a six-person team and launched an edtech MVP in <b>10 weeks</b>. Took it from
          requirements to deployment, then pitched it to potential investors.
        </>
      )
    }
  ],
  skills: [
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
  ]
} as const;
