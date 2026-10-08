import { defineConfig } from 'vite';

// GitHub Pages serves the site from /<repo-name>/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/jero-jones-micrositio/' : '/',
});
