import { Suspense } from 'react';

import { HomeSections } from '@/components/home-sections';
import { Lookup } from '@/components/lookup';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default function Home() {
  return (
    <div className='flex min-h-dvh flex-col'>
      <SiteHeader active='lookup' />
      <main id='main' className='flex-1'>
        <Suspense fallback={<div className='bg-grid h-[60svh]' />}>
          <Lookup>
            <HomeSections />
          </Lookup>
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
