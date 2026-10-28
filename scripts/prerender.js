// Puts the rendered public page and its JSON-LD into dist/index.html after `vite build`, so
// crawlers that do not run JavaScript (and the first paint) see the clinic's content.
// Runs as part of `npm run build`; see src/entry-server.jsx.
import { readFile, rm, writeFile } from 'node:fs/promises';

const distIndex = new URL('../dist/index.html', import.meta.url);
const distLlmsTxt = new URL('../dist/llms.txt', import.meta.url);
const ssrDir = new URL('../dist-ssr/', import.meta.url);

const { render, buildLlmsTxt, buildStructuredData } = await import(new URL('entry-server.js', ssrDir));
const template = await readFile(distIndex, 'utf8');

const ROOT = '<div id="root"></div>';
if (!template.includes(ROOT)) throw new Error('dist/index.html has no empty #root to prerender into.');
if (!template.includes('</head>')) throw new Error('dist/index.html has no </head>.');

const appHtml = render();
// The headline must be in the HTML, or crawlers would get an empty page again.
if (!appHtml.includes('Dermatologist in Karur')) throw new Error('Prerendered page is missing the hero heading.');

// "<" is escaped so no FAQ text can close the script element early.
const jsonLd = JSON.stringify(buildStructuredData()).replace(/</g, '\\u003c');

// Function replacements, so a "$" in the content is not read as a replacement pattern.
const html = template
  .replace('</head>', () => `  <script type="application/ld+json">${jsonLd}</script>\n  </head>`)
  .replace(ROOT, () => `<div id="root">${appHtml}</div>`);

await writeFile(distIndex, html);
await writeFile(distLlmsTxt, buildLlmsTxt());
await rm(ssrDir, { recursive: true, force: true });
console.log(`Prerendered dist/index.html (${Math.round(html.length / 1024)} kB with JSON-LD).`);
