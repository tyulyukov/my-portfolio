import { faGithub, faLinkedin, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

export const profile = {
  name: 'Maksym Tyulyukov',
  // title: 'software engineer',
  // tagline: 'backend developer (node.js) — 3 yrs exp.',
  summary:
    'Passionate about clean architecture & high-load distributed systems... Ha-ha, did you believe in this non-sense? i love playing 8-pool 🎱 while listening to an american rap 🇺🇸🦅 after hitting some gym 💪🏻️. Beat it!',
  // currentCompany: 'SDA',
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
      logo: '/sda.svg',
      company: 'SDA',
      role: 'Node.js Developer',
      period: 'Nov 2024 — present',
      blurb: (
        <>
          Re-architected a legacy monolith into event-driven micro-services on AWS (EKS + SQS +
          Lambda) and introduced cost-aware autoscaling that cut the monthly cloud bill by{' '}
          <b>≈ 50 %</b>. Owned application & DB design, integrated payments (Stripe, NMI, App Store,
          Google Play), applied the Outbox pattern for reliable messaging and mentored four devs
          through code-reviews & onboarding.
        </>
      )
    },
    {
      logo: '/cowchain.png',
      company: 'Cowchain',
      role: 'Node.js Developer',
      period: 'Aug 2024 — Nov 2024',
      blurb: (
        <>
          Built high-throughput REST & WebSocket APIs for Web3 games serving <b>40 M+ users</b>.
          Refactored a crypto-pools service, slashing first-load from <b>30 s → 750 ms</b>;
          implemented Redis-driven matchmaking, subgraph + smart-contract integrations, and a voting
          / betting engine for a 1M MAU tap-to-earn title.
        </>
      )
    },
    {
      logo: '/lab325.png',
      company: 'LAB325',
      role: 'Node.js Developer',
      period: 'Apr 2023 — Aug 2024',
      blurb: (
        <>
          Delivered GraphQL APIs for AI & healthcare, covering schema & index design, queues,
          web-sockets and E2E tests. Led multi-gateway payment integration for an AI psychologist
          platform and migrated the whole codebase from JavaScript to <b>strict TypeScript</b>,
          boosting stability and dev velocity.
        </>
      )
    },
    {
      logo: '/gribble.svg',
      company: 'Gribble',
      role: 'Full-stack Developer',
      period: 'Aug 2022 — Mar 2023',
      blurb: (
        <>
          Bootstrapped an ed-tech MVP in 10 weeks: Node.js & .NET micro-services, Vue front-end and
          AWS / Netlify infra. Defined requirements, led a 6-person team with CI/CD & code-reviews,
          managed cloud deployment and pitched the product to potential investors—gaining deep
          experience in leadership and cloud ops.
        </>
      )
    }
  ],
  skills: [
    'Node.js',
    'Nest.js',
    'TypeScript',
    'PostgreSQL',
    'Redis',
    'Docker',
    'AWS',
    'RabbitMQ',
    'MongoDB'
  ]
} as const;
