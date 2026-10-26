/**
 * Health check — open https://<site>/api/health any time.
 *
 * Answers, in plain English: are the numbers on the site current, when did they
 * last refresh, and how long before Meta's authorization needs renewing.
 *
 * Deliberately public and read-only. It exposes no credentials and no data that
 * is not already on the home page.
 */

import type { APIRoute } from 'astro';
import { readSnapshot } from '../../lib/store';
import { DATA_ACCESS_EXPIRES } from '../../lib/instagram';

export const prerender = false;

/** Past this, the home page stops presenting the numbers as current. */
export const STALE_AFTER_DAYS = 3;

export const GET: APIRoute = async () => {
  const { data, source } = await readSnapshot();

  const ageMs = Date.now() - new Date(data.syncedAt).getTime();
  const ageHours = Math.floor(ageMs / 3_600_000);
  const ageDays = Math.floor(ageMs / 86_400_000);
  const reauthDays = Math.ceil((new Date(DATA_ACCESS_EXPIRES).getTime() - Date.now()) / 86_400_000);

  const stale = ageDays >= STALE_AFTER_DAYS;
  const ok = source === 'live' && !stale;

  let verdict: string;
  if (source !== 'live') {
    verdict = 'NOT LIVE — the site is serving the snapshot committed to the repo. Redis is unset or unreachable, or the sync has never run.';
  } else if (stale) {
    verdict = `STALE — last refresh was ${ageDays} days ago. The daily sync is failing.`;
  } else {
    verdict = `Healthy — refreshed ${ageHours} hours ago.`;
  }

  const warnings: string[] = [];
  if (reauthDays <= 14) warnings.push(`Meta authorization expires in ${reauthDays} days — regenerate IG_PAGE_TOKEN.`);
  if (reauthDays <= 0) warnings.push('Meta authorization has EXPIRED. The numbers are frozen until it is renewed.');

  return new Response(
    JSON.stringify({
      ok,
      verdict,
      source,
      lastSync: data.syncedAt,
      dataAgeHours: ageHours,
      staleAfterDays: STALE_AFTER_DAYS,
      reauthBy: DATA_ACCESS_EXPIRES,
      reauthDaysLeft: reauthDays,
      followers: data.followers,
      postsTracked: data.media.length,
      warnings,
    }, null, 2),
    {
      status: ok ? 200 : 503,          // non-200 so uptime monitors notice
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
};
