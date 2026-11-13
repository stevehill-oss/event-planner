// Is Hospitality Worth It? Compares doing the day yourself with having it all taken care of.
// Every money figure comes from the visitor. Nothing is pre-filled and we show no prices.
//
// Maths (per person unless stated):
//   diy      = ticket + food and drink + travel + extras
//   ceiling  = diy + what the visitor would pay on top to have the ticked things sorted
//   group    = per person x guests
//   With a quote: worth it when quote <= ceiling; close call when quote <= ceiling x 1.15.

import {
  liveEvents, eventBySlug, interestOf, INTEREST, eventDateText, esc, num, gbp, plural, eventUrl, ctaLabel,
  LINK_TARGET, wireBriefLinks, track, $, $$, contactUrl, imgTag, peek, PHONE,
} from './core.js';
import { icon } from './icons.js';

const COSTS = [
  { id: 'ticket', label: 'Your ticket', hint: 'The seat you would realistically buy' },
  { id: 'food', label: 'Food and drink', hint: 'Before, during and after' },
  { id: 'travel', label: 'Travel and parking', hint: 'Including a taxi home' },
  { id: 'extras', label: 'Anything else', hint: 'Programme, cloakroom, a hotel' },
];
const SORTED = [
  { id: 'seats', label: 'Guaranteed seats together' },
  { id: 'dining', label: 'A sit-down meal' },
  { id: 'drinks', label: 'Drinks taken care of' },
  { id: 'space', label: 'A calmer space of your own' },
  { id: 'queues', label: 'No queues for food or bars' },
  { id: 'host', label: 'Someone looking after you' },
  { id: 'impress', label: 'A day that feels special' },
];
const WHO = [
  { id: 'clients', label: 'Clients' },
  { id: 'team', label: 'My team' },
  { id: 'personal', label: 'Personal' },
];

export function eventOptions(selected) {
  const by = {};
  liveEvents().forEach((e) => { const k = interestOf(e); (by[k] = by[k] || []).push(e); });
  return `<option value="">Not decided yet</option>` + Object.entries(INTEREST).filter(([k]) => by[k]).map(([k, v]) =>
    `<optgroup label="${esc(v.label)}">${by[k].map((e) => `<option value="${e.s}" ${e.s === selected ? 'selected' : ''}>${esc(e.t)}, ${esc(eventDateText(e).replace(/^\w+day /, ''))}</option>`).join('')}</optgroup>`).join('');
}

