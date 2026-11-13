// Corporate ROI: the business case for hospitality, on the visitor's own numbers.
// Nothing is pre-filled. We never supply a conversion rate or a price.
//
// Maths:
//   people   = guests + your hosts            cost = cost per head x people (when given)
//   win      value = clients who sign x first-year profit per new client
//   keep     value = clients x yearly profit per client x extra chance they stay or grow (%)
//   staff    value = leavers prevented x cost to replace one person
//   Revenue figures are turned into profit with the visitor's margin.
//   Scenarios: cautious 0.5x, expected 1x, optimistic 1.5x the visitor's estimate.
//   Ceiling: the most per head before the day stops paying for itself = value / people.

import {
  eventBySlug, eventDateText, esc, num, gbp, plural, eventUrl, ctaLabel, LINK_TARGET, wireBriefLinks,
  copyText, toast, track, $, $$, ddmmyyyy, todayIso, PHONE, imgTag, peek,
} from './core.js';
import { icon } from './icons.js';
import { eventOptions } from './worth.js';

const GOALS = [
  { id: 'win', label: 'Win new business', guests: 'Prospects invited', short: 'winning new clients' },
  { id: 'keep', label: 'Keep and grow clients', guests: 'Clients invited', short: 'keeping and growing clients' },
  { id: 'staff', label: 'Reward and keep staff', guests: 'Staff going', short: 'rewarding and keeping staff' },
];
const SCEN = [{ id: 'cautious', label: 'Cautious', k: 0.5 }, { id: 'expected', label: 'Expected', k: 1 }, { id: 'optimistic', label: 'Optimistic', k: 1.5 }];

