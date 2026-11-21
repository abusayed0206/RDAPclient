import type { NormalizedRdapData } from '@/lib/rdap';

import { ResultHeader } from '@/components/results/result-header';
import {
  ContactsSection,
  dateField,
  daysFromNow,
  FactGrid,
  finish,
  formatDate,
  NoticesSection,
  relative,
  StatusList,
} from '@/components/results/shared';
import { ExternalLink, Fields, MailLink, Pill, Section } from '@/components/ui';

function sentence(d: NormalizedRdapData): string {
  const registrar = d.registrar !== 'N/A' ? d.registrar : undefined;
  const expires = formatDate(d.expiresOn);
  const days = daysFromNow(d.expiresOn);
  if (expires && days !== null && days < 0) {
    return finish(`${d.domainName} expired on ${expires}`);
  }
  if (registrar && expires) {
    return finish(
      `${d.domainName} is registered with ${registrar} until ${expires}`,
    );
  }
  if (registrar)
    return finish(`${d.domainName} is registered with ${registrar}`);
  if (expires) return finish(`${d.domainName} is registered until ${expires}`);
  return finish(`${d.domainName} is registered`);
}

function Pills({ d }: { d: NormalizedRdapData }) {
  const days = daysFromNow(d.expiresOn);
  const locked = d.statuses.some((s) => /transfer prohibited/i.test(s.label));
  return (
    <>
      {days !== null &&
        (days < 0 ? (
          <Pill tone='danger'>Expired {relative(days)}</Pill>
        ) : days <= 30 ? (
          <Pill tone='warn'>Expires {relative(days)}</Pill>
        ) : (
          <Pill tone='accent'>Expires {relative(days)}</Pill>
        ))}
      {locked && <Pill>Locked against transfer</Pill>}
      {d.dnssec === 'Signed' && <Pill tone='ok'>DNSSEC signed</Pill>}
      {d.dnssec === 'Unsigned' && <Pill>DNSSEC not signed</Pill>}
    </>
  );
}

export function DomainResult({
  data,
  source,
}: {
  data: NormalizedRdapData;
  source: string;
}) {
  return (
    <div className='grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start'>
      <ResultHeader
        source={source}
        sentence={sentence(data)}
        pills={<Pills d={data} />}
        data={data}
        rdapUrl={data.rdapUrl}
      />
      <div className='min-w-0 space-y-12'>
        <FactGrid>
          <Section title='Dates'>
            <Fields
              items={[
                ['Registered', dateField(data.registeredOn)],
                ['Expires', dateField(data.expiresOn)],
                ['Last updated', dateField(data.lastUpdated)],
                ['Last transferred', dateField(data.lastTransferred)],
              ]}
            />
          </Section>
          <Section title='Registrar'>
            <Fields
              items={[
                ['Name', data.registrar],
                ['IANA ID', data.registrarIanaId],
                [
                  'Website',
                  data.registrarUrl && (
                    <ExternalLink href={data.registrarUrl}>
                      {data.registrarUrl
                        .replace(/^https?:\/\//, '')
                        .replace(/\/$/, '')}
                    </ExternalLink>
                  ),
                ],
                [
                  'Report abuse',
                  data.registrarAbuseEmail && (
                    <MailLink email={data.registrarAbuseEmail} />
                  ),
                ],
                ['Abuse phone', data.registrarAbusePhone],
              ]}
            />
          </Section>
          <Section title='Nameservers'>
            {data.nameservers.length ? (
              <ul className='divide-line divide-y font-mono text-[0.875rem]'>
                {data.nameservers.map((ns) => (
                  <li key={ns} className='py-2 break-all first:pt-0 last:pb-0'>
                    {ns}
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-ink-2 text-[0.9375rem]'>
                No nameservers are delegated.
              </p>
            )}
          </Section>
        </FactGrid>
        <Section title='Status codes'>
          <StatusList statuses={data.statuses} />
        </Section>
        <ContactsSection entities={data.entities} />
        <NoticesSection remarks={data.remarks} />
      </div>
    </div>
  );
}
