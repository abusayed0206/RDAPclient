import Link from 'next/link';

import { cn } from '@/lib/utils';

import { ThemeToggle } from '@/components/theme-toggle';

import { siteConfig } from '@/constant/config';

const navItem = 'rounded-full px-3 py-1.5 transition-colors';

export function SiteHeader({ active }: { active: 'lookup' | 'api' }) {
  const link = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? 'page' : undefined}
      className={cn(
        navItem,
        on ? 'bg-sunk text-ink' : 'text-ink-2 hover:text-ink',
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className='border-line bg-paper/80 sticky top-0 z-40 border-b backdrop-blur-md'>
      <div className='mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6'>
        <Link
          href='/'
          className='text-ink flex items-center gap-2 font-mono text-sm'
        >
          <span aria-hidden className='bg-signal size-2 rounded-full' />
          rdap.sayed.app
        </Link>
        <nav aria-label='Main' className='flex items-center gap-1 text-sm'>
          {link('/', 'Lookup', active === 'lookup')}
          {link('/api', 'API', active === 'api')}
        </nav>
        <div className='ml-auto flex items-center gap-1 text-sm'>
          <a
            href={siteConfig.repo}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              navItem,
              'text-ink-2 hover:bg-sunk hover:text-ink max-sm:hidden',
            )}
          >
            GitHub ↗
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

const footerLinks = [
  { href: '/api', label: 'API docs', internal: true },
  { href: siteConfig.repo, label: 'Source on GitHub' },
  { href: 'https://www.icann.org/rdap', label: 'About RDAP' },
  { href: 'https://sayed.app', label: 'More projects' },
];

export function SiteFooter() {
  return (
    <footer className='border-line mt-24 border-t'>
      <div className='mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr]'>
        <div>
          <p className='font-display text-ink text-3xl leading-tight'>
            Found a wrong record, or want
            <br />
            another lookup type?
          </p>
          <a
            href={`${siteConfig.repo}/issues`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-accent link-underline mt-4 inline-block font-mono text-sm'
          >
            Open an issue on GitHub
          </a>
        </div>
        <div>
          <p className='text-ink-2 mb-3 font-mono text-[11px] tracking-wider uppercase'>
            Links
          </p>
          <ul className='space-y-2 text-sm'>
            {footerLinks.map((l) => (
              <li key={l.href}>
                {l.internal ? (
                  <Link href={l.href} className='hover:text-ink text-ink-2'>
                    {l.label}
                  </Link>
                ) : (
                  <a href={l.href} className='hover:text-ink text-ink-2'>
                    {l.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className='border-line text-ink-2 mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t px-4 py-6 font-mono text-xs sm:px-6'>
        <span>Open source, MIT licensed. No ads, no tracking.</span>
        <span>Built with Next.js · served via Vercel</span>
      </div>
    </footer>
  );
}
