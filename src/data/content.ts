/**
 * All copy lives here. Nothing user-facing is hardcoded in the page markup,
 * so a wording change is a one-file edit.
 *
 * Source of truth for positioning: Tia's own media kit deck (Aug 2026).
 * Where the deck and the live API disagree, the API wins for Instagram numbers
 * and the deck wins for everything the API can't see.
 */

export const site = {
  name: 'tialeeapproved',
  domain: 'tialeeapproved.com',
  email: 'hi@tialeeapproved.com',
  location: 'New York',
  instagram: 'https://instagram.com/tialeeapproved',
  tiktok: 'https://tiktok.com/@tialeeapproved',
  title: 'tialeeapproved — content creator',
  description:
    'Engineering stories that move the needle. 77K across platforms — tech, luxury and lifestyle content with the audience data to back it.',
};

export const hero = {
  eyebrow: 'CONTENT CREATOR',
  headline: 'Engineering stories that move the needle.',
  sub: 'Corporate rigor meets creative execution. I turn niche audiences into measurable results.',
};

/**
 * Platform sizes.
 *
 * `live` is kept for internal reference only — Instagram is the one platform
 * actually pulled from an API — but the page deliberately does NOT surface where
 * any figure comes from. Update the other three by hand when they move.
 */
export interface Platform {
  name: string;
  handle: string;
  followers: number;
  live: boolean;
  url?: string;
}

export const platforms: Platform[] = [
  { name: 'TikTok', handle: '@tialeeapproved', followers: 58_000, live: false, url: 'https://tiktok.com/@tialeeapproved' },
  { name: 'Instagram', handle: '@tialeeapproved', followers: 12_575, live: true, url: 'https://instagram.com/tialeeapproved' },
  { name: 'LinkedIn', handle: 'Tia Lee Fowlkes', followers: 6_000, live: false },
  { name: 'YouTube', handle: '@tialeeapproved', followers: 1_000, live: false },
];

export const crossPlatformTotal = 77_000;

/** Who Tia is, in the deck's own framing. */
export const credentials = [
  { label: 'Ex-Google', note: 'Corporate rigor meets creative execution' },
  { label: 'Ex-Head of Digital Strategy', note: 'Turning niche audiences into measurable results' },
  { label: 'Serial entrepreneur', note: 'Built audiences across three industries' },
  { label: 'Brand transformer', note: 'Took an outdated brand to a $70K grant win' },
  { label: 'Production ready', note: 'Owns pro-grade equipment — no rental line item' },
];

export const audienceNote =
  'Tech professionals, career builders, and luxury lifestyle seekers.';

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
    body: 'The tools, the launches, and what is actually worth your time — without the tutorial voice. An ex-Google engineer’s read on what a product really does, which is why tech brands buy this lane.',
  },
  {
    channel: '02',
    name: 'Luxury & lifestyle',
    headline: 'The way it actually fits your life',
    body: 'Apartment tours, travel, hotels, wellness. Products in context rather than in a demo — the lane that carries real estate, hospitality and anything a person has to live with.',
  },
  {
    channel: '03',
    name: 'Career',
    headline: 'Leaving, building, and the math behind it',
    body: 'The decisions, the offers, the exit. Corporate Exit Chronicles lives here, and it is the highest-retention work on the account.',
  },
];

/**
 * The flagship case study. Every figure here is Tia's own reporting from the
 * deck, except the chapter-7 numbers, which are live from the API.
 */
export const caseStudy = {
  label: 'CASE STUDY',
  title: 'Corporate Exit Chronicles',
  standfirst: 'Editing earns the click. Storytelling earns the loyalty.',
  body: 'A 14-chapter Instagram series on leaving corporate — the decisions, the money, the fallout. Written as a serial so the audience came back for the next chapter instead of scrolling past.',
  stats: [
    { value: '14', label: 'Chapters' },
    { value: '4,600+', label: 'New followers in 30 days' },
    { value: '3.7K', label: 'Saves across the series' },
    { value: '41%', label: 'Of comments named the storytelling or editing' },
  ],
  kicker: 'Chapter 7 alone reached 144,044 people — eleven times the follower count it launched from.',
};

export interface Brand {
  name: string;
  work?: string;
}

/** Named partners. Ray-Ban Meta AI is the flagship and leads deliberately. */
export const brands: Brand[] = [
  { name: 'Meta', work: 'Ray-Ban Meta AI glasses' },
  { name: 'Insta360' },
  { name: 'SailGP' },
  { name: 'iHerb' },
  { name: 'Detroit Foundation Hotel', work: 'Hotel feature' },
  { name: 'EGO Home Mattress' },
];

export const services = [
  { name: 'In-feed reel', note: 'Concept, shoot, edit, caption' },
  { name: 'Story set', note: 'Multi-frame, link sticker' },
  { name: 'Event coverage', note: 'On-site capture, same-week delivery' },
  { name: 'Usage rights', note: 'Paid media and whitelisting, scoped per deal' },
];

export const contact = {
  headline: 'Let’s build.',
  body: '77K people tune in for what I build next. The right brand partnership makes that moment count. Tell me what you’re launching, when, and roughly what you’re working with — you get a reply and a rate card within 48 hours.',
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

/**
 * Tia's own clips, keyed by Instagram media id.
 *
 * Meta only returns a direct mp4 for some Reels, and those URLs expire. A file in
 * public/clips/ always plays and never rots, so anything listed here wins over
 * whatever the API hands back.
 *
 * To add one: drop the export in public/clips/ (any size, full length is fine),
 * it gets re-encoded for web and added here. Media ids are in snapshot.json.
 */
export const videoOverrides: Record<string, string> = {
  // Corporate Exit Chronicles ch. 7 — 4 Mar 2026 · 234K views · 144K reach
  '17939489919144147': '/clips/cec-ch7.mp4',
  // Detroit Foundation Hotel — 10 Jun 2026
  '18209175244337967': '/clips/dfh.mp4',
  // EGO Home Mattress — 19 May 2026
  '17909357355408642': '/clips/ego.mp4',
};
