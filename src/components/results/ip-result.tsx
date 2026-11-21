import type { NormalizedIPData } from '@/lib/ip-rdap';

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

function sentence(d: NormalizedIPData): string {
  const n = d.network;
  const holder = n.organization ?? n.name;
  const country = countryName(n.country);
  const where = country ? `, registered in ${country}` : '';
  if (holder && n.cidr) {
    return finish(
      `${d.ip} belongs to ${holder}, in the ${n.cidr} network${where}`,
    );
  }
  if (holder) return finish(`${d.ip} belongs to ${holder}${where}`);
  if (n.cidr) return finish(`${d.ip} is part of the ${n.cidr} network${where}`);
  return finish(`${d.ip} is a registered ${d.type} address`);
}

export function IpResult({
  data,
  source,
}: {
  data: NormalizedIPData;
  source: string;
}) {
  const n = data.network;
  return (
    <div className='grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start'>
      <ResultHeader
        source={source}
        sentence={sentence(data)}
        pills={
          <>
            <Pill tone='accent'>{data.type}</Pill>
            {n.type && <Pill>{n.type.toLowerCase()}</Pill>}
            {n.status?.includes('active') && <Pill tone='ok'>Active</Pill>}
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
                ['Range', n.cidr, { mono: true }],
                ['Name', n.name, { mono: true }],
                ['Handle', n.handle, { mono: true }],
                ['Allocation', n.type],
              ]}
            />
          </Section>
          <Section title='Holder'>
            <Fields
              items={[
                ['Organization', n.organization],
                ['Registrar', n.registrar],
                ['Country', countryName(n.country)],
              ]}
            />
          </Section>
          <Section title='Dates'>
            <Fields
              items={[
                ['Registered', dateField(n.registrationDate)],
                ['Last changed', dateField(n.lastChanged)],
              ]}
            />
          </Section>
        </FactGrid>
        <Section title='Status codes'>
          <StatusList statuses={(n.status ?? []).map((label) => ({ label }))} />
        </Section>
        <ContactsSection entities={data.entities} />
        <NoticesSection remarks={data.remarks} />
      </div>
    </div>
  );
}
