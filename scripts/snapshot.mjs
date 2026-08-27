/**
 * Regenerate src/data/snapshot.json from the live Instagram API.
 *
 *   node scripts/snapshot.mjs
 *
 * Needs IG_PAGE_TOKEN and IG_USER_ID in the environment (see .env.example).
 * Run this whenever you want the committed fallback refreshed — the cron job
 * handles the live path once Redis is configured.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const GRAPH = 'https://graph.facebook.com/v26.0';

// Minimal .env loader so this works without extra deps.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const TOKEN = process.env.IG_PAGE_TOKEN;
const IG = process.env.IG_USER_ID;
if (!TOKEN || !IG) {
  console.error('Missing IG_PAGE_TOKEN or IG_USER_ID. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

async function graph(path, params) {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', TOKEN);
  const body = await (await fetch(url)).json();
  if (body.error) throw new Error(`${path}: ${body.error.message}`);
  return body;
}

const isMp4 = (u) => typeof u === 'string' && u.split('?')[0].toLowerCase().endsWith('.mp4');

const breakdown = (p) =>
  (p?.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [])
    .map((r) => ({ label: r.dimension_values[0], value: r.value }))
    .sort((a, b) => b.value - a.value);

// Walk back through the feed — the best post is often months old.
async function fetchMedia() {
  const fields = 'id,permalink,timestamp,caption,media_type,thumbnail_url,media_url,like_count,comments_count';
  const out = []; let after;
  for (let page = 0; page < 3 && out.length < 50; page++) {
    const params = { fields, limit: '25' };
    if (after) params.after = after;
    const r = await graph(`${IG}/media`, params);
    out.push(...(r.data ?? []));
    after = r.paging?.cursors?.after;
    if (!after || !r.data?.length) break;
  }
  return { data: out.slice(0, 50) };
}

const now = Math.floor(Date.now() / 1000);
const since = String(now - 28 * 86400);
const until = String(now);

const [profile, reach, totals, age, gender, city, country, media] = await Promise.all([
  graph(IG, { fields: 'username,followers_count,media_count' }),
  graph(`${IG}/insights`, { metric: 'reach', period: 'days_28' }),
  graph(`${IG}/insights`, {
    metric: 'views,profile_views,total_interactions,saves,shares',
    period: 'day', metric_type: 'total_value', since, until,
  }),
  graph(`${IG}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'age' }),
  graph(`${IG}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'gender' }),
  graph(`${IG}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'city' }),
  graph(`${IG}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'country' }),
  fetchMedia(),
]);

const totalOf = (n) => totals.data?.find((m) => m.name === n)?.total_value?.value ?? 0;
const reachValues = reach.data?.[0]?.values ?? [];
const reach28 = reachValues.length ? reachValues[reachValues.length - 1].value : 0;

const items = [];
for (const m of media.data ?? []) {
  let ins = {};
  try {
    const r = await graph(`${m.id}/insights`, { metric: 'views,reach,saved,shares' });
    ins = Object.fromEntries((r.data ?? []).map((x) => [x.name, x.values?.[0]?.value ?? 0]));
  } catch { /* old media can 400 — not fatal */ }
  items.push({
    id: m.id,
    permalink: m.permalink,
    timestamp: m.timestamp,
    caption: m.caption ?? null,
    mediaType: m.media_type,
    thumbnail: m.thumbnail_url ?? null,
    videoUrl: isMp4(m.media_url) ? m.media_url : null,
    likes: m.like_count ?? 0,
    comments: m.comments_count ?? 0,
    views: ins.views ?? 0,
    reach: ins.reach ?? 0,
    saves: ins.saved ?? 0,
    shares: ins.shares ?? 0,
  });
}

const interactions28 = totalOf('total_interactions');

const snapshot = {
  syncedAt: new Date().toISOString(),
  username: profile.username,
  followers: profile.followers_count,
  posts: profile.media_count,
  reach28,
  views28: totalOf('views'),
  profileViews28: totalOf('profile_views'),
  interactions28,
  saves28: totalOf('saves'),
  shares28: totalOf('shares'),
  engagementRate: reach28 ? Number(((interactions28 / reach28) * 100).toFixed(1)) : 0,
  age: breakdown(age),
  gender: breakdown(gender),
  cities: breakdown(city),
  countries: breakdown(country),
  media: items,
};

writeFileSync('src/data/snapshot.json', JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote src/data/snapshot.json — ${snapshot.followers.toLocaleString()} followers, ${items.length} posts, engagement ${snapshot.engagementRate}%`);
