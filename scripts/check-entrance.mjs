#!/usr/bin/env node
// ponytail: fixed 2.5s wait (no real "animation settled" signal) and only 3
// pages (/, /about, first /projects/...) — not a full-site crawl.
//
// Real-render check for the blok entrance animation. Source-regex tests can
// pass while the site ships with `.blok` stuck at `opacity: 0` — this starts
// the production server, loads pages in headless Chrome, and reads the
// computed style back out, agnostic to whatever mechanism (GSAP, CSS
// keyframe, …) is doing the reveal.

import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 3102;
const BASE_URL = `http://localhost:${PORT}`;
const AGENT_BROWSER = path.join(ROOT, 'node_modules', '.bin', 'agent-browser');
const SESSION = `check-entrance-${process.pid}`;
const WAIT_MS = 2500;

const EVAL_SCRIPT = `
(() => {
  const bloks = Array.from(document.querySelectorAll('.blok'));
  const failing = bloks
    .filter((el) => getComputedStyle(el).opacity !== '1')
    .map((el) => el.className || el.tagName)
    .slice(0, 10);
  const firstAnimate = document.querySelector('.blok-Animate');
  const email = document.querySelector('#newsletter-form input[type="email"]');
  email?.focus();
  const emailStyle = email && getComputedStyle(email);
  return JSON.stringify({
    blokCount: bloks.length,
    failing,
    firstAnimateText: firstAnimate ? firstAnimate.textContent.trim() : null,
    headerIntroVisible: document.body.dataset.headerIntroVisible === 'true',
    newsletterFocusValid: Boolean(email?.matches(':focus-visible') &&
      emailStyle.outlineStyle === 'none' && emailStyle.borderWidth === '0px' &&
      parseFloat(getComputedStyle(email.parentElement, '::after').height) > 0),
  });
})()
`;

function ab(args, input) {
  const out = execFileSync(
    AGENT_BROWSER,
    [...args, '--session', SESSION, '--json'],
    { encoding: 'utf8', input, cwd: ROOT },
  );
  const parsed = JSON.parse(out);
  if (!parsed.success) throw new Error(`agent-browser ${args[0]} failed: ${JSON.stringify(parsed.error)}`);
  return parsed.data;
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok || res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not respond at ${BASE_URL} in time`);
}

async function firstProjectUrl() {
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) {
    const pathname = new URL(loc).pathname;
    if (/^\/projects\//.test(pathname)) return `${BASE_URL}${pathname}`;
  }
  return null;
}

async function checkPage(url) {
  ab(['open']);
  ab(['set', 'viewport', '412', '900']);
  ab(['navigate', url]);
  ab(['wait', String(WAIT_MS)]);
  const { result } = ab(['eval', '--stdin'], EVAL_SCRIPT);
  const data = JSON.parse(result);

  const problems = [];
  if (data.blokCount < 3) problems.push(`only ${data.blokCount} .blok elements (need >= 3)`);
  if (data.failing.length > 0) problems.push(`invisible .blok elements: ${data.failing.join(', ')}`);
  if (!data.firstAnimateText) problems.push('first .blok-Animate has empty text content');
  if (!data.headerIntroVisible) problems.push('body[data-header-intro-visible] is not "true"');
  if (!data.newsletterFocusValid) problems.push('newsletter focus must keep its underline without a border or outline');

  return { url, pass: problems.length === 0, problems, data };
}

async function main() {
  let server;
  let exitCode = 0;
  try {
    server = spawn('pnpm', ['start', '-p', String(PORT)], {
      cwd: ROOT,
      stdio: 'inherit',
      detached: true,
    });

    await waitForServer();

    const projectUrl = await firstProjectUrl();
    const urls = [`${BASE_URL}/`, `${BASE_URL}/about`, ...(projectUrl ? [projectUrl] : [])];
    if (!projectUrl) console.error('WARNING: no /projects/... URL found in sitemap.xml');

    for (const url of urls) {
      const result = await checkPage(url);
      if (result.pass) {
        console.log(`PASS ${url} (${result.data.blokCount} .blok elements)`);
      } else {
        exitCode = 1;
        console.error(`FAIL ${url}`);
        for (const problem of result.problems) console.error(`  - ${problem}`);
      }
    }
  } catch (err) {
    exitCode = 1;
    console.error('check-entrance error:', err.message || err);
  } finally {
    try {
      ab(['close']);
    } catch {}
    if (server && server.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {}
    }
  }
  process.exit(exitCode);
}

main();
