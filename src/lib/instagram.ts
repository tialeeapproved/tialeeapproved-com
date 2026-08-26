/**
 * Instagram Graph API client.
 *
 * Reads ONLY the tialeeapproved account, using a Page access token derived from
 * a long-lived user token. That token does not expire (debug_token reports
 * expires_at: 0), so there is no refresh job.
 *
 * The one real deadline is Meta's *data access* window: 90 days from the last
 * authorization. See DATA_ACCESS_EXPIRES below.
 */

const GRAPH = 'https://graph.facebook.com/v26.0';

/** Meta data-access expiry for the current authorization. Re-auth before this. */
export const DATA_ACCESS_EXPIRES = '2026-11-24';

export interface Demographic {
  label: string;
  value: number;
}

export interface MediaItem {
  id: string;
  permalink: string;
  timestamp: string;
  caption: string | null;
  mediaType: string;
  thumbnail: string | null;
  likes: number;
  comments: number;
  views: number;
  reach: number;
  saves: number;
  shares: number;
}

export interface Snapshot {
  syncedAt: string;
  username: string;
  followers: number;
  posts: number;
  reach28: number;
  views28: number;
  profileViews28: number;
  interactions28: number;
  saves28: number;
  shares28: number;
  /** Interactions as a share of reach, in percent. */
  engagementRate: number;
  age: Demographic[];
  gender: Demographic[];
  cities: Demographic[];
  countries: Demographic[];
  media: MediaItem[];
}

function env(key: string): string | undefined {
  return process.env[key];
}

async function graph(path: string, params: Record<string, string>): Promise<any> {
  const token = env('IG_PAGE_TOKEN');
  if (!token) throw new Error('IG_PAGE_TOKEN is not set');
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const body = await res.json();
  if (body.error) {
    throw new Error(`Graph API ${path}: ${body.error.message} (code ${body.error.code})`);
  }
  return body;
}

function breakdown(payload: any): Demographic[] {
  const results = payload?.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
  return results
    .map((r: any) => ({ label: r.dimension_values[0], value: r.value }))
    .sort((a: Demographic, b: Demographic) => b.value - a.value);
}

/** Pull everything the page needs in one pass. */
export async function fetchSnapshot(): Promise<Snapshot> {
  const igId = env('IG_USER_ID');
  if (!igId) throw new Error('IG_USER_ID is not set');

  const now = Math.floor(Date.now() / 1000);
  const since = String(now - 28 * 86400);
  const until = String(now);

  const [profile, reach, totals, age, gender, city, country, media] = await Promise.all([
    graph(igId, { fields: 'username,followers_count,media_count' }),
    graph(`${igId}/insights`, { metric: 'reach', period: 'days_28' }),
    graph(`${igId}/insights`, {
      metric: 'views,profile_views,total_interactions,saves,shares',
      period: 'day',
      metric_type: 'total_value',
      since,
      until,
    }),
    graph(`${igId}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'age' }),
    graph(`${igId}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'gender' }),
    graph(`${igId}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'city' }),
    graph(`${igId}/insights`, { metric: 'follower_demographics', period: 'lifetime', metric_type: 'total_value', breakdown: 'country' }),
    graph(`${igId}/media`, {
      fields: 'id,permalink,timestamp,caption,media_type,thumbnail_url,media_url,like_count,comments_count',
      limit: '12',
    }),
  ]);

  const totalOf = (name: string): number =>
    totals.data?.find((m: any) => m.name === name)?.total_value?.value ?? 0;

  const reachValues = reach.data?.[0]?.values ?? [];
  const reach28 = reachValues.length ? reachValues[reachValues.length - 1].value : 0;

  // Per-post insights, in parallel, tolerant of individual failures.
  const items: MediaItem[] = await Promise.all(
    (media.data ?? []).map(async (m: any): Promise<MediaItem> => {
      let ins: Record<string, number> = {};
      try {
        const r = await graph(`${m.id}/insights`, { metric: 'views,reach,saved,shares' });
        ins = Object.fromEntries((r.data ?? []).map((x: any) => [x.name, x.values?.[0]?.value ?? 0]));
      } catch {
        // A single post's insights can 400 (e.g. very old media). Not fatal.
      }
      return {
        id: m.id,
        permalink: m.permalink,
        timestamp: m.timestamp,
        caption: m.caption ?? null,
        mediaType: m.media_type,
        thumbnail: m.thumbnail_url ?? m.media_url ?? null,
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        views: ins.views ?? 0,
        reach: ins.reach ?? 0,
        saves: ins.saved ?? 0,
        shares: ins.shares ?? 0,
      };
    })
  );

  const interactions28 = totalOf('total_interactions');

  return {
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
}
