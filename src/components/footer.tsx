import { profile } from '@/data/profile';

const email = profile.contacts.find((contact) => contact.label === 'Email');

export default function Footer() {
  return (
    <footer className='border-t border-border'>
      <div className='mx-auto flex max-w-6xl flex-col justify-between gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-end'>
        <div>
          <p className='text-2xl font-semibold tracking-tight'>Got something worth shipping?</p>
          <a
            href={email?.href}
            className='mt-3 inline-block text-violet-400 underline-offset-4 hover:underline'
          >
            {email?.href.replace('mailto:', '')}
          </a>
        </div>
        <p className='text-xs text-muted-foreground'>
          © {new Date().getFullYear()} {profile.name}. Probably building something.
        </p>
      </div>
    </footer>
  );
}
