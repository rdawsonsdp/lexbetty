/**
 * Convert docs/APP_GUIDE.md → docs/APP_GUIDE.pdf with embedded screenshots.
 * Uses marked for Markdown rendering and Playwright (already installed for screenshots) for PDF output.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { marked } from 'marked';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MD_PATH = resolve(ROOT, 'docs/APP_GUIDE.md');
const PDF_PATH = resolve(ROOT, 'docs/APP_GUIDE.pdf');
const DOCS_DIR_URL = pathToFileURL(resolve(ROOT, 'docs') + '/').toString();

const BRAND = {
  charcoal: '#1A1A1A',
  orange: '#E8621A',
  cream: '#F5EDE0',
  muted: '#9B9189',
};

const HTML_TEMPLATE = (body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="${DOCS_DIR_URL}">
  <title>Lexington Betty Catering — Staff Guide</title>
  <style>
    @page { size: letter; margin: 0.75in 0.6in; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11.5pt;
      line-height: 1.55;
      color: ${BRAND.charcoal};
      background: #ffffff;
    }
    .cover {
      page-break-after: always;
      text-align: center;
      padding: 1.6in 0.4in 0;
    }
    .cover .badge {
      display: inline-block;
      padding: 6pt 12pt;
      background: ${BRAND.orange};
      color: #fff;
      font-weight: 700;
      letter-spacing: 1.5pt;
      text-transform: uppercase;
      font-size: 9pt;
      border-radius: 4pt;
      margin-bottom: 24pt;
    }
    .cover h1 {
      font-size: 32pt;
      font-weight: 800;
      letter-spacing: 1pt;
      margin: 0 0 14pt;
      color: ${BRAND.charcoal};
      text-transform: uppercase;
      line-height: 1.1;
    }
    .cover .sub {
      font-size: 14pt;
      color: ${BRAND.muted};
      margin: 0 0 24pt;
    }
    .cover .rule {
      width: 60pt;
      height: 3pt;
      background: ${BRAND.orange};
      margin: 24pt auto;
    }
    .cover .meta {
      font-size: 10pt;
      color: ${BRAND.muted};
      letter-spacing: 0.5pt;
    }
    h1 {
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: 0.5pt;
      color: ${BRAND.charcoal};
      margin: 0 0 8pt;
      page-break-before: always;
      page-break-after: avoid;
      border-bottom: 2pt solid ${BRAND.orange};
      padding-bottom: 6pt;
    }
    h2 {
      font-size: 16pt;
      font-weight: 700;
      color: ${BRAND.charcoal};
      margin: 22pt 0 6pt;
      page-break-after: avoid;
      letter-spacing: 0.3pt;
    }
    h3 {
      font-size: 13pt;
      font-weight: 700;
      color: ${BRAND.orange};
      margin: 18pt 0 6pt;
      page-break-after: avoid;
    }
    h4 {
      font-size: 11.5pt;
      font-weight: 700;
      color: ${BRAND.charcoal};
      margin: 14pt 0 4pt;
      page-break-after: avoid;
    }
    p { margin: 0 0 8pt; }
    ul, ol { margin: 0 0 10pt; padding-left: 22pt; }
    li { margin: 0 0 4pt; }
    li > p { margin: 0; }
    strong { color: ${BRAND.charcoal}; }
    code {
      font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 10pt;
      background: #f3f3f1;
      padding: 1pt 4pt;
      border-radius: 3pt;
      color: ${BRAND.charcoal};
    }
    pre {
      background: #f3f3f1;
      padding: 8pt 10pt;
      border-radius: 4pt;
      overflow: hidden;
      page-break-inside: avoid;
    }
    pre code { background: transparent; padding: 0; font-size: 9.5pt; }
    blockquote {
      border-left: 3pt solid ${BRAND.orange};
      padding: 0 0 0 12pt;
      margin: 10pt 0;
      color: ${BRAND.muted};
    }
    hr {
      border: none;
      border-top: 1pt solid #e5e5e5;
      margin: 18pt 0;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 8pt auto 14pt;
      border: 1pt solid #e0e0e0;
      border-radius: 4pt;
      page-break-inside: avoid;
    }
    a { color: ${BRAND.orange}; text-decoration: none; }
    /* The first heading after the cover should NOT page-break */
    .content h1:first-of-type { page-break-before: auto; }
    /* Tighter spacing for nested lists */
    li ul, li ol { margin-top: 4pt; }
  </style>
</head>
<body>
  <div class="cover">
    <span class="badge">Staff Guide</span>
    <h1>Lexington Betty<br/>Catering Platform</h1>
    <p class="sub">A plain-English handbook for the team</p>
    <div class="rule"></div>
    <p class="meta">Lexington Betty Smokehouse · Chicago</p>
  </div>
  <div class="content">${body}</div>
</body>
</html>`;

async function main() {
  console.log('Reading', MD_PATH);
  const md = await readFile(MD_PATH, 'utf8');

  // Strip the duplicate top-level title since the cover handles it.
  const trimmed = md.replace(/^#\s+Lexington Betty[^\n]*\n+/, '');

  console.log('Rendering Markdown → HTML…');
  marked.setOptions({ headerIds: false, mangle: false });
  const bodyHtml = marked.parse(trimmed);
  const fullHtml = HTML_TEMPLATE(bodyHtml);

  const tmpHtmlPath = resolve(ROOT, 'docs/APP_GUIDE.html');
  await writeFile(tmpHtmlPath, fullHtml, 'utf8');
  console.log('Wrote intermediate HTML →', tmpHtmlPath);

  console.log('Launching Chromium…');
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(tmpHtmlPath).toString(), { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  console.log('Generating PDF →', PDF_PATH);
  await page.pdf({
    path: PDF_PATH,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.75in', bottom: '0.75in', left: '0.6in', right: '0.6in' },
  });

  await browser.close();
  console.log('\n✓ Done.');
  console.log('  PDF:  ', PDF_PATH);
  console.log('  HTML: ', tmpHtmlPath, '(intermediate, safe to delete)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
