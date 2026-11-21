import type { NormalizedAsnData } from '@/lib/asn-rdap';

import { ResultHeader } from '@/components/results/result-header';
import {
  ContactsSection,
  countryName,
  dateField,
  FactGrid,
  finish,
  NoticesSection,
  StatusList,
} from '@/components/results/shared';
import { Fields, Pill, Section } from '@/components/ui';

function sentence(d: NormalizedAsnData): string {
  const holder = d.organization ?? d.name;
  const country = countryName(d.country);
  const where = country ? ` in ${country}` : '';
  if (holder) return finish(`AS${d.asn} is run by ${holder}${where}`);
  return finish(`AS${d.asn} is a registered autonomous system${where}`);
}

export function AsnResult({
  data,
  source,
}: {
  data: NormalizedAsnData;
  source: string;
}) {
  const { start, end } = data.range;
  return (
    <div className='grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start'>
      <ResultHeader
        source={source}
        sentence={sentence(data)}
        pills={
          <>
            <Pill tone='accent'>Autonomous system</Pill>
            {data.name && <Pill>{data.name}</Pill>}
            {data.status?.includes('active') && <Pill tone='ok'>Active</Pill>}
          </>
        }
        data={data}
        rdapUrl={data.rdapUrl}
      />
      <div className='min-w-0 space-y-12'>
        <FactGrid>
          <Section title='Network'>
            <Fields
              items={[
                ['Name', data.name, { mono: true }],
                ['Handle', data.handle, { mono: true }],
                [
                  'Delegated block',
                  start !== end ? `AS${start}–AS${end}` : undefined,
                  { mono: true },
                ],
                ['Type', data.type],
              ]}
            />
          </Section>
          <Section title='Holder'>
            <Fields
              items={[
                ['Organization', data.organization],
                ['Registrar', data.registrar],
                ['Country', countryName(data.country)],
              ]}
            />
          </Section>
          <Section title='Dates'>
            <Fields
              items={[
                ['Registered', dateField(data.registrationDate)],
                ['Last changed', dateField(data.lastChanged)],
              ]}
            />
          </Section>
        </FactGrid>
        <Section title='Status codes'>
          <StatusList
            statuses={(data.status ?? []).map((label) => ({ label }))}
          />
        </Section>
        <ContactsSection entities={data.entities} />
        <NoticesSection remarks={data.remarks} />
      </div>
    </div>
  );
}
