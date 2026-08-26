import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://tialeeapproved.com',
  // Static by default; only files that opt out (the cron route) run on the server.
  output: 'static',
  adapter: vercel(),
});
