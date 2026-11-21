import { render, screen } from '@testing-library/react';

import ApiDocs from '@/app/api/page';
import HomePage from '@/app/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Homepage', () => {
  it('renders the search form and examples', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /who owns this domain/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/domain, IP address or ASN/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'github.com' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute(
      'href',
      '/api',
    );
  });
});

describe('API docs', () => {
  it('documents every endpoint with a live request box', () => {
    render(<ApiDocs />);
    for (const name of [
      /look up a domain/i,
      /look up an ip address/i,
      /look up an asn/i,
      /errors/i,
    ]) {
      expect(
        screen.getByRole('heading', { level: 2, name }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getAllByRole('button', { name: /send request/i }),
    ).toHaveLength(3);
  });
});
