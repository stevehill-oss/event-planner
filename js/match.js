// Occasion Matchmaker: start with the occasion, end on a shortlist of real, live events.
// The fit scores below are our editorial judgement, used only to order the shortlist.
// They are not facts about any venue or package.

import {
  liveEvents, interestOf, INTEREST, REGIONS, eventDateText, shortDate, imgTag, img, esc, eventUrl, ctaLabel,
  LINK_TARGET, plural, wireBriefLinks, track, scrollToEl, todayIso, $, $$, categoryUrl,
  contactUrl, copyText, toast, PHONE,
} from './core.js';
import { icon } from './icons.js';

export const OCCASIONS = [
  { id: 'clients', label: 'Entertain clients', phrase: 'entertaining clients', sub: 'Win new business or thank a loyal client', icon: 'briefcase', corporate: true },
  { id: 'team', label: 'Reward the team', phrase: 'rewarding your team', sub: 'Say thank you for a big year', icon: 'trophy', corporate: true },
  { id: 'milestone', label: 'Mark a milestone', phrase: 'marking a milestone', sub: 'A big birthday, anniversary or retirement', icon: 'cake' },
  { id: 'treat', label: 'Treat someone special', phrase: 'treating someone special', sub: 'A gift they will never forget', icon: 'heart' },
  { id: 'friends', label: 'A big day out with friends', phrase: 'a big day out with friends', sub: 'Good company, great seats, no queues', icon: 'glass' },
  { id: 'family', label: 'A family occasion', phrase: 'a family occasion', sub: 'Something every generation enjoys', icon: 'users' },
];
const GROUPS = [
  { id: '2', label: 'Two of us', min: 2, max: 2 },
  { id: '3-6', label: '3 to 6', min: 3, max: 6 },
  { id: '7-12', label: '7 to 12', min: 7, max: 12 },
  { id: '13-30', label: '13 to 30', min: 13, max: 30 },
  { id: '30+', label: 'More than 30', min: 31, max: 60 },
];
const FEELS = [
  { id: 'electric', label: 'Electric', sub: 'A big crowd and real noise', pick: ['oasis-live-27-etihad', 'fall-out-boy', 'u2-london'] },
  { id: 'relaxed', label: 'Relaxed', sub: 'A long lunch and time to talk', pick: ['ashes-2027', 'henley-royal-regatta', 'british-champions-day'] },
  { id: 'glamour', label: 'Glamorous', sub: 'Dress up for a proper occasion', pick: ['royal-ascot', 'london-fashion-week', 'cheltenham-festival-ladies'] },
  { id: 'bucket', label: 'Bucket list', sub: 'A trip they will talk about for years', pick: ['monaco-gp', 'italian-grand-prix', 'roland-garros'] },
];
const INTEREST_PICK = {
  sport: ['nations-championship', 'ireland-v-england', 'tyson-fury'],
  racing: ['cheltenham-gold-cup', 'royal-ascot', 'grand-national'],
  motor: ['monaco-gp', 'goodwood-festival-of-speed', 'italian-grand-prix'],
  music: ['u2-london', 'oasis-live-27', 'karol-g'],
  culture: ['london-fashion-week', 'the-fashion-awards', 'derren-brown'],
};
const MUSTS = [
  { id: 'private', label: 'Our own private space', tip: 'Ask about a private box or suite, so the group has its own space all day.' },
  { id: 'dining', label: 'Proper sit-down dining', tip: 'Ask for a package with a seated meal rather than lounge food.' },
  { id: 'seats', label: 'Seats close to the action', tip: 'Ask which packages put you nearest the action, and compare the views.' },
  { id: 'talk', label: 'Time to talk', tip: 'Ask when the hospitality opens and closes, so there is time to talk before and after.' },
  { id: 'easy', label: 'Easy to get to', tip: 'Ask about parking, transfers or the simplest route in for your group.' },
];

