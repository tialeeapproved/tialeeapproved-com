/**
 * All copy lives here. Nothing user-facing is hardcoded in the page markup,
 * so a wording change is a one-file edit.
 *
 * TODO markers are the places Tia still needs to fill in.
 */

export const site = {
  name: 'tialeeapproved',
  domain: 'tialeeapproved.com',
  email: 'hi@tialeeapproved.com',
  location: 'New York',
  instagram: 'https://instagram.com/tialeeapproved',
  title: 'tialeeapproved — tech, lifestyle, music',
  description:
    'Content for people who want to keep up with tech without losing their taste. Audience data pulled live from the Instagram API.',
};

export const hero = {
  eyebrow: 'CREATOR MEDIA KIT',
  // Option C from the copy doc — closest to how Tia said it herself.
  headline: "For people who don't want to get left behind — technically or aesthetically.",
  sub: 'Tech, lifestyle and music. I make the tools make sense, and make them look good in your life.',
};

export interface Pillar {
  channel: string;
  name: string;
  headline: string;
  body: string;
}

export const pillars: Pillar[] = [
  {
    channel: '01',
    name: 'Tech',
    headline: 'Tech, explained like you’re smart',
    body: 'The tools, the launches, and what is actually worth your time — without the tutorial voice. The lane brands buy when they need people to understand a product, not just see it.',
  },
  {
    channel: '02',
    name: 'Lifestyle',
    headline: 'The way it actually fits your life',
    body: 'Products in context — the apartment, the travel, the routine. Less demo, more proof. Strongest lane for anything a person has to live with.',
  },
  {
    channel: '03',
    name: 'Music',
    // TODO(tia): one sentence on what the music content actually is —
    // DJing, Detroit scene, festival coverage, gear? Placeholder until then.
    headline: 'Sound, scene, and the city it came from',
    body: 'TODO — needs one line from Tia describing the music content before this ships.',
  },
];

export interface Brand {
  name: string;
  delivered: string;
  result: string;
}

/**
 * TODO(tia): fill `delivered` and `result` for each.
 * Where there is no hard number, deliverable + month/year still reads as credible.
 * Meta is deliberately first — it reframes how a marketer reads the rest.
 */
export const brands: Brand[] = [
  { name: 'Meta', delivered: 'TODO — what you made', result: 'TODO — result or date' },
  { name: 'Insta360', delivered: 'TODO — what you made', result: 'TODO — result or date' },
  { name: 'SailGP', delivered: 'TODO — what you made', result: 'TODO — result or date' },
  { name: 'iHerb', delivered: 'TODO — what you made', result: 'TODO — result or date' },
  { name: 'Detroit Foundation Hotel', delivered: 'TODO — what you made', result: 'TODO — result or date' },
  { name: 'EGO Home Mattress', delivered: 'TODO — what you made', result: 'TODO — result or date' },
];

export const services = [
  { name: 'In-feed reel', note: 'Concept, shoot, edit, caption' },
  { name: 'Story set', note: 'Multi-frame, swipe-up or link sticker' },
  { name: 'Event coverage', note: 'On-site capture, same-week delivery' },
  { name: 'Usage rights', note: 'Paid media and whitelisting, scoped per deal' },
];

export const contact = {
  headline: 'Let’s put your product in front of them.',
  body: 'Tell me what you are launching, when, and roughly what you are working with. You get a reply and a rate card within 48 hours.',
  // Prefilled so the first email arrives with the details already in it.
  subject: 'Brief — [brand name]',
  template: [
    'Brand:',
    'Product:',
    'Deliverables:',
    'Timeline:',
    'Budget range:',
    'Usage rights needed:',
    '',
    'Anything else:',
  ].join('\n'),
};

export function mailto(): string {
  const params = new URLSearchParams({ subject: contact.subject, body: contact.template });
  // URLSearchParams encodes spaces as "+", which mail clients render literally.
  return `mailto:${site.email}?${params.toString().replace(/\+/g, '%20')}`;
}