export function createRoi(root, ctx) {
  const st = { goal: 'win', event: '', guests: 8, hosts: 1, cost: '', value: '', basis: 'profit', margin: '', sign: '', uplift: '', prevent: '', scen: 'expected' };

  function goalFields() {
    const basis = `
      <div class="seg seg--sm" role="radiogroup" aria-label="That figure is">
        <button type="button" role="radio" data-basis="profit" aria-checked="${st.basis === 'profit'}">Profit</button>
        <button type="button" role="radio" data-basis="revenue" aria-checked="${st.basis === 'revenue'}">Revenue</button>
      </div>
      ${st.basis === 'revenue' ? `<label class="fld fld--pct"><span class="fld__l">Your profit margin</span><span class="money money--pct"><input name="margin" inputmode="decimal" value="${esc(st.margin)}" placeholder="0"><span>%</span></span><span class="fld__h">So the case is built on profit, not sales.</span></label>` : ''}`;
    if (st.goal === 'win') return `
      <label class="fld fld--money"><span class="fld__l">What is a new client worth in their first year?</span>
        <span class="money"><span>£</span><input name="value" inputmode="decimal" value="${esc(st.value)}" placeholder="0"></span></label>
      ${basis}
      <label class="fld"><span class="fld__l">Of the ${st.guests} invited, how many might sign because of this day?</span>
        <span class="money money--pct"><input name="sign" inputmode="decimal" value="${esc(st.sign)}" placeholder="0"><span>of ${st.guests}</span></span>
        <span class="fld__h">Be honest. Halves are fine, for example 0.5 if it tips one deal in two.</span></label>`;
    if (st.goal === 'keep') return `
      <label class="fld fld--money"><span class="fld__l">What is one of these clients worth each year?</span>
        <span class="money"><span>£</span><input name="value" inputmode="decimal" value="${esc(st.value)}" placeholder="0"></span></label>
      ${basis}
      <label class="fld"><span class="fld__l">How much more likely are they to stay or grow after the day?</span>
        <span class="money money--pct"><input name="uplift" inputmode="decimal" value="${esc(st.uplift)}" placeholder="0"><span>%</span></span>
        <span class="fld__h">If one in ten extra clients stays or spends more, enter 10.</span></label>`;
    return `
      <label class="fld fld--money"><span class="fld__l">What does it cost to replace one person?</span>
        <span class="money"><span>£</span><input name="value" inputmode="decimal" value="${esc(st.value)}" placeholder="0"></span>
        <span class="fld__h">Recruitment, training and lost output. Your own figure.</span></label>
      <label class="fld"><span class="fld__l">How many leavers could the day help prevent?</span>
        <span class="money money--pct"><input name="prevent" inputmode="decimal" value="${esc(st.prevent)}" placeholder="0"><span>people</span></span>
        <span class="fld__h">Even one person staying can cover the cost.</span></label>`;
  }

  function render() {
    const g = GOALS.find((x) => x.id === st.goal);
    root.innerHTML = `
      <div class="calc">
        <form class="calc__form" novalidate>
          <section class="blk">
            <h3 class="blk__h"><span>1</span> What is the day for?</h3>
            <div class="goals" role="radiogroup" aria-label="Goal">
              ${GOALS.map((x) => `<button type="button" role="radio" class="goal ${st.goal === x.id ? 'is-on' : ''}" aria-checked="${st.goal === x.id}" data-goal="${x.id}">${icon(x.id === 'win' ? 'briefcase' : x.id === 'keep' ? 'heart' : 'trophy')}<span>${x.label}</span></button>`).join('')}
            </div>
            <label class="fld"><span class="fld__l">Event</span><select name="event">${eventOptions(st.event)}</select></label>
          </section>

          <section class="blk">
            <h3 class="blk__h"><span>2</span> Who is going and what it costs</h3>
            <div class="row2">
              ${stepper('guests', g.guests, st.guests, 1, 200)}
              ${stepper('hosts', 'Hosts from your side', st.hosts, 0, 50)}
            </div>
            <label class="fld fld--money"><span class="fld__l">Hospitality price per head <em>optional</em></span>
              <span class="money"><span>£</span><input name="cost" inputmode="decimal" value="${esc(st.cost)}" placeholder="0"></span>
              <span class="fld__h">Leave blank and we will tell you the most you can spend for the day to pay off.</span></label>
          </section>

          <section class="blk">
            <h3 class="blk__h"><span>3</span> What the day could bring back</h3>
            <div class="goal-fields">${goalFields()}</div>
          </section>
        </form>
        <div class="calc__out" aria-live="polite"></div>
      </div>`;
    wire();
    update();
  }

  function stepper(name, label, val, min, max) {
    return `<div class="fld"><span class="fld__l" id="r-${name}">${label}</span>
      <div class="step" role="group" aria-labelledby="r-${name}">
        <button type="button" data-st="${name}" data-d="-1" data-min="${min}" data-max="${max}" aria-label="Fewer">${icon('minus')}</button>
        <input name="${name}" inputmode="numeric" value="${val}" aria-labelledby="r-${name}">
        <button type="button" data-st="${name}" data-d="1" data-min="${min}" data-max="${max}" aria-label="More">${icon('plus')}</button>
      </div></div>`;
  }

  function wire() {
    const f = $('form', root);
    f.addEventListener('submit', (e) => e.preventDefault());
    f.addEventListener('input', (e) => {
      const n = e.target.name;
      if (n === 'guests' || n === 'hosts') {
        st[n] = Math.max(n === 'guests' ? 1 : 0, Math.min(n === 'guests' ? 200 : 50, Math.round(num(e.target.value) ?? 0)));
        if (n === 'guests') refreshGoalFields();
      } else st[n] = e.target.value;
      if (e.target.inputMode === 'decimal') e.target.setAttribute('aria-invalid', String(e.target.value.trim() !== '' && num(e.target.value) === null));
      update();
    });
    f.addEventListener('change', (e) => { if (e.target.name === 'guests' || e.target.name === 'hosts') e.target.value = st[e.target.name]; });
    $$('[data-st]', root).forEach((b) => b.addEventListener('click', () => {
      const n = b.dataset.st;
      st[n] = Math.max(Number(b.dataset.min), Math.min(Number(b.dataset.max), st[n] + Number(b.dataset.d)));
      $(`[name=${n}]`, root).value = st[n];
      if (n === 'guests') refreshGoalFields();
      update();
    }));
    $$('[data-goal]', root).forEach((b) => b.addEventListener('click', () => {
      st.goal = b.dataset.goal; st.value = ''; st.sign = ''; st.uplift = ''; st.prevent = '';
      if (st.goal === 'staff' && st.hosts === 1) st.hosts = 0;
      render();
      $(`[data-goal="${st.goal}"]`, root)?.focus();
    }));
    wireBasis();
  }
  function wireBasis() {
    $$('[data-basis]', root).forEach((b) => b.addEventListener('click', () => { st.basis = b.dataset.basis; refreshGoalFields(); update(); }));
  }
  function refreshGoalFields() {
    const box = $('.goal-fields', root);
    const active = document.activeElement?.name;
    box.innerHTML = goalFields();
    wireBasis();
    if (active) $(`[name=${active}]`, box)?.focus();
  }

  function calc() {
    const people = st.guests + st.hosts;
    const cpp = num(st.cost);
    const cost = cpp ? cpp * people : null;
    let unit = num(st.value) || 0;
    const marginOk = st.basis === 'profit' || (num(st.margin) !== null && num(st.margin) > 0);
    if (st.basis === 'revenue') unit *= Math.min(100, num(st.margin) || 0) / 100;
    let driver = 0; let value = 0;
    if (st.goal === 'win') { driver = Math.min(num(st.sign) || 0, st.guests); value = driver * unit; }
    if (st.goal === 'keep') { driver = Math.min(num(st.uplift) || 0, 100); value = st.guests * unit * (driver / 100); }
    if (st.goal === 'staff') { driver = num(st.prevent) || 0; value = driver * unit; }
    const k = SCEN.find((s) => s.id === st.scen).k;
    const v = value * k;
    let breakEven = null;
    if (cost && unit > 0) {
      if (st.goal === 'win') breakEven = { n: Math.ceil(cost / unit), text: (n) => `${n} of ${st.guests} need${n === 1 ? 's' : ''} to sign to cover the cost` };
      if (st.goal === 'keep') breakEven = { n: (cost / (st.guests * unit)) * 100, text: (n) => `The day pays for itself if clients are ${n < 0.1 ? 'under 0.1' : n.toFixed(1)}% more likely to stay or grow` };
      if (st.goal === 'staff') breakEven = { n: Math.ceil((cost / unit) * 10) / 10, text: (n) => `Keeping ${n <= 1 ? 'one person' : `${n} people`} would cover the cost` };
    }
    return { people, cpp, cost, unit, driver, value, v, k, marginOk, breakEven, ceiling: v / people, ceiling3: v / (3 * people) };
  }

  function verdict(m) {
    if (m >= 3) return ['A strong case', 'good'];
    if (m >= 1.5) return ['A sound case', 'good'];
    if (m >= 1) return ['It pays its way', 'ok'];
    return ['Hard to justify on these figures', 'bad'];
  }

  function update() {
    const out = $('.calc__out', root);
    const r = calc();
    const ev = st.event ? eventBySlug(st.event) : null;
    const g = GOALS.find((x) => x.id === st.goal);
    ctx.remember({ event: st.event || undefined, guests: st.guests });
    peek($('.calc', root), '');
    if (!r.marginOk && st.basis === 'revenue' && num(st.value)) {
      out.innerHTML = `<div class="out out--empty"><p class="out__big">Add your margin</p><p>You entered revenue. Add your profit margin so the case is built on what you actually keep.</p></div>`;
      return;
    }
    if (r.value <= 0) {
      out.innerHTML = `
        <div class="out out--empty">
          ${ev ? evHead(ev) : ''}
          <p class="out__big">Your business case appears here</p>
          <p>Answer the three questions on the left. We show the return, what has to happen to break even and the most you can spend per head.</p>
          <ul class="out__steps"><li>${icon('check')} Built on your numbers only</li><li>${icon('check')} Cautious, expected and optimistic views</li><li>${icon('check')} A one-page case to share or print</li></ul>
        </div>`;
      return;
    }
    const m = r.cost ? r.v / r.cost : null;
    const [vt, tone] = m !== null ? verdict(m) : ['Your spending ceiling', 'ok'];
    peek($('.calc', root), m !== null ? `${vt}: ${m >= 10 ? Math.round(m) : m.toFixed(1)}x return` : `Spend up to ${gbp(r.ceiling)} a head`);
    const scenVals = SCEN.map((s) => ({ ...s, v: r.value * s.k }));
    const maxBar = Math.max(...scenVals.map((s) => s.v), r.cost || 0) * 1.08;
    const pct = (x) => `${Math.max(0, Math.min(100, (x / maxBar) * 100)).toFixed(1)}%`;

    out.innerHTML = `
      <div class="out out--${tone}">
        ${ev ? evHead(ev) : ''}
        <div class="seg seg--sm seg--scen" role="radiogroup" aria-label="Scenario">
          ${SCEN.map((s) => `<button type="button" role="radio" data-scen="${s.id}" aria-checked="${st.scen === s.id}">${s.label}</button>`).join('')}
        </div>
        <p class="eyebrow">${vt}</p>
        ${m !== null
          ? `<p class="out__big"><strong>${m >= 10 ? Math.round(m) : m.toFixed(1)}x</strong> return on ${gbp(r.cost)}</p>
             <p class="out__sub">${gbp(r.v)} back for ${gbp(r.cost)} spent on ${plural(r.people, 'place')}, a net ${r.v - r.cost >= 0 ? 'gain' : 'loss'} of ${gbp(Math.abs(r.v - r.cost))}.</p>`
          : `<p class="out__big">Spend up to <strong>${gbp(r.ceiling)}</strong> a head</p>
             <p class="out__sub">At that price the day pays for itself on your ${SCEN.find((s) => s.id === st.scen).label.toLowerCase()} view. Keep it under ${gbp(r.ceiling3)} a head for a 3x return.</p>`}

        <div class="stats">
          <div><span>Value back</span><strong>${gbp(r.v)}</strong></div>
          <div><span>Break-even price</span><strong>${gbp(r.ceiling)} <small>a head</small></strong></div>
          ${r.breakEven ? `<div class="stats__wide"><span>To break even</span><strong class="stats__txt">${esc(r.breakEven.text(r.breakEven.n))}</strong></div>` : ''}
        </div>

        <div class="scen" role="img" aria-label="${scenVals.map((s) => `${s.label} ${gbp(s.v)}`).join(', ')}${r.cost ? `, cost ${gbp(r.cost)}` : ''}">
          ${scenVals.map((s) => `<div class="bar ${s.id === st.scen ? 'is-sel' : ''}"><span class="bar__l">${s.label}</span><span class="bar__t"><span class="bar__f ${r.cost && s.v < r.cost ? 'bar__f--bad' : 'bar__f--good'}" style="width:${pct(s.v)}"></span>${r.cost ? `<span class="bar__cost" style="left:${pct(r.cost)}" title="Cost"></span>` : ''}</span><span class="bar__v">${gbp(s.v)}</span></div>`).join('')}
          ${r.cost ? `<p class="scen__key"><span class="bar__cost bar__cost--key"></span> Cost of the day, ${gbp(r.cost)}</p>` : ''}
        </div>

        <p class="taxnote">${icon('info')} <span>${st.goal === 'staff'
          ? 'Staff entertaining is generally allowable for UK tax when it is wholly for the business and not incidental to entertaining clients (<a href="https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim45033" target="_blank" rel="noopener">HMRC BIM45033</a>). Check with your accountant.'
          : 'Client entertaining is generally not deductible for UK business tax (<a href="https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim45000" target="_blank" rel="noopener">HMRC BIM45000</a>), so budget for it from taxed profit. Check with your accountant.'}</span></p>

        <div class="out__cta">
          ${ev ? `<a class="btn btn--gold btn--block" href="${eventUrl(ev, 'corporate-roi')}" target="${LINK_TARGET}" data-brief-link="${ev.s}" data-tool="roi">${m !== null && m >= 1 ? ctaLabel(ev) : `Ask for options within ${gbp(r.ceiling)} a head`} ${icon('arrow')}</a>`
            : `<button type="button" class="btn btn--gold btn--block" data-tomatch>${icon('compass')} Find the right event for this</button>`}
          <div class="out__row">
            <button type="button" class="btn btn--line" data-case>${icon('print')} Business case</button>
            <button type="button" class="btn btn--line" data-copy>${icon('copy')} Copy as text</button>
          </div>
          ${ev ? '<p class="out__fine">We copy your brief, ready to paste into the enquiry form.</p>' : `<p class="out__fine">Or call us on <a href="${PHONE.href}">${PHONE.text}</a>.</p>`}
        </div>
      </div>`;

    $$('[data-scen]', out).forEach((b) => b.addEventListener('click', () => { st.scen = b.dataset.scen; update(); }));
    $('[data-tomatch]', out)?.addEventListener('click', () => ctx.go('match'));
    $('[data-case]', out).addEventListener('click', () => openCase(r, ev, g));
    $('[data-copy]', out).addEventListener('click', async () => { const ok = await copyText(caseText(r, ev, g)); toast(ok ? 'Business case copied.' : 'Copy did not work in this browser.'); });
    wireBriefLinks(out, () => brief(r, ev, g));
    clearTimeout(st.t); st.t = setTimeout(() => track('planner_roi_result', { goal: st.goal, event: st.event, multiple: m ? m.toFixed(1) : 'none' }), 1500);
  }

  function evHead(ev) {
    return `<div class="out__ev">${imgTag(ev, { w: 480, ratio: 16 / 9, sizes: '400px' })}<div><p class="eyebrow">${esc(ev.mn || '')}</p><p class="out__evt">${esc(ev.t)}</p><p class="out__evd">${esc(eventDateText(ev))}</p></div></div>`;
  }

  function assumptions(r, g) {
    const a = [`${g.guests}: ${st.guests}. Hosts from our side: ${st.hosts}.`];
    const basis = st.basis === 'revenue' ? ` (revenue at a ${num(st.margin)}% margin, so ${gbp(r.unit)} profit)` : ' (profit)';
    if (st.goal === 'win') a.push(`First-year value of a new client: ${gbp(num(st.value))}${basis}.`, `Clients expected to sign because of the day: ${r.driver} of ${st.guests}.`);
    if (st.goal === 'keep') a.push(`Yearly value of each client: ${gbp(num(st.value))}${basis}.`, `Extra chance they stay or grow: ${r.driver}%.`);
    if (st.goal === 'staff') a.push(`Cost to replace one person: ${gbp(num(st.value))}.`, `Leavers the day could help prevent: ${r.driver}.`);
    a.push(r.cpp ? `Hospitality price: ${gbp(r.cpp)} a head, ${gbp(r.cost)} in total.` : 'Hospitality price: not set yet.');
    a.push(`View: ${SCEN.find((s) => s.id === st.scen).label.toLowerCase()} (${r.k}x our estimate).`);
    return a;
  }

  function caseText(r, ev, g) {
    const m = r.cost ? r.v / r.cost : null;
    return [
      `Business case: ${ev ? ev.t : 'corporate hospitality'}`,
      `Prepared ${ddmmyyyy(todayIso())} with the Prestige Corporate Events hospitality planner.`,
      ev ? `Event: ${ev.t}, ${eventDateText(ev)}${ev.c ? `, ${ev.c}` : ''}.` : '',
      `Goal: ${g.label.toLowerCase()}.`,
      '',
      m !== null ? `Return: ${m.toFixed(1)}x. ${gbp(r.v)} value for ${gbp(r.cost)} cost.` : `Spending ceiling: ${gbp(r.ceiling)} a head to break even, ${gbp(r.ceiling3)} a head for a 3x return.`,
      r.breakEven ? `Break-even: ${r.breakEven.text(r.breakEven.n)}.` : '',
      '',
      'Assumptions (our own estimates):',
      ...assumptions(r, g).map((x) => `- ${x}`),
      '',
      'These figures are estimates for planning, not a forecast or financial advice.',
    ].filter((x) => x !== null).join('\n').replace(/\n{3,}/g, '\n\n');
  }

  function brief(r, ev, g) {
    return [
      `Hello, I used your hospitality planner${ev ? ` for ${ev.t} (${eventDateText(ev)})` : ''}.`,
      `Goal: ${g.label.toLowerCase()}. ${plural(r.people, 'guest')} including ${plural(st.hosts, 'host')} from our side.`,
      `Budget: up to ${gbp(r.cpp && r.cpp <= r.ceiling ? r.cpp : r.ceiling)} per head.`,
      'Please send me the options that fit.',
    ].join('\n');
  }

  function openCase(r, ev, g) {
    const m = r.cost ? r.v / r.cost : null;
    const [vt] = m !== null ? verdict(m) : ['Your spending ceiling'];
    const wrap = document.createElement('div');
    wrap.className = 'case';
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Business case');
    wrap.innerHTML = `
      <div class="case__bar"><button type="button" class="btn btn--gold" data-print>${icon('print')} Print or save as PDF</button><button type="button" class="btn btn--line" data-close>Close</button></div>
      <article class="case__doc">
        <header><img src="assets/logo-dark.png" width="600" height="146" alt="Prestige Corporate Events"><p>${ddmmyyyy(todayIso())}</p></header>
        <p class="eyebrow">Business case</p>
        <h2>${esc(ev ? ev.t : 'Corporate hospitality')}</h2>
        ${ev ? `<p class="case__ev">${esc(eventDateText(ev))}${ev.c ? `, ${esc(ev.c)}` : ''}</p>` : ''}
        <div class="case__rec"><strong>${esc(vt)}.</strong> ${m !== null ? `On our estimates the day returns ${m.toFixed(1)}x its cost: ${gbp(r.v)} for ${gbp(r.cost)}.` : `The day pays for itself at up to ${gbp(r.ceiling)} a head, and returns 3x at ${gbp(r.ceiling3)} a head.`}</div>
        <div class="case__figs">
          <div><span>Goal</span><strong>${esc(g.label)}</strong></div>
          <div><span>Places</span><strong>${r.people}</strong></div>
          <div><span>Value back</span><strong>${gbp(r.v)}</strong></div>
          <div><span>Break-even price</span><strong>${gbp(r.ceiling)} a head</strong></div>
        </div>
        ${r.breakEven ? `<p><strong>What has to happen:</strong> ${esc(r.breakEven.text(r.breakEven.n))}.</p>` : ''}
        <h3>Assumptions</h3><ul>${assumptions(r, g).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3>Scenarios</h3><ul>${SCEN.map((s) => `<li>${s.label}: ${gbp(r.value * s.k)}${r.cost ? `, ${(r.value * s.k / r.cost).toFixed(1)}x` : ''}</li>`).join('')}</ul>
        <h3>Next step</h3><p>Ask Prestige Corporate Events for packages within ${gbp(r.cpp && r.cpp <= r.ceiling ? r.cpp : r.ceiling)} a head. Call ${PHONE.text}.</p>
        <p class="case__fine">Estimates for planning, built on the figures entered. Not a forecast, tax or financial advice.</p>
      </article>`;
    document.body.appendChild(wrap);
    document.documentElement.classList.add('is-case');
    const prev = document.activeElement;
    const close = () => { wrap.remove(); document.documentElement.classList.remove('is-case'); prev?.focus(); };
    $('[data-close]', wrap).addEventListener('click', close);
    $('[data-print]', wrap).addEventListener('click', () => window.print());
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('button', wrap); const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    $('[data-print]', wrap).focus();
    track('planner_roi_case_open', { goal: st.goal });
  }

  return {
    show(p = {}) {
      if (p.event) st.event = p.event;
      if (p.guests) st.guests = p.guests;
      if (p.cost) st.cost = String(p.cost);
      if (p.occasion === 'team') { st.goal = 'staff'; st.hosts = 0; }
      if (p.occasion === 'clients' && st.goal === 'staff') st.goal = 'win';
      render();
    },
  };
}
