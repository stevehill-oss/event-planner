// Shared helpers: formatting, event lookups, website links, images, embed support.
import { EVENTS } from './events.js';

export const SITE = 'https://prestigecorporateevents.com';
export const PHONE = { text: '0333 305 5377', href: 'tel:+443333055377' };

const params = new URLSearchParams(location.search);
export const EMBED = params.get('embed') === '1';

/* ---------- dates ---------- */

export function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function ordinal(n) {
  const s = n % 100;
  if (s >= 11 && s <= 13) return n + 'th';
  return n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
}
function parts(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }; }
// "Friday 19th March 2027"
export function longDate(iso) { const p = parts(iso); return `${DAYS[p.dow]} ${ordinal(p.d)} ${MONTHS[p.m - 1]} ${p.y}`; }
// "19th Mar 2027"
export function shortDate(iso) { const p = parts(iso); return `${ordinal(p.d)} ${MONTHS[p.m - 1].slice(0, 3)} ${p.y}`; }
export function ddmmyyyy(iso) { const p = parts(iso); return `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.y}`; }
export function eventDateText(ev) {
  const today = todayIso();
  if (ev.e && ev.e > ev.d) {
    if (ev.d < today) return `Running until ${longDate(ev.e)}`;
    const a = parts(ev.d); const b = parts(ev.e);
    if ((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5 <= 6) {
      return a.m === b.m ? `${ordinal(a.d)} to ${ordinal(b.d)} ${MONTHS[a.m - 1]} ${a.y}` : `${shortDate(ev.d)} to ${shortDate(ev.e)}`;
    }
  }
  return longDate(ev.d);
}

/* ---------- events ---------- */

// Bookable events only: checked in the browser each day. Anything finishing within the next
// three days is dropped, since there is no time left to arrange hospitality.
export function liveEvents() {
  const d = new Date(); d.setDate(d.getDate() + 3);
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return EVENTS.filter((e) => (e.e || e.d) >= t);
}
export const eventBySlug = (slug) => liveEvents().find((e) => e.s === slug) || null;

export const INTEREST = {
  sport: { label: 'Live sport', mains: ['football', 'rugby', 'boxing', 'darts', 'basketball', 'american-football', 'cricket', 'tennis', 'cycling', 'sailing-and-boating'] },
  racing: { label: 'A day at the races', mains: ['horse-racing'] },
  motor: { label: 'Speed and motorsport', mains: ['formula-one', 'motorsport', 'car-show'] },
  music: { label: 'Live music', mains: ['live-music', 'festivals'] },
  culture: { label: 'Culture, fashion and shows', mains: ['theatre', 'fashion', 'comedy'] },
};
export function interestOf(ev) {
  if (ev.s.includes('bocelli') || ev.g === 'classical-orchestral-concerts') return 'music';
  for (const [k, v] of Object.entries(INTEREST)) if (v.mains.includes(ev.m)) return k;
  return ev.p === 'music' ? 'music' : ev.p === 'arts-culture' ? 'culture' : 'sport';
}
export const REGIONS = [
  { id: 'london', label: 'London' },
  { id: 'south', label: 'South and East of England' },
  { id: 'midlands', label: 'Midlands' },
  { id: 'north', label: 'North of England' },
  { id: 'scotland', label: 'Scotland' },
  { id: 'wales', label: 'Wales' },
  { id: 'abroad', label: 'Abroad' },
];

/* ---------- images (Sanity image CDN, resized and converted on the fly) ---------- */

const CDN = 'https://cdn.sanity.io/images/wro0j099/production/';
export function img(path, w, h) { return `${CDN}${path}?w=${w}${h ? `&h=${h}&fit=crop&crop=entropy` : ''}&auto=format&q=72`; }
export function imgTag(ev, { w = 640, ratio = 16 / 9, sizes = '(max-width: 700px) 100vw, 640px', eager = false, cls = '' } = {}) {
  const ws = [360, 640, 960, 1280].filter((x) => x <= w * 2);
  const set = ws.map((x) => `${img(ev.i, x, Math.round(x / ratio))} ${x}w`).join(', ');
  return `<img class="${cls}" src="${img(ev.i, w, Math.round(w / ratio))}" srcset="${set}" sizes="${sizes}" width="${w}" height="${Math.round(w / ratio)}" alt="${esc(ev.t)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/* ---------- links to our website ---------- */

// Category pages verified live on 02/11/2026. Anything else falls back to its primary category.
const CATEGORY_PAGES = {
  football: '/sport/football', rugby: '/sport/rugby', 'american-football': '/sport/american-football',
  'horse-racing': '/sport/horse-racing', boxing: '/sport/boxing', 'formula-one': '/sport/formula-one',
  cricket: '/sport/cricket', tennis: '/sport/tennis', darts: '/sport/darts', 'live-music': '/music/live-music',
  festivals: '/music/festivals', theatre: '/arts-culture/theatre', comedy: '/arts-culture/comedy',
};
export function utm(path, tool, content) {
  const u = new URL(path, SITE);
  u.searchParams.set('utm_source', 'hospitality-planner');
  u.searchParams.set('utm_medium', EMBED ? 'blog-embed' : 'referral');
  u.searchParams.set('utm_campaign', tool);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
}
// The event page, landing on its form. Register-interest pages have a #waitlist-form anchor;
// standard pages open their form from the "Enquire Now" buttons near the top.
export function eventUrl(ev, tool) { return utm(`/event/${ev.s}`, tool, ev.s) + (ev.w ? '#waitlist-form' : ''); }
export function ctaLabel(ev) { return ev.w ? 'Join the waitlist for this event' : 'Enquire about this event'; }
export function categoryUrl(ev, tool) { return utm(CATEGORY_PAGES[ev.m] || `/${ev.p || ''}`, tool, `category-${ev.m}`); }
export const contactUrl = (tool) => utm('/contact', tool, 'contact');
// Links leave the iframe when embedded, so the blog reader lands on the full event page.
export const LINK_TARGET = EMBED ? '_top' : '_self';

/* ---------- money and numbers ---------- */

export function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[£,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1e9) : null;
}
export function gbp(n, { pence = false } = {}) {
  if (n === null || !Number.isFinite(n)) return '£0';
  const neg = n < 0; const a = Math.abs(n);
  const showP = pence && Math.round(a * 100) % 100 !== 0 && a < 1000;
  const s = a.toLocaleString('en-GB', { minimumFractionDigits: showP ? 2 : 0, maximumFractionDigits: showP ? 2 : 0 });
  return `${neg ? '-' : ''}£${s}`;
}
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;

/* ---------- DOM ---------- */

export function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false; t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('is-on'); setTimeout(() => { t.hidden = true; }, 300); }, 4200);
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch { return false; }
}

// A primary call to action that copies the visitor's brief, then opens the event page.
// The brief goes into the Message box on the enquiry form.
export function wireBriefLinks(root, getBrief) {
  $$('[data-brief-link]', root).forEach((a) => {
    a.addEventListener('click', async () => {
      const ok = await copyText(getBrief(a.dataset.briefLink));
      if (ok) toast('Your brief is copied. Paste it into the Message box on the form.');
      track('planner_enquiry_click', { tool: a.dataset.tool || '', event: a.dataset.briefLink || '' });
    });
  });
}

/* ---------- analytics hand-off ---------- */

// Tells the host page (our blog) what happened, so its own analytics can record it.
export function track(name, detail = {}) {
  try { if (EMBED && window.parent !== window) window.parent.postMessage({ source: 'pce-planner', type: 'event', name, detail }, '*'); } catch { /* ignore */ }
  try { if (window.dataLayer) window.dataLayer.push({ event: name, ...detail }); } catch { /* ignore */ }
}

// Embedded: report our height so the blog can size the iframe with no inner scrollbar.
export function startHeightReporter() {
  if (!EMBED || window.parent === window) return;
  let last = 0;
  const send = () => {
    const h = Math.ceil(document.documentElement.scrollHeight);
    if (Math.abs(h - last) > 2) { last = h; window.parent.postMessage({ source: 'pce-planner', type: 'height', height: h }, '*'); }
  };
  new ResizeObserver(send).observe(document.body);
  window.addEventListener('load', send);
  send();
}
// Phones: the result sits below the form, so a small bar at the bottom shows the live answer
// and jumps to it. It hides itself while the result panel is on screen.
export function peek(calcRoot, text) {
  let bar = calcRoot.querySelector('.calc__peek');
  if (!bar) {
    bar = document.createElement('button');
    bar.type = 'button'; bar.className = 'calc__peek';
    calcRoot.appendChild(bar);
    const out = calcRoot.querySelector('.calc__out');
    bar.addEventListener('click', () => scrollToEl(out));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => bar.classList.toggle('is-away', !e.isIntersecting), { threshold: 0.15 }).observe(out);
    }
  }
  bar.hidden = !text;
  bar.innerHTML = text ? `<span>${text}</span><span aria-hidden="true">See it</span>` : '';
}
export function scrollToEl(el) {
  if (!el) return;
  if (EMBED && window.parent !== window) {
    window.parent.postMessage({ source: 'pce-planner', type: 'scroll', top: el.getBoundingClientRect().top + window.scrollY }, '*');
    return;
  }
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