// 0 to 3 fit by main category: occasions, then feel.
const FIT = {
  football: [3, 3, 2, 2, 3, 2, 3, 0, 0, 1], rugby: [3, 3, 2, 1, 3, 2, 3, 1, 0, 2],
  'american-football': [2, 3, 3, 2, 3, 2, 3, 0, 0, 2], basketball: [2, 3, 2, 2, 3, 3, 3, 0, 0, 1],
  boxing: [2, 2, 2, 1, 3, 0, 3, 0, 1, 2], darts: [1, 3, 2, 1, 3, 0, 3, 0, 0, 1],
  cricket: [3, 2, 2, 2, 2, 2, 1, 3, 1, 1], tennis: [3, 1, 2, 3, 1, 1, 1, 2, 2, 2],
  cycling: [1, 1, 1, 1, 2, 3, 2, 1, 0, 2], 'sailing-and-boating': [3, 2, 2, 2, 2, 1, 0, 3, 3, 1],
  'horse-racing': [3, 3, 3, 3, 3, 1, 2, 2, 3, 1], 'formula-one': [3, 2, 3, 3, 2, 1, 3, 0, 2, 3],
  motorsport: [2, 2, 2, 2, 2, 2, 2, 1, 1, 1], 'car-show': [3, 2, 2, 2, 2, 3, 2, 2, 2, 2],
  'live-music': [2, 2, 3, 3, 3, 2, 3, 1, 1, 1], festivals: [1, 2, 2, 2, 3, 1, 3, 2, 0, 2],
  theatre: [2, 1, 3, 3, 2, 3, 0, 3, 2, 1], fashion: [3, 1, 2, 3, 2, 0, 1, 1, 3, 2],
};
const OCC_I = { clients: 0, team: 1, milestone: 2, treat: 3, friends: 4, family: 5 };
const FEEL_I = { electric: 6, relaxed: 7, glamour: 8, bucket: 9 };
// Events that lift a feel beyond their category.
const LIFT = [
  [/royal-ascot|cheltenham-festival-ladies|henley|goodwood-revival|fashion|royal-albert-hall|bocelli|monaco/, 'glamour'],
  [/bocelli|royal-albert-hall|leona-lewis|simply-red|deacon-blue/, 'relaxed'],
  [/oasis|u2-london|fury-vs-joshua|tyson-fury|cheltenham-gold-cup|royal-ascot|monaco|ashes|glastonbury|grand-national-festival|coachella|tour-de-france/, 'bucket'],
];

function fit(ev, occ, feel) {
  const row = FIT[ev.m] || [2, 2, 2, 2, 2, 2, 2, 1, 1, 1];
  let o = occ ? row[OCC_I[occ]] : 2;
  let f = feel ? row[FEEL_I[feel]] : 2;
  if (feel) {
    LIFT.forEach(([re, k]) => { if (k === feel && re.test(ev.s)) f = Math.min(3, f + 1); });
    if (feel === 'bucket' && ev.r === 'abroad') f = 3;
    if (feel === 'electric' && ev.m === 'live-music' && ev.o) f = 3;
  }
  if (occ === 'family' && /boxing|darts|slipknot|festival/.test(ev.m + ev.s)) o = Math.min(o, 1);
  return { o, f };
}

// Time windows: the rest of this quarter, then the next four quarters.
function windows() {
  const t = todayIso();
  const [y, m] = t.split('-').map(Number);
  const out = [];
  let q = Math.floor((m - 1) / 3); let yr = y;
  const names = ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec'];
  for (let i = 0; i < 5; i += 1) {
    const from = `${yr}-${String(q * 3 + 1).padStart(2, '0')}-01`;
    const toM = q * 3 + 3; const to = `${yr}-${String(toM).padStart(2, '0')}-31`;
    const endName = ['March', 'June', 'September', 'December'][q];
    out.push({ id: `${yr}q${q + 1}`, label: i === 0 ? `Between now and ${endName}` : `${names[q]} ${yr}`, from: i === 0 ? t : from, to });
    q += 1; if (q > 3) { q = 0; yr += 1; }
  }
  return out;
}
const inWindow = (ev, w) => ev.d <= w.to && (ev.e || ev.d) >= w.from;

const STEPS = ['occasion', 'group', 'interest', 'feel', 'when', 'where', 'must'];
const STEP_Q = {
  occasion: ['What is the occasion?', 'Start with why. We will find the events that suit it.'],
  group: ['How many people are going?', 'Include yourself and any hosts.'],
  interest: ['What would they love most?', 'Pick one or two.'],
  feel: ['How should the day feel?', 'Pick the one that sounds most like it.'],
  when: ['When would suit?', 'Pick any that work. The numbers show live events in each window.'],
  where: ['Where would suit?', 'Pick any that work. The numbers show live events in each area.'],
  must: ['What has to be right on the day?', 'Pick up to two. We will tell you what to ask for.'],
};
const MULTI = { interest: 2, when: 5, where: 7, must: 2 };

