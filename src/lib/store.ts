/**
 * Where the numbers live.
 *
 * Order of preference:
 *   1. Upstash Redis  — written daily by the cron job (live)
 *   2. snapshot.json  — committed to the repo (always works, never blank)
 *
 * The point of the fallback is that a Meta outage, an expired data-access
 * window, or a missing Redis config degrades the page to slightly stale
 * numbers instead of a broken section.
 */

import fallback from '../data/snapshot.json';
import type { Snapshot } from './instagram';

const KEY = 'tialeeapproved:snapshot';

function redisConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export async function readSnapshot(): Promise<{ data: Snapshot; source: 'live' | 'snapshot' }> {
  const cfg = redisConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${cfg.token}` },
        signal: AbortSignal.timeout(5_000),
      });
      const body = await res.json();
      if (body?.result) {
        return { data: JSON.parse(body.result) as Snapshot, source: 'live' };
      }
    } catch {
      // Fall through to the committed snapshot.
    }
  }
  return { data: fallback as unknown as Snapshot, source: 'snapshot' };
}

export async function writeSnapshot(snapshot: Snapshot): Promise<boolean> {
  const cfg = redisConfig();
  if (!cfg) return false;
  const res = await fetch(`${cfg.url}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
    signal: AbortSignal.timeout(10_000),
  });
  return res.ok;
}
