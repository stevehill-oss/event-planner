// Page shell: tool switching, shared memory between tools, embed mode.
// URL options:  #match  #worth  #roi   picks the tool
//               ?embed=1                hides the header and footer for an iframe in a blog
//               ?only=worth             shows one tool with no tool switcher
//               ?event=<slug>           preselects an event (for a blog about one event)
import { EMBED, startHeightReporter, $, $$, img, liveEvents, eventBySlug, track } from './core.js';
import { createMatch, heroEvents } from './match.js';
import { createWorth } from './worth.js';
import { createRoi } from './roi.js';
import { BUILT } from './events.js';

const params = new URLSearchParams(location.search);
const ONLY = ['match', 'worth', 'roi'].includes(params.get('only')) ? params.get('only') : null;
const memory = { event: eventBySlug(params.get('event') || '') ? params.get('event') : undefined, guests: null };

if (EMBED) document.documentElement.classList.add('is-embed');
if (ONLY) document.documentElement.classList.add('is-only');

const ctx = {
  remember(p) { Object.entries(p).forEach(([k, v]) => { if (v !== undefined && v !== null) memory[k] = v; }); },
  go(tool, p = {}) { show(tool, { ...memory, ...p }, true); },
};
const tools = {
  match: createMatch($('#panel-match .panel__body'), ctx),
  worth: createWorth($('#panel-worth .panel__body'), ctx),
  roi: createRoi($('#panel-roi .panel__body'), ctx),
};

function show(tool, p = {}, scroll = false) {
  if (ONLY) tool = ONLY;
  $$('.tab').forEach((t) => { const on = t.dataset.tool === tool; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
  $$('.panel').forEach((pn) => { pn.hidden = pn.id !== `panel-${tool}`; });
  tools[tool].show(p);
  if (location.hash !== `#${tool}`) history.replaceState(null, '', `${location.search}#${tool}`);
  if (scroll) $('#tools').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  track('planner_tool_view', { tool });
}

$$('.tab').forEach((t) => {
  t.addEventListener('click', () => show(t.dataset.tool, memory));
  t.addEventListener('keydown', (e) => {
    const list = $$('.tab'); const i = list.indexOf(t);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const n = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
      n.focus(); show(n.dataset.tool, memory);
    }
  });
});
$$('[data-open]').forEach((b) => b.addEventListener('click', () => show(b.dataset.open, memory, true)));

// Hero collage from live event images.
const hero = $('.hero__art');
if (hero) {
  hero.innerHTML = heroEvents().slice(0, 4).map((e, i) => `<figure style="--i:${i}"><img src="${img(e.i, 520, 650)}" srcset="${img(e.i, 320, 400)} 320w, ${img(e.i, 520, 650)} 520w, ${img(e.i, 780, 975)} 780w" sizes="(max-width: 900px) 40vw, 260px" width="520" height="650" alt="" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><figcaption>${e.mn || ''}</figcaption></figure>`).join('');
}
const count = $('[data-count]');
if (count) count.textContent = String(liveEvents().length);
const built = $('[data-built]');
if (built) built.textContent = BUILT;

const start = (location.hash || '').slice(1);
show(['match', 'worth', 'roi'].includes(start) ? start : 'match', memory);
startHeightReporter();
