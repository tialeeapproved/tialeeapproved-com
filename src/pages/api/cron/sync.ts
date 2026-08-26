/**
 * Daily sync: Instagram -> Redis.
 *
 * Wired to Vercel Cron in vercel.json. The page reads Redis, never Meta, so
 * this job failing degrades the site to the previous day's numbers (or the
 * committed snapshot) rather than breaking a section.
 *
 * Protected by CRON_SECRET. Vercel Cron sends it as a Bearer token.
 */

import type { APIRoute } from 'astro';
import { fetchSnapshot, DATA_ACCESS_EXPIRES } from '../../../lib/instagram';
import { writeSnapshot } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const daysLeft = Math.ceil(
    (new Date(DATA_ACCESS_EXPIRES).getTime() - Date.now()) / 86_400_000
  );

  try {
    const snapshot = await fetchSnapshot();
    const stored = await writeSnapshot(snapshot);

    return Response.json({
      ok: true,
      stored,
      followers: snapshot.followers,
      engagementRate: snapshot.engagementRate,
      posts: snapshot.media.length,
      syncedAt: snapshot.syncedAt,
      dataAccessDaysLeft: daysLeft,
      // Surfaces in the cron log well before anything actually breaks.
      warning: daysLeft <= 14 ? `Meta data access expires in ${daysLeft} days — re-authorize the app.` : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/sync] failed:', message);
    return Response.json(
      { ok: false, error: message, dataAccessDaysLeft: daysLeft },
      { status: 500 }
    );
  }
};
