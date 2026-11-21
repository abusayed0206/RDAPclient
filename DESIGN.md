---
name: RDAPclient
description: Domain, IP and ASN lookup in the sayed.app "paper & ink" design system.
source: D:\sayed.app (app/globals.css, app/layout.tsx, components/Header.tsx)
colors:
  paper: "#f4f2ec"
  surface: "#fbfaf7"
  sunk: "#ebe8df"
  ink: "#161614"
  ink-2: "#6b685f"
  line: "#dcd8cc"
  accent: "#0f6b4a"
  signal: "#e2483d"
  paper-dark: "#0f100e"
  surface-dark: "#151613"
  ink-dark: "#eeede8"
  accent-dark: "#4fcf94"
  signal-dark: "#ff6b5e"
typography:
  display: Instrument Serif 400, normal and italic (font-display)
  text: Geist (font-sans)
  meta: Geist Mono (font-mono)
---

# RDAPclient design

Borrowed from sayed.app so the project sits in the same family.

## Palette

Paper and ink. Tokens are CSS variables on `:root`, overridden by `.dark`, and
exposed through `@theme inline` in `src/styles/globals.css`: `bg-paper`,
`bg-surface` (cards), `bg-sunk`, `text-ink`, `text-ink-2`, `border-line`,
`text-accent` (green), `bg-signal` (the red logo dot only), plus
`ok / warn / danger` for state. Never raw colours.

## Type

- Instrument Serif for display: the hero h1 (48 to 88px, tight, with the second
  half in italic green), section h2s, the result sentence and fact-section
  titles. It has one weight, so never add bold to it.
- Geist for interface and body text.
- Geist Mono for metadata: the `rdap.sayed.app` wordmark, stat chips, kind
  tags, small uppercase section labels, code and data strings.

## Shape and surfaces

- Pills everywhere for actions: primary is filled ink with paper text,
  secondary is a bordered card; nav items are pills with `bg-sunk` when active.
- Cards and panels: `rounded-2xl`, 1px `line` border, `bg-surface`.
- Hero sits on the faint 28px drafting grid (`.bg-grid`) with a bottom rule.
- Header: sticky, translucent paper (`bg-paper/80` + blur), bottom rule.
- Footer: a serif prompt, a mono link column, a mono meta line.

## Layout

- `/`: grid hero (headline, mono stat chips, search card, example chips), then
  "How it works" (registry route diagram card with pulses + three steps) and
  "For developers" (curl + sample JSON). With a query, the hero shrinks to the
  search and results show as a sticky summary panel beside the details.
- `/api`: sticky section list, examples in curl / JavaScript / Python, live
  "Try it", example responses, errors, caching, fields.

## Motion

Colour and opacity transitions only, a one-time slide when an answer lands,
and the diagram pulses. Reduced motion turns all of it off. Nothing is ever
hidden by an animation's starting frame.