export function createWorth(root, ctx) {
  const st = { event: '', guests: 2, who: '', costs: {}, sorted: [], premium: '', quote: '' };

  function render() {
    root.innerHTML = `
      <div class="calc">
        <form class="calc__form" novalidate>
          <section class="blk">
            <h3 class="blk__h"><span>1</span> The day you have in mind</h3>
            <label class="fld"><span class="fld__l">Event</span>
              <select name="event">${eventOptions(st.event)}</select>
            </label>
            <div class="fld"><span class="fld__l" id="w-g">Guests, including you</span>
                <div class="step" role="group" aria-labelledby="w-g">
                  <button type="button" data-g="-1" aria-label="One fewer guest">${icon('minus')}</button>
                  <input name="guests" inputmode="numeric" value="${st.guests}" aria-labelledby="w-g">
                  <button type="button" data-g="1" aria-label="One more guest">${icon('plus')}</button>
                </div>
              </div>
              <div class="fld"><span class="fld__l" id="w-w">Who is it for?</span>
                <div class="seg" role="radiogroup" aria-labelledby="w-w">
                  ${WHO.map((w) => `<button type="button" role="radio" aria-checked="${st.who === w.id}" data-who="${w.id}">${w.label}</button>`).join('')}
                </div>
              </div>
          </section>

          <section class="blk">
            <h3 class="blk__h"><span>2</span> Doing it yourself, per person</h3>
            <p class="blk__p">Your own rough figures. Leave out anything that does not apply.</p>
            <div class="money-grid">
              ${COSTS.map((c) => `
                <label class="fld fld--money"><span class="fld__l">${c.label}</span>
                  <span class="money"><span>£</span><input name="c-${c.id}" inputmode="decimal" autocomplete="off" value="${esc(st.costs[c.id] ?? '')}" placeholder="0"></span>
                  <span class="fld__h">${c.hint}</span>
                </label>`).join('')}
            </div>
          </section>

          <section class="blk">
            <h3 class="blk__h"><span>3</span> What would you want taken care of?</h3>
            <div class="ticks">
              ${SORTED.map((s) => `<button type="button" class="tick ${st.sorted.includes(s.id) ? 'is-on' : ''}" aria-pressed="${st.sorted.includes(s.id)}" data-s="${s.id}">${icon('check')} ${s.label}</button>`).join('')}
            </div>
            <label class="fld fld--money fld--wide"><span class="fld__l">On top of your costs, what would you happily pay per person to have that sorted?</span>
              <span class="money"><span>£</span><input name="premium" inputmode="decimal" autocomplete="off" value="${esc(st.premium)}" placeholder="0"></span>
              <span class="fld__h">Think about what a smoother, more memorable day is worth to you. Leave it blank to compare costs only.</span>
            </label>
          </section>

          <section class="blk blk--soft">
            <h3 class="blk__h"><span>4</span> Already have a price? <em>Optional</em></h3>
            <label class="fld fld--money"><span class="fld__l">Hospitality price per person</span>
              <span class="money"><span>£</span><input name="quote" inputmode="decimal" autocomplete="off" value="${esc(st.quote)}" placeholder="0"></span>
              <span class="fld__h">From a quote, or a figure you have seen.</span>
            </label>
          </section>
        </form>
        <div class="calc__out" aria-live="polite"></div>
      </div>`;
    wire();
    update();
  }

  function wire() {
    const f = $('form', root);
    f.addEventListener('submit', (e) => e.preventDefault());
    f.addEventListener('input', (e) => {
      const n = e.target.name;
      if (n === 'event') st.event = e.target.value;
      else if (n === 'guests') st.guests = Math.max(1, Math.min(200, Math.round(num(e.target.value) || 1)));
      else if (n.startsWith('c-')) st.costs[n.slice(2)] = e.target.value;
      else if (n === 'premium' || n === 'quote') st[n] = e.target.value;
      markInvalid(e.target);
      update();
    });
    f.addEventListener('change', (e) => { if (e.target.name === 'guests') e.target.value = st.guests; if (e.target.name === 'event') update(); });
    $$('[data-g]', root).forEach((b) => b.addEventListener('click', () => {
      st.guests = Math.max(1, Math.min(200, st.guests + Number(b.dataset.g)));
      $('[name=guests]', root).value = st.guests; update();
    }));
    $$('[data-who]', root).forEach((b) => b.addEventListener('click', () => {
      st.who = b.dataset.who;
      $$('[data-who]', root).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      update();
    }));
    $$('[data-s]', root).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.s; const i = st.sorted.indexOf(id);
      if (i >= 0) st.sorted.splice(i, 1); else st.sorted.push(id);
      b.classList.toggle('is-on', i < 0); b.setAttribute('aria-pressed', String(i < 0));
      update();
    }));
  }

  function markInvalid(input) {
    if (input.inputMode !== 'decimal') return;
    const bad = input.value.trim() !== '' && num(input.value) === null;
    input.setAttribute('aria-invalid', String(bad));
  }

  function calc() {
    const diy = COSTS.reduce((s, c) => s + (num(st.costs[c.id]) || 0), 0);
    const premium = num(st.premium) || 0;
    const quote = num(st.quote);
    const ceiling = diy + premium;
    let verdict = null;
    if (quote && ceiling > 0) verdict = quote <= ceiling ? 'yes' : quote <= ceiling * 1.15 ? 'close' : 'no';
    return { diy, premium, quote, ceiling, verdict, g: st.guests };
  }

  function update() {
    const out = $('.calc__out', root);
    const r = calc();
    const ev = st.event ? eventBySlug(st.event) : null;
    ctx.remember({ event: st.event || undefined, guests: st.guests });
    peek($('.calc', root), r.ceiling > 0 ? (r.verdict ? `${{ yes: 'Worth it to you', close: 'A close call', no: 'Above your figure' }[r.verdict]}: worth up to ${gbp(r.ceiling)} a head` : `Worth up to ${gbp(r.ceiling)} a head to you`) : '');
    if (r.ceiling <= 0) {
      out.innerHTML = `
        <div class="out out--empty">
          ${ev ? `<div class="out__ev">${imgTag(ev, { w: 480, ratio: 16 / 9, sizes: '400px' })}<div><p class="eyebrow">${esc(ev.mn || '')}</p><p class="out__evt">${esc(ev.t)}</p><p class="out__evd">${esc(eventDateText(ev))}</p></div></div>` : ''}
          <p class="out__big">Your answer appears here</p>
          <p>Add what the day would cost you to do yourself. We will show the most hospitality is worth to you, per person and for the group.</p>
          <ul class="out__steps"><li>${icon('check')} No sign-up, nothing is sent</li><li>${icon('check')} Your own figures, never ours</li><li>${icon('check')} Takes about a minute</li></ul>
        </div>`;
      return;
    }
    const verdictText = {
      yes: ['Worth it to you', `At ${gbp(r.quote, { pence: true })} a head, hospitality comes in ${gbp(r.ceiling - r.quote, { pence: true })} under what the day is worth to you.`],
      close: ['A close call', `At ${gbp(r.quote, { pence: true })} a head it is ${gbp(r.quote - r.ceiling, { pence: true })} over your figure. A different package or date could close the gap.`],
      no: ['Above your figure today', `At ${gbp(r.quote, { pence: true })} a head it is ${gbp(r.quote - r.ceiling, { pence: true })} over what the day is worth to you. Ask about other packages or dates.`],
    };
    const max = Math.max(r.ceiling, r.quote || 0) * 1.08;
    const pct = (v) => `${Math.max(0, Math.min(100, (v / max) * 100)).toFixed(1)}%`;
    const sortedNames = st.sorted.map((id) => SORTED.find((s) => s.id === id).label.toLowerCase());
    const evLabel = ev ? esc(ev.t) : 'your event';

    out.innerHTML = `
      <div class="out ${r.verdict ? `out--${r.verdict}` : ''}">
        ${ev ? `<div class="out__ev">${imgTag(ev, { w: 480, ratio: 16 / 9, sizes: '400px' })}<div><p class="eyebrow">${esc(ev.mn || '')}</p><p class="out__evt">${esc(ev.t)}</p><p class="out__evd">${esc(eventDateText(ev))}</p></div></div>` : ''}
        <p class="eyebrow">${r.verdict ? verdictText[r.verdict][0] : 'Your hospitality ceiling'}</p>
        <p class="out__big">${r.premium > 0 ? `Worth up to <strong>${gbp(r.ceiling, { pence: true })}</strong> a head to you` : `Your day costs <strong>${gbp(r.diy, { pence: true })}</strong> a head`}</p>
        <p class="out__sub">${r.g > 1 ? `${gbp(r.ceiling * r.g, { pence: true })} for your group of ${r.g}.` : 'For one person.'} ${r.verdict ? verdictText[r.verdict][1] : r.premium > 0 ? 'Any hospitality package at or under this figure is good value on your own numbers.' : 'Add what you would pay to have the day taken care of, and see your real ceiling.'}</p>

        <div class="bars" role="img" aria-label="Do it yourself ${gbp(r.diy)} per person. Worth to you ${gbp(r.ceiling)} per person.${r.quote ? ` Price ${gbp(r.quote)} per person.` : ''}">
          <div class="bar"><span class="bar__l">Doing it yourself</span><span class="bar__t"><span class="bar__f bar__f--diy" style="width:${pct(r.diy)}"></span></span><span class="bar__v">${gbp(r.diy, { pence: true })}</span></div>
          <div class="bar"><span class="bar__l">Worth to you</span><span class="bar__t"><span class="bar__f bar__f--diy" style="width:${pct(r.diy)}"></span><span class="bar__f bar__f--extra" style="width:${pct(r.premium)}"></span></span><span class="bar__v">${gbp(r.ceiling, { pence: true })}</span></div>
          ${r.quote ? `<div class="bar"><span class="bar__l">Hospitality price</span><span class="bar__t"><span class="bar__f bar__f--quote" style="width:${pct(r.quote)}"></span></span><span class="bar__v">${gbp(r.quote, { pence: true })}</span></div>` : ''}
        </div>

        ${sortedNames.length ? `<p class="out__list"><strong>When you enquire, check the package includes:</strong> ${esc(sortedNames.join(', '))}.</p>` : ''}

        <div class="out__cta">
          ${ev ? `<a class="btn btn--gold btn--block" href="${eventUrl(ev, 'hospitality-worth-it')}" target="${LINK_TARGET}" data-brief-link="${ev.s}" data-tool="worth">${r.verdict === 'yes' ? ctaLabel(ev) : `Ask for options within ${gbp(r.ceiling)} a head`} ${icon('arrow')}</a>
            <p class="out__fine">We copy your brief, ready to paste into the form on the ${evLabel} page. Or call <a href="${PHONE.href}">${PHONE.text}</a>.</p>`
            : `<button type="button" class="btn btn--gold btn--block" data-tomatch>${icon('compass')} Find an event that fits</button>
               <a class="btn btn--line btn--block" href="${contactUrl('hospitality-worth-it')}" target="${LINK_TARGET}" data-brief-link="" data-tool="worth">Ask our team for options ${icon('arrow')}</a>`}
        </div>
        ${st.who === 'clients' ? `<button type="button" class="next-card" data-toroi>${icon('chart')}<span><strong>Hosting clients?</strong> The bigger question is what the day brings back. Build the business case.</span>${icon('arrow')}</button>` : ''}
      </div>`;

    $('[data-tomatch]', out)?.addEventListener('click', () => ctx.go('match'));
    $('[data-toroi]', out)?.addEventListener('click', () => ctx.go('roi', { event: st.event, guests: st.guests, cost: r.quote || null }));
    wireBriefLinks(out, () => brief(r, ev));
    clearTimeout(st.t); st.t = setTimeout(() => track('planner_worth_result', { verdict: r.verdict || 'none', event: st.event }), 1500);
  }

  function brief(r, ev) {
    const lines = [
      `Hello, I used your hospitality planner${ev ? ` for ${ev.t} (${eventDateText(ev)})` : ''}.`,
      `Group size: ${r.g}.`,
      st.who ? `It is for: ${WHO.find((w) => w.id === st.who).label.toLowerCase()}.` : '',
      r.ceiling > 0 ? `Budget: up to ${gbp(r.ceiling)} per person (${gbp(r.ceiling * r.g)} for the group).` : '',
      st.sorted.length ? `Must include: ${st.sorted.map((id) => SORTED.find((s) => s.id === id).label.toLowerCase()).join(', ')}.` : '',
      'Please send me the options that fit.',
    ];
    return lines.filter(Boolean).join('\n');
  }

  return {
    show(p = {}) {
      if (p.event !== undefined && p.event) st.event = p.event;
      if (p.guests) st.guests = p.guests;
      if (p.occasion) st.who = p.occasion === 'clients' ? 'clients' : p.occasion === 'team' ? 'team' : 'personal';
      render();
    },
  };
}
export { plural };
