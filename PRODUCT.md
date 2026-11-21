# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Developers and sysadmins** debugging DNS and networks: checking a domain's registrar, nameservers and status, finding who owns an IP range or ASN, and calling the JSON API from scripts.
- **General curious visitors** who want to know who owns a website or when a domain expires, as a WHOIS replacement, without knowing what RDAP is.

## Product Purpose

Look up registration data for domains, IP addresses and autonomous systems from the authoritative registry via RDAP (the protocol ICANN made the definitive gTLD source on 28 Jan 2025), and present it as a readable page and as a free JSON API. Success: a visitor pastes anything (domain, URL, IP, ASN) and understands the answer in seconds.

## Positioning

Fast, clean, no ads. Instant answers, readable output, no clutter, upsells or tracking. Queries go live to the authoritative registry found through IANA bootstrap, not to a cached third-party WHOIS database.

## Operating Context

- Single input that auto-detects domain / IP / ASN; results are shareable via `?q=` in the URL.
- Public JSON API: `/api/lookup/{domain}`, `/api/ip/{address}`, `/api/asn/{number}`, CORS-enabled, edge-cached.
- Visitors arrive from search, links shared by others, and direct use while debugging.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind 4, deployed on Vercel. Home page is statically prerendered; lookups run client-side against the app's own API.
- Data shown per type: domain (registrar, IANA ID, abuse contact, dates, EPP statuses linked to ICANN, nameservers, DNSSEC, contacts, notices); IP (range/CIDR, network name, handle, org, country, dates, status, contacts); ASN (name, org, handle, block, country, dates, status, contacts).
- Registries return inconsistent data; many fields are often missing or redacted.
- Light and dark themes; must be responsive down to 375px; must stay fast.

## Brand Commitments

- Name: RDAPclient. Domain: rdap.sayed.app. Author: abusayed0206. MIT licensed.
- No other visual constraints: the user gave a free hand on logo, colour and type.

## Evidence on Hand

- Real live data only. No testimonials, usage numbers or customer logos exist; do not invent any.
- Existing assets: `public/images/og.png`, favicons in `public/favicon/`, Inter variable font in `public/fonts/`.

## Product Principles

1. The answer is the product: the result must be readable at a glance, important facts first.
2. Accept anything a person would paste; never make them pick a mode.
3. Nothing between the visitor and the data: no ads, no sign-up, no noise.
4. The API is a first-class citizen of the same page, not an afterthought.

## Accessibility & Inclusion

Not specified by the user; meet WCAG 2.2 AA as a baseline (contrast, keyboard, focus visibility, reduced motion).