export function createMatch(root, ctx) {
  const st = { step: 0, occasion: null, group: null, interest: [], feel: null, when: [], where: [], must: [], done: false };

  function poolFor(skip) {
    const wins = windows();
    return liveEvents().filter((ev) => {
      if (skip !== 'interest' && st.interest.length && !st.interest.includes(interestOf(ev))) return false;
      if (skip !== 'when' && st.when.length && !st.when.some((id) => inWindow(ev, wins.find((w) => w.id === id)))) return false;
      if (skip !== 'where' && st.where.length && !st.where.includes(ev.r)) return false;
      return true;
    });
  }
  const pick = (patterns, pool) => {
    for (const p of patterns) { const hit = pool.find((e) => e.s.includes(p)); if (hit) return hit; }
    return pool[0] || null;
  };

  function optionsFor(step) {
    const all = liveEvents();
    switch (step) {
      case 'occasion': return OCCASIONS.map((o) => ({ id: o.id, label: o.label, sub: o.sub, icon: o.icon }));
      case 'group': return GROUPS.map((g) => ({ id: g.id, label: g.label, sub: g.id === '30+' ? 'Ask about exclusive areas' : g.min >= 13 ? 'Boxes and reserved areas' : '' }));
      case 'interest': return Object.entries(INTEREST).map(([id, v]) => {
        const pool = all.filter((e) => interestOf(e) === id);
        return { id, label: v.label, sub: plural(pool.length, 'live event'), ev: pick(INTEREST_PICK[id], pool), disabled: !pool.length };
      });
      case 'feel': return FEELS.map((f) => ({ id: f.id, label: f.label, sub: f.sub, ev: pick(f.pick, all) }));
      case 'when': {
        const pool = poolFor('when');
        return windows().map((w) => { const n = pool.filter((e) => inWindow(e, w)).length; return { id: w.id, label: w.label, sub: plural(n, 'event'), disabled: !n }; });
      }
      case 'where': {
        const pool = poolFor('where');
        return REGIONS.map((r) => { const n = pool.filter((e) => e.r === r.id).length; return { id: r.id, label: r.label, sub: plural(n, 'event'), disabled: !n }; });
      }
      case 'must': return MUSTS.map((m) => ({ id: m.id, label: m.label }));
      default: return [];
    }
  }

  function valueOf(step) { return MULTI[step] ? st[step] : st[step] ? [st[step]] : []; }

  function renderStep() {
    const step = STEPS[st.step];
    const [q, hint] = STEP_Q[step];
    const opts = optionsFor(step);
    const chosen = valueOf(step);
    const multi = MULTI[step];
    const hasImages = opts.some((o) => o.ev);
    const anyLabel = step === 'when' ? 'Any time' : step === 'where' ? 'Anywhere' : null;
    root.innerHTML = `
      <div class="wiz" data-step="${step}">
        <div class="wiz__top">
          <div class="wiz__progress" role="progressbar" aria-label="Question ${st.step + 1} of ${STEPS.length}" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${st.step + 1}">
            ${STEPS.map((_, i) => `<span class="${i < st.step ? 'is-done' : i === st.step ? 'is-now' : ''}"></span>`).join('')}
          </div>
          <p class="wiz__count">Question ${st.step + 1} of ${STEPS.length}</p>
        </div>
        <fieldset class="wiz__q">
          <legend><span class="wiz__title" tabindex="-1">${q}</span><span class="wiz__hint">${hint}</span></legend>
          <div class="opts ${hasImages ? 'opts--img' : ''} opts--${step}">
            ${opts.map((o) => `
              <button type="button" class="opt ${o.ev ? 'opt--img' : ''} ${chosen.includes(o.id) ? 'is-on' : ''}" data-id="${o.id}" aria-pressed="${chosen.includes(o.id)}" ${o.disabled ? 'disabled' : ''}>
                ${o.ev ? `<span class="opt__img">${imgTag(o.ev, { w: 420, ratio: 4 / 3, sizes: '(max-width: 700px) 50vw, 300px' })}</span>` : ''}
                ${o.icon ? `<span class="opt__icon">${icon(o.icon)}</span>` : ''}
                <span class="opt__text"><span class="opt__label">${esc(o.label)}</span>${o.sub ? `<span class="opt__sub">${esc(o.sub)}</span>` : ''}</span>
                <span class="opt__tick">${icon('check')}</span>
              </button>`).join('')}
            ${anyLabel ? `<button type="button" class="opt opt--any ${chosen.length === 0 && st.visited?.[step] ? 'is-on' : ''}" data-any="1" aria-pressed="${chosen.length === 0 && !!st.visited?.[step]}"><span class="opt__text"><span class="opt__label">${anyLabel}</span><span class="opt__sub">Show me everything</span></span><span class="opt__tick">${icon('check')}</span></button>` : ''}
          </div>
        </fieldset>
        <div class="wiz__nav">
          ${st.step > 0 ? `<button type="button" class="btn btn--ghost" data-back>${icon('back')} Back</button>` : '<span></span>'}
          ${multi || step === 'must' ? `<button type="button" class="btn btn--gold" data-next>${st.step === STEPS.length - 1 ? 'Show my matches' : 'Next'} ${icon('arrow')}</button>` : ''}
        </div>
      </div>`;

    $$('.opt[data-id]', root).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.id;
      if (multi) {
        const arr = st[step];
        const i = arr.indexOf(id);
        if (i >= 0) arr.splice(i, 1);
        else { if (arr.length >= multi) arr.shift(); arr.push(id); }
        st.visited = { ...st.visited, [step]: true };
        renderStep();
        $(`.opt[data-id="${id}"]`, root)?.focus();
      } else {
        st[step] = id;
        renderStep();
        setTimeout(() => next(), 180);
      }
    }));
    $('[data-any]', root)?.addEventListener('click', () => { st[step] = []; st.visited = { ...st.visited, [step]: true }; next(); });
    $('[data-back]', root)?.addEventListener('click', () => { st.step -= 1; renderStep(); focusTitle(); });
    $('[data-next]', root)?.addEventListener('click', () => next());
  }

  function focusTitle() { const t = $('.wiz__title', root); t?.focus({ preventScroll: true }); }

  function next() {
    // One event per answered question, so drop-off between questions can be measured.
    const answered = STEPS[st.step];
    track('planner_match_step', { step: answered, n: st.step + 1, answer: valueOf(answered).join(',') || 'any' });
    if (st.step < STEPS.length - 1) { st.step += 1; renderStep(); focusTitle(); scrollToEl(root); return; }
    st.done = true;
    track('planner_match_complete', { occasion: st.occasion || '', interest: st.interest.join(','), feel: st.feel || '' });
    renderResults();
    scrollToEl(root);
  }

  /* ---------- results ---------- */

  function scoreAll(pool) {
    const g = GROUPS.find((x) => x.id === st.group);
    const soon = new Date(); soon.setMonth(soon.getMonth() + 4);
    const soonIso = soon.toISOString().slice(0, 10);
    return pool.map((ev) => {
      const { o, f } = fit(ev, st.occasion, st.feel);
      let s = o * 9 + f * 8;
      if (st.interest.length && st.interest.includes(interestOf(ev))) s += 12;
      if (g && g.min >= 13 && (ev.o || ['horse-racing', 'football', 'rugby', 'cricket'].includes(ev.m))) s += 4;
      if (g && g.min >= 13 && ['theatre', 'fashion'].includes(ev.m)) s -= 6;
      if (st.must.includes('talk') && ['festivals', 'darts'].includes(ev.m)) s -= 5;
      if (st.must.includes('easy') && ev.r === 'abroad') s -= 6;
      if (ev.d <= soonIso) s += 2;
      return { ev, s, o, f };
    }).sort((a, b) => b.s - a.s || a.ev.d.localeCompare(b.ev.d));
  }

  // One card per tour or series, showing its soonest date; others become date chips.
  function grouped(scored) {
    const map = new Map();
    for (const x of scored) {
      const first = x.ev.t.split(/[\s:,]/)[0].toLowerCase();
      const key = x.ev.g ? `${x.ev.g}|${first}` : x.ev.s;
      if (!map.has(key)) map.set(key, { ...x, more: [] });
      else map.get(key).more.push(x.ev);
    }
    const list = [...map.values()];
    list.forEach((c) => {
      const all = [c.ev, ...c.more].sort((a, b) => a.d.localeCompare(b.d));
      c.ev = all[0]; c.more = all.slice(1);
    });
    const perSeries = {};
    return list.filter((c) => { const k = c.ev.g || c.ev.s; perSeries[k] = (perSeries[k] || 0) + 1; return perSeries[k] <= 2; });
  }

  function reasons(c) {
    const r = [];
    const occ = OCCASIONS.find((x) => x.id === st.occasion);
    const occText = {
      clients: 'A natural fit for client entertaining, with time to talk around the action',
      team: 'A shared day the whole team can enjoy together',
      milestone: 'Big enough to make a milestone feel like one',
      treat: 'A treat that feels like a real occasion',
      friends: 'Made for a big day out with friends',
      family: 'Works well for a family group',
    };
    const feelText = {
      electric: 'A big crowd and real noise, just as you asked',
      relaxed: 'A relaxed pace, with time to eat and talk',
      glamour: 'A dress-up occasion with a sense of style',
      bucket: c.ev.r === 'abroad' ? 'A trip abroad they will talk about for years' : 'A bucket-list date in the calendar',
    };
    if (occ && c.o >= 3) r.push(occText[occ.id]);
    if (st.feel && c.f >= 3) r.push(feelText[st.feel]);
    if (st.interest.length && st.interest.includes(interestOf(c.ev))) r.push(`${INTEREST[interestOf(c.ev)].label}, one of your picks`);
    if (c.more.length) r.push(`${plural(c.more.length + 1, 'date')} to choose from`);
    if (!r.length) r.push(occ ? `A good option for ${occ.label.toLowerCase()}` : 'A strong all-round choice');
    return r.slice(0, 3);
  }

  function cardHtml(c, i, lead) {
    const ev = c.ev;
    const where = [ev.v, ev.c].filter(Boolean).filter((x, k, a) => !(k === 1 && a[0].includes(x))).join(', ');
    const corporate = OCCASIONS.find((o) => o.id === st.occasion)?.corporate;
    return `
      <article class="ev ${lead ? 'ev--lead' : ''}" style="--i:${i}">
        <div class="ev__media">
          ${imgTag(ev, { w: lead ? 960 : 520, ratio: 16 / 9, sizes: lead ? '(max-width: 900px) 100vw, 760px' : '(max-width: 700px) 100vw, 400px', eager: lead })}
          ${lead ? '<span class="ev__badge">Your top match</span>' : `<span class="ev__rank">${i + 1}</span>`}
        </div>
        <div class="ev__body">
          <p class="ev__kicker">${esc(ev.mn || INTEREST[interestOf(ev)].label)}</p>
          <h3 class="ev__title">${esc(ev.t)}</h3>
          <p class="ev__meta"><span>${icon('calendar')} ${esc(eventDateText(ev))}</span>${where ? `<span>${icon('pin')} ${esc(where)}</span>` : ''}</p>
          <ul class="ev__why">${reasons(c).map((x) => `<li>${icon('check')} ${esc(x)}</li>`).join('')}</ul>
          ${c.more.length ? `<div class="ev__dates"><span>Other dates:</span>${c.more.slice(0, 6).map((m) => `<a href="${eventUrl(m, 'occasion-matchmaker')}" target="${LINK_TARGET}" data-brief-link="${m.s}" data-tool="match">${esc(shortDate(m.d))}${m.c && m.c !== ev.c ? `, ${esc(m.c)}` : ''}</a>`).join('')}${c.more.length > 6 ? `<span>and ${c.more.length - 6} more</span>` : ''}</div>` : ''}
          <div class="ev__actions">
            <a class="btn btn--gold" href="${eventUrl(ev, 'occasion-matchmaker')}" target="${LINK_TARGET}" data-brief-link="${ev.s}" data-tool="match">${ctaLabel(ev)} ${icon('arrow')}</a>
            <button type="button" class="btn btn--line" data-worth="${ev.s}">${icon('scale')} Is it worth it?</button>
            ${corporate ? `<button type="button" class="btn btn--line" data-roi="${ev.s}">${icon('chart')} Business case</button>` : ''}
          </div>
        </div>
      </article>`;
  }

  function summaryChips() {
    const chip = (step, text) => `<button type="button" class="chip" data-edit="${STEPS.indexOf(step)}">${esc(text)} ${icon('edit')}</button>`;
    const wins = windows();
    const out = [];
    if (st.occasion) out.push(chip('occasion', OCCASIONS.find((o) => o.id === st.occasion).label));
    if (st.group) out.push(chip('group', `${GROUPS.find((g) => g.id === st.group).label} people`.replace('Two of us people', 'Two of us')));
    out.push(chip('interest', st.interest.length ? st.interest.map((i) => INTEREST[i].label).join(' or ') : 'Any interest'));
    if (st.feel) out.push(chip('feel', FEELS.find((f) => f.id === st.feel).label));
    out.push(chip('when', st.when.length ? st.when.map((w) => wins.find((x) => x.id === w)?.label).filter(Boolean).join(', ') : 'Any time'));
    out.push(chip('where', st.where.length ? st.where.map((w) => REGIONS.find((r) => r.id === w).label).join(', ') : 'Anywhere'));
    return out.join('');
  }

  function renderResults() {
    let pool = poolFor();
    let relaxed = null;
    if (pool.length < 3 && st.when.length) { pool = poolFor('when'); relaxed = 'We widened the dates to find enough good matches.'; }
    if (pool.length < 3 && st.where.length) { pool = liveEvents().filter((e) => !st.interest.length || st.interest.includes(interestOf(e))); relaxed = 'We widened the dates and the area to find enough good matches.'; }
    const cards = grouped(scoreAll(pool));
    const top = cards.slice(0, 7);
    const occ = OCCASIONS.find((o) => o.id === st.occasion);
    const tips = st.must.map((m) => MUSTS.find((x) => x.id === m).tip);
    const g = GROUPS.find((x) => x.id === st.group);
    if (g && g.min >= 13) tips.push(`With ${g.label.toLowerCase()} guests, ask about a private box or a reserved area so everyone stays together.`);
    if (occ?.id === 'clients') tips.push('Ask for guest names on the day and dietary needs to be collected in advance, so your clients feel looked after.');
    ctx.remember({ event: top[0]?.ev.s, guests: g ? g.min : null, occasion: st.occasion });

    root.innerHTML = `
      <div class="res">
        <header class="res__head">
          <p class="eyebrow">Your shortlist</p>
          <h2 class="res__title" tabindex="-1">${top.length ? `${top.length === 1 ? 'One event' : `${top.length} events`} for ${occ ? esc(occ.phrase) : 'your occasion'}` : 'Nothing matches all of that yet'}</h2>
          <div class="chips">${summaryChips()}</div>
          ${relaxed ? `<p class="note">${icon('info')} ${relaxed}</p>` : ''}
        </header>
        ${top.length ? `
          <div class="evs">${top.map((c, i) => cardHtml(c, i, i === 0)).join('')}</div>
          ${tips.length ? `<aside class="tips"><h3>${icon('sparkle')} What to ask for when you enquire</h3><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></aside>` : ''}
        ` : `<p class="lede">New events are added every week. Tell us what you have in mind and our team will suggest options.</p>`}
        <aside class="help">
          <div class="help__copy">
            <h3>${top.length ? 'Not sure which to pick?' : 'Let our team find it for you'}</h3>
            <p>${top.length ? 'Send us your answers and we will suggest the best fit, with the packages that suit your group.' : 'Send us your answers and we will come back with options that fit, including dates not listed yet.'}</p>
          </div>
          <div class="help__acts">
            <a class="btn btn--gold" href="${contactUrl('occasion-matchmaker')}" target="${LINK_TARGET}" data-brief-link="" data-tool="match">Ask our team for options ${icon('arrow')}</a>
            <a class="btn btn--ghost-ink" href="${PHONE.href}">${icon('phone')} ${PHONE.text}</a>
            ${top.length ? `<button type="button" class="btn btn--ghost-ink" data-share>${icon('copy')} Copy shortlist to share</button>` : ''}
          </div>
        </aside>
        <div class="res__foot">
          <button type="button" class="btn btn--ghost" data-restart>${icon('refresh')} Start again</button>
          ${top[0] ? `<a class="btn btn--line" href="${categoryUrl(top[0].ev, 'occasion-matchmaker')}" target="${LINK_TARGET}">See more ${esc((top[0].ev.mn || '').toLowerCase())} events ${icon('arrow')}</a>` : ''}
        </div>
      </div>`;

    $$('[data-edit]', root).forEach((b) => b.addEventListener('click', () => { st.step = Number(b.dataset.edit); st.done = false; renderStep(); focusTitle(); }));
    $('[data-restart]', root).addEventListener('click', () => { Object.assign(st, { step: 0, occasion: null, group: null, interest: [], feel: null, when: [], where: [], must: [], done: false, visited: {} }); renderStep(); focusTitle(); });
    $$('[data-worth]', root).forEach((b) => b.addEventListener('click', () => ctx.go('worth', { event: b.dataset.worth, guests: g ? g.min : null, occasion: st.occasion })));
    $$('[data-roi]', root).forEach((b) => b.addEventListener('click', () => ctx.go('roi', { event: b.dataset.roi, guests: g ? g.min : null, occasion: st.occasion })));
    wireBriefLinks(root, (slug) => brief(slug));
    $('[data-share]', root)?.addEventListener('click', async () => {
      const ok = await copyText(shortlistText(top, occ, g));
      toast(ok ? 'Shortlist copied. Paste it into an email or chat.' : 'Copy did not work in this browser.');
      track('planner_match_share', { occasion: st.occasion || '', count: top.length });
    });
    $('.res__title', root)?.focus({ preventScroll: true });
  }

  // A plain-text shortlist to send to a colleague or decision maker. Links go to our event pages.
  function shortlistText(top, occ, g) {
    const head = `Hospitality shortlist${occ ? ` for ${occ.phrase}` : ''}${g ? ` (${g.label === 'Two of us' ? '2' : g.label} people)` : ''}`;
    const items = top.map((c, i) => {
      const where = [c.ev.v, c.ev.c].filter(Boolean).filter((x, k, a) => !(k === 1 && a[0].includes(x))).join(', ');
      return `${i + 1}. ${c.ev.t}, ${eventDateText(c.ev)}${where ? `, ${where}` : ''}\n   ${eventUrl(c.ev, 'occasion-matchmaker-share')}`;
    });
    return [head, '', ...items, '', `From Prestige Corporate Events. Call ${PHONE.text} to check packages.`].join('\n');
  }

  function brief(slug) {
    const ev = slug ? liveEvents().find((e) => e.s === slug) : null;
    const occ = OCCASIONS.find((o) => o.id === st.occasion);
    const g = GROUPS.find((x) => x.id === st.group);
    const feel = FEELS.find((f) => f.id === st.feel);
    const wins = windows();
    const lines = [
      ev ? `Hello, I used your hospitality planner and I am interested in ${ev.t} (${eventDateText(ev)}).`
        : 'Hello, I used your hospitality planner and would like some suggestions.',
      occ ? `Occasion: ${occ.label}.` : '',
      g ? `Group size: ${g.label === 'Two of us' ? '2' : g.label} people.` : '',
      !ev && st.interest.length ? `Interested in: ${st.interest.map((i) => INTEREST[i].label.toLowerCase()).join(' or ')}.` : '',
      feel ? `The day should feel: ${feel.label.toLowerCase()} (${feel.sub.toLowerCase()}).` : '',
      !ev && st.when.length ? `Timing: ${st.when.map((w) => wins.find((x) => x.id === w)?.label).filter(Boolean).join(', ')}.` : '',
      !ev && st.where.length ? `Area: ${st.where.map((w) => REGIONS.find((r) => r.id === w).label).join(', ')}.` : '',
      st.must.length ? `What matters most: ${st.must.map((m) => MUSTS.find((x) => x.id === m).label.toLowerCase()).join(' and ')}.` : '',
      'Please send me the hospitality options.',
    ];
    return lines.filter(Boolean).join('\n');
  }

  return {
    show() { if (!root.innerHTML) renderStep(); },
    reset() { root.innerHTML = ''; },
    preload(img0) { return img0; },
  };
}

// Images for the hero collage: one striking event from each interest.
export function heroEvents() {
  const all = liveEvents();
  return Object.keys(INTEREST_PICK).map((k) => {
    const pool = all.filter((e) => interestOf(e) === k);
    for (const p of INTEREST_PICK[k]) { const hit = pool.find((e) => e.s.includes(p)); if (hit) return hit; }
    return pool[0];
  }).filter(Boolean);
}
export { img };
