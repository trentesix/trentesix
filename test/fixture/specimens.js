// One live specimen per moment in docs/motion.md. Each fills its stage with the markup the moment
// expects and returns play(), which acts it out once. Motion comes only from moments.css and the
// helper; this file sets attributes and calls functions, as a component would.
import {
  bin,
  count,
  flash,
  flight,
  growFrom,
  hold,
  play,
  slide,
  switchLights,
  toastTimer,
} from '../../packages/core/motion.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const state = (el, s) => (s ? el.setAttribute('data-state', s) : el.removeAttribute('data-state'));
/** Waits for an element's own animations (not its children's) to finish. */
const settled = (el) => Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {})));
const TICK =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path data-part="ink" pathLength="1" d="M3 8.5l3.2 3.2L13 4.8"/></svg>';
const COPY =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5" class="svg-line" style="stroke-width:1.6"/><path d="M3 10.5V3.5A1 1 0 0 1 4 2.5h6.5" class="svg-line" style="stroke-width:1.6"/></svg>';
const TITLES = ['Sous la glace d’Ungava', 'Paris, un an après', 'Lettre de Baie-Comeau'];

const groups = [
  ['Micro-interactions', 'They belong to a component and happen every time.'],
  ['Moments', 'Named events, rarer and with more character.'],
  ['Transitions', 'How one view becomes another.'],
  ['Site', 'On a public website.'],
];

const S = [];
const add = (group, name, lives, says, setup, helper = '') =>
  S.push({ group, name, lives, says, setup, helper });

// ── Micro-interactions ─────────────────────────────────────────────────────────────────────────

add(
  'Micro-interactions',
  'press',
  'Button',
  'Every press is seen, even a 30 ms click: Play makes one.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="row-btns"><button type="button" class="btn primary" data-moment="press">Publish</button><button type="button" class="btn" data-moment="press" style="--press: 1px">Preview</button></div><span class="note">Or press them yourself.</span></div>`;
    return async () => {
      for (const b of $$('[data-moment]', stage)) {
        b.setAttribute('data-pressed', '');
        await wait(30);
        b.removeAttribute('data-pressed');
        await wait(500);
      }
    };
  },
);

add(
  'Micro-interactions',
  'switch',
  'Switch',
  'Press and hold: the thumb stretches toward where it goes, then lands.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="switch-row"><button type="button" class="sw" role="switch" aria-checked="false" data-moment="switch" aria-label="Show in the menu"><span data-part="thumb"></span></button><span>Show in the menu</span></div></div>`;
    const sw = $('.sw', stage);
    sw.onclick = () =>
      sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'));
    return async () => {
      sw.setAttribute('data-pressed', '');
      await wait(260);
      sw.removeAttribute('data-pressed');
      sw.click();
    };
  },
);

add(
  'Micro-interactions',
  'slide',
  'Segmented, Tabs',
  'Discothèque stretches toward the new option first; Folio glides and settles.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="segd" role="group" aria-label="Show" data-moment="slide"><span data-part="indicator"></span><button type="button" aria-pressed="true">All</button><button type="button" aria-pressed="false">Drafts</button><button type="button" aria-pressed="false">Published</button></div></div>`;
    const ind = $('[data-part="indicator"]', stage);
    const opts = $$('button', stage);
    const pick = (b) => {
      opts.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      return slide(ind, b);
    };
    opts.forEach((b) => (b.onclick = () => pick(b)));
    requestAnimationFrame(() => slide(ind, opts[0]));
    return async () => {
      await pick(opts[2]);
      await wait(300);
      await pick(opts[1]);
      await wait(300);
      await pick(opts[0]);
    };
  },
  'slide()',
);

add(
  'Micro-interactions',
  'field-error',
  'TextField',
  'Discothèque shakes once; Folio draws a rust line under the field.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="field"><label for="slug">Slug (EN)</label><div data-moment="field-error"><input id="slug" value="under-the-ice" readonly></div><span data-part="message">Already used by “Sous la glace (1975)”</span></div></div>`;
    const box = $('[data-moment]', stage);
    return async () => {
      box.removeAttribute('data-invalid');
      await wait(250);
      box.setAttribute('data-invalid', '');
    };
  },
);

add(
  'Micro-interactions',
  'save',
  'SaveButton',
  'Type: a dot says something is unsaved. ⌘S presses the button, it saves, the tick writes itself.',
  (stage) => {
    stage.innerHTML = `<div class="center"><input class="fake-field" value="Sous la glace d’Ungava" aria-label="Title"><button type="button" class="btn savebtn" data-moment="press save"><span data-part="dot"></span><span class="lab">Save <kbd>⌘S</kbd></span></button></div>`;
    const input = $('input', stage);
    const btn = $('.savebtn', stage);
    const lab = $('.lab', btn);
    let saving = false;
    const markDirty = () => {
      if (saving || btn.dataset.state === 'dirty') return;
      btn.classList.add('primary');
      state(btn, 'dirty');
    };
    const save = async (fromKey) => {
      if (saving || btn.dataset.state !== 'dirty') return;
      saving = true;
      if (fromKey) btn.setAttribute('data-shortcut', '');
      state(btn, 'busy');
      lab.textContent = 'Saving';
      await wait(1100);
      btn.removeAttribute('data-shortcut');
      state(btn, 'done');
      lab.innerHTML = `${TICK}Saved`;
      await wait(2000);
      state(btn, null);
      btn.classList.remove('primary');
      lab.innerHTML = 'Save <kbd>⌘S</kbd>';
      saving = false;
    };
    input.oninput = markDirty;
    btn.onclick = () => save(false);
    stage.onkeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save(true);
      }
    };
    return async () => {
      if (saving) return;
      for (const ch of ', l’hiver') {
        await wait(60);
        input.value += ch;
        markDirty();
      }
      await wait(700);
      await save(true);
    };
  },
);

add(
  'Micro-interactions',
  'copied',
  'CopyButton',
  'The copy icon gives way to a tick, centred on it, and a tag rises.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="copy-row"><code>mk_live_4f9b2e71c0a8d3a21c</code><button type="button" class="btn copybtn" data-moment="press copied"><span data-part="icon">${COPY}<span class="done-tick">${TICK}</span></span>Copy<span data-part="tag">Copied</span></button></div></div>`;
    const btn = $('.copybtn', stage);
    let t;
    btn.onclick = async () => {
      clearTimeout(t);
      state(btn, null);
      await frame();
      state(btn, 'done');
      t = setTimeout(() => state(btn, null), 1800);
    };
    return () => btn.click();
  },
);

add(
  'Micro-interactions',
  'counter',
  'Count, Badge',
  'Only the digits that change roll, and the badge gives a small bump.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="nav"><div>Overview</div><div>Reviews <span class="badge" data-moment="counter"></span></div><div>Inbox <span class="badge" data-moment="counter"></span></div></div><div class="row-btns"><button type="button" class="btn small" data-k="0">+1 review</button><button type="button" class="btn small" data-k="1">+1 message</button><button type="button" class="btn small" data-k="-1">−1 message</button></div></div>`;
    const [reviews, inbox] = $$('.badge', stage);
    count(reviews, 9);
    count(inbox, 24);
    const bump = (k) => {
      const b = k === 0 ? reviews : inbox;
      return count(b, Math.max(0, Number(b.dataset.value) + (k < 0 ? -1 : 1)));
    };
    $$('[data-k]', stage).forEach((b) => (b.onclick = () => bump(+b.dataset.k)));
    return async () => {
      await bump(0);
      for (let i = 0; i < 4; i++) {
        await wait(250);
        await bump(1);
      }
    };
  },
  'count()',
);

add(
  'Micro-interactions',
  'code-cells',
  'CodeField',
  'Each digit drops in; the sixth closes the gaps and a tick writes. Wrong: the cells shake and clear.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="codebox" data-moment="code-cells"><span class="note">Code from your email</span><div class="cells">${'<span class="cell" data-part="cell"><b></b></span>'.repeat(6)}</div><span class="cmsg" aria-live="polite"></span><button type="button" class="linky">Try a wrong code</button></div></div>`;
    const box = $('[data-moment]', stage);
    const cells = $$('[data-part="cell"]', stage);
    const msg = $('.cmsg', stage);
    let busy = false;
    const reset = () => {
      state(box, null);
      cells.forEach((c) => {
        c.removeAttribute('data-filled');
        $('b', c).textContent = '';
      });
      msg.className = 'cmsg';
      msg.textContent = '';
    };
    const go = async (code) => {
      if (busy) return;
      busy = true;
      reset();
      for (let i = 0; i < 6; i++) {
        await wait(code === '111111' ? 70 : 140);
        $('b', cells[i]).textContent = code[i];
        cells[i].setAttribute('data-filled', '');
      }
      await wait(120);
      if (code !== '111111') {
        state(box, 'done');
        msg.innerHTML = `${TICK}<span>Signing in</span>`;
      } else {
        state(box, 'failed');
        msg.className = 'cmsg bad';
        msg.textContent = 'That code didn’t work.';
        await wait(700 + 140 + 5 * 40);
        reset();
      }
      busy = false;
    };
    $('.linky', stage).onclick = () => go('111111');
    return () => go('482913');
  },
);

add(
  'Micro-interactions',
  'hold',
  'Button intent="destroy"',
  'Press and hold for 0.9 s (or hold Space). Let go early and it drains back.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry"><b>Lexique</b><span class="meta">In the bin for 12 days</span></div><button type="button" class="btn danger" data-moment="hold"><span data-part="fill"></span><span class="lab">Delete forever</span></button><span class="note">Play lets go once, then holds.</span></div>`;
    const btn = $('[data-moment="hold"]', stage);
    const entry = $('.entry', stage);
    const lab = $('.lab', btn);
    let cleanup;
    const arm = () => {
      cleanup?.();
      state(btn, null);
      btn.disabled = false;
      lab.textContent = 'Delete forever';
      entry.style.visibility = '';
      $('[data-part="fill"]', btn)
        .getAnimations()
        .forEach((a) => a.cancel());
      cleanup = hold(btn, {
        ms: 900,
        onConfirm: async () => {
          lab.textContent = 'Deleted';
          btn.disabled = true;
          await play(entry, [{ backgroundColor: 'var(--rust-soft)', opacity: 1 }, { opacity: 0 }], {
            duration: 500,
            fill: 'forwards',
          });
          entry.style.visibility = 'hidden';
        },
      });
    };
    new MutationObserver(() => {
      if (btn.dataset.state === 'busy') lab.textContent = 'Keep holding…';
      else if (!btn.dataset.state) lab.textContent = 'Delete forever';
    }).observe(btn, { attributes: true, attributeFilter: ['data-state'] });
    arm();
    const press = (type) =>
      btn.dispatchEvent(new PointerEvent(type, { button: 0, bubbles: true, cancelable: true }));
    return async () => {
      arm();
      await wait(150);
      press('pointerdown');
      await wait(380);
      press('pointerup');
      await wait(600);
      press('pointerdown');
      await wait(1000);
      press('pointerup');
    };
  },
  'hold()',
);

add(
  'Micro-interactions',
  'flash',
  'Anything you just changed',
  'Use the title: the slug it rewrote flashes, and again each time. Someone else’s change is a change-mark.',
  (stage) => {
    stage.innerHTML = `<div class="rows" style="left:24px"><div class="row"><b>Title</b><small>Paris, un an après</small></div><div class="row slug"><b>Slug</b><small>paris</small></div><button type="button" class="btn small use" style="justify-self:start">Use the title</button></div>`;
    const row = $('.slug', stage);
    const slugs = ['paris-un-an-apres', 'paris'];
    let n = 0;
    /** Rewrites the slug and flashes it; resolves with whether its colour was seen to change. */
    const use = async () => {
      $('small', row).textContent = slugs[n++ % 2];
      const own = getComputedStyle(row).backgroundColor;
      let seen = false;
      let over = false;
      const look = () => {
        seen ||= getComputedStyle(row).backgroundColor !== own;
        if (!over) requestAnimationFrame(look);
      };
      look();
      await flash(row);
      over = true;
      return seen;
    };
    $('.use', stage).onclick = use;
    return async () => {
      // Twice: the second flash must play again on a row already marked.
      const shown = [await use(), await use()];
      stage.dataset.flashes = String(shown.filter(Boolean).length);
    };
  },
  'flash()',
);

// ── Moments ────────────────────────────────────────────────────────────────────────────────────

add(
  'Moments',
  'toast',
  'Toast',
  'The bar is the clock: five seconds, paused while hovered or focused, the same under reduced motion.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry"><b>Lexique</b><span class="meta">Glossary · 14 entries</span></div></div><span class="clock" aria-hidden="true"></span>`;
    const clock = $('.clock', stage);
    let current = null;
    return async () => {
      current?.remove();
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.dataset.moment = 'toast';
      toast.setAttribute('role', 'status');
      toast.innerHTML =
        '<span>“Lexique” moved to the bin</span><button type="button">Undo</button><span data-part="timer"></span>';
      stage.append(toast);
      current = toast;
      const shown = performance.now();
      const tick = setInterval(
        () => (clock.textContent = `${((performance.now() - shown) / 1000).toFixed(1)} s`),
        100,
      );
      const leave = async () => {
        if (toast.dataset.state) return;
        state(toast, 'leaving');
        await settled(toast);
        clearInterval(tick);
        toast.dataset.shownFor = String(Math.round(performance.now() - shown));
        stage.dataset.lastToast = toast.dataset.shownFor;
        toast.remove();
      };
      $('button', toast).onclick = leave;
      await toastTimer(toast);
      await leave();
    };
  },
  'toastTimer()',
);

add(
  'Moments',
  'stamp',
  'Stamp (Discothèque)',
  'Slams down with a turn; the entry takes the hit; lifts off after 1.8 s.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry" data-moment="thud"><b>Sous la glace d’Ungava</b><span class="meta">Article · FR + EN<span class="pill"><span class="lab">Draft</span></span></span></div></div>`;
    const entry = $('.entry', stage);
    return async () => {
      $('.stamp', stage)?.remove();
      $('.lab', entry).textContent = 'Draft';
      await frame();
      stage.insertAdjacentHTML(
        'beforeend',
        '<div class="stamp" data-moment="stamp" aria-hidden="true">PUBLISHED</div>',
      );
      // The stamp goes in the stage; the entry jolts on its own state.
      state(entry, 'done');
      $('.lab', entry).textContent = 'Published';
      await settled($('.stamp', stage));
      state(entry, null);
    };
  },
);

add(
  'Moments',
  'seal',
  'StatusPill',
  'Approve: the pill fills, a tick writes, a line draws down the card, the asker gets a tick. Or ask for changes.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry" data-moment="seal"><span data-part="edge"></span><b>Les androïdes timides</b><span class="meta"><span style="display:inline-flex;gap:6px;align-items:center"><span class="av sm" style="background:#1f4b5a">LG<span data-part="badge">${TICK}</span></span>Louise asked</span><span class="pill"><span data-part="fill"></span>${TICK}<span class="lab" data-part="label">In review</span></span></span><div class="acts" style="margin-top:8px"><button type="button" class="btn go small" data-moment="press">Approve</button><button type="button" class="btn small" data-moment="press">Request changes</button></div></div></div>`;
    const entry = $('.entry', stage);
    const lab = $('.lab', stage);
    const set = async (s) => {
      state(entry, null);
      entry.classList.remove('asked');
      $('.pill', stage).classList.remove('asked');
      await frame();
      if (s === 'failed') {
        entry.classList.add('asked');
        $('.pill', stage).classList.add('asked');
      }
      lab.textContent = s === 'done' ? 'Approved' : 'Changes asked';
      state(entry, s);
    };
    const [ok, ask] = $$('.acts button', stage);
    ok.onclick = () => set('done');
    ask.onclick = () => set('failed');
    return () => set('done');
  },
);

add(
  'Moments',
  'change-mark',
  'ChangeMark',
  'Someone else changed two words: a bar draws in the margin, a highlighter sweeps them, both fade.',
  (stage) => {
    const fresh = () => {
      stage.innerHTML = `<div class="rows" style="left:24px">${TITLES.map((t, i) => `<div class="row"><b class="t${i}">${t}</b><small>Draft</small></div>`).join('')}</div>`;
    };
    fresh();
    return async () => {
      fresh();
      await wait(300);
      const t = $('.t1', stage);
      const row = t.closest('.row');
      row.dataset.moment = 'change-mark';
      row.insertAdjacentHTML('afterbegin', '<span data-part="bar"></span>');
      t.innerHTML =
        'Paris, <span class="hl"><span data-part="highlight"></span>deux ans</span> après';
    };
  },
);

const POSTMARK = `<span class="postmark" data-moment="postmark" role="img" aria-label="Sent 6 Nov 2026"><svg viewBox="0 0 120 64" aria-hidden="true"><circle data-part="ink" pathLength="1" cx="32" cy="32" r="28"/><circle data-part="ink" pathLength="1" cx="32" cy="32" r="22"/>${[20, 30, 40].map((y) => `<path data-part="ink" pathLength="1" d="M62 ${y}q5-5 10 0t10 0t10 0t10 0t10 0"/>`).join('')}<text data-part="date" x="32" y="36" text-anchor="middle">6 NOV</text></svg></span>`;

add(
  'Moments',
  'postmark',
  'Sent reply (Relais)',
  'A reply is sent: the postmark presses in with the settle spring, then settles back. Other looks draw it.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry sent"><b>Re: Where is my parcel?</b><span class="meta">Reply · Sent</span><div class="stamp-slot"></div></div></div>`;
    const slot = $('.stamp-slot', stage);
    return async () => {
      slot.innerHTML = '';
      await frame();
      slot.insertAdjacentHTML('beforeend', POSTMARK);
    };
  },
);

const NOTARY = `<span class="notary" data-moment="notary" role="img" aria-label="Accepted 6 Nov 2026"><svg viewBox="0 0 96 96" aria-hidden="true"><circle data-part="ink" pathLength="1" cx="48" cy="48" r="45"/><circle data-part="ink" pathLength="1" cx="48" cy="48" r="39"/><text data-part="word" x="48" y="50" text-anchor="middle">Accepted</text><text data-part="date" x="48" y="64" text-anchor="middle">6 Nov 2026</text></svg></span>`;

add(
  'Moments',
  'notary',
  'Accepted quote (Devis)',
  'The client accepts: Devis presses the seal in with one small overshoot and the quote takes a 1 px jolt. Other looks draw it.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry quote" data-moment="thud"><b>Quote Q-0007</b><span class="meta">Walnut table · 6 200,50 $</span><div class="notary-slot"></div></div></div>`;
    const slot = $('.notary-slot', stage);
    return async () => {
      slot.innerHTML = '';
      await frame();
      slot.insertAdjacentHTML('beforeend', NOTARY);
    };
  },
);

add(
  'Moments',
  'sweep',
  'New row or panel (Relais)',
  'A new message arrives: a band crosses the top edge once and fades. Relais sweeps the airmail stripe.',
  (stage) => {
    const fresh = () => {
      stage.innerHTML = `<div class="rows" style="left:24px">${TITLES.map((t, i) => `<div class="row" data-name-row="${i}"><b class="t${i}">${t}</b><small>Open</small></div>`).join('')}</div>`;
    };
    fresh();
    return async () => {
      fresh();
      await wait(300);
      const row = $('.row', stage);
      row.dataset.moment = 'sweep';
      row.insertAdjacentHTML('afterbegin', '<span data-part="band" aria-hidden="true"></span>');
      await settled($('[data-part="band"]', row));
    };
  },
);

add(
  'Moments',
  'milestone',
  'Celebration',
  'A first publish: the card lands, the seal writes itself, one burst.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry"><b>Bienvenue au Journal</b><span class="meta">Article · your first entry</span></div></div>`;
    const seal = `<svg class="seal" viewBox="0 0 40 40" aria-hidden="true"><circle data-part="ink" pathLength="1" cx="20" cy="20" r="15"/><path data-part="ink" pathLength="1" d="M13.5 20.5l4.5 4.5 8.5-9"/><g data-part="rays">${[
      0, 45, 90, 135, 180, 225, 270, 315,
    ]
      .map((a) => {
        const r = (Math.PI * a) / 180;
        return `<line x1="${20 + Math.cos(r) * 19}" y1="${20 + Math.sin(r) * 19}" x2="${20 + Math.cos(r) * 23}" y2="${20 + Math.sin(r) * 23}"/>`;
      })
      .join('')}</g></svg>`;
    return async () => {
      $('[data-moment="milestone"]', stage)?.remove();
      stage.insertAdjacentHTML(
        'beforeend',
        `<div data-moment="milestone" style="position:absolute;inset:0;z-index:4"><div data-part="confetti" aria-hidden="true">${'<i></i>'.repeat(10)}</div><div class="celebrate" data-part="card" role="status">${seal}<span class="txt"><span class="big">Your first entry is live!</span><small>The site rebuilds in a minute.</small></span></div></div>`,
      );
      const m = $('[data-moment="milestone"]', stage);
      await wait(4200);
      state(m, 'leaving');
      await settled($('[data-part="card"]', m));
      m.remove();
    };
  },
);

add(
  'Moments',
  'arrival',
  'PresenceStack',
  'Someone joins: their avatar slides into the stack; its ring pings (Discothèque) or draws itself (Folio).',
  (stage) => {
    stage.innerHTML = `<div class="bar-top"><span class="brand">journal</span><span class="stack"><span class="av" style="background:#56651f">CS</span><span class="av" style="background:#1f4b5a">LG</span></span></div><div class="ghost-page"><i style="width:40%"></i><i></i><i style="width:85%"></i></div>`;
    const stack = $('.stack', stage);
    return async () => {
      $('[data-moment="arrival"]', stack)?.remove();
      await frame();
      stack.insertAdjacentHTML(
        'beforeend',
        `<span class="av" data-moment="arrival" style="background:#7a3b5a" aria-label="Sophie is here">SN<span data-part="ring"><svg viewBox="0 0 40 40" aria-hidden="true"><circle data-part="ink" pathLength="1" cx="20" cy="20" r="20"/></svg></span></span>`,
      );
    };
  },
);

add(
  'Moments',
  'curtain',
  'Sign-in page',
  'Signed in: five bands sweep up and lift away (Discothèque), or hazard tape is pulled across (Devis); the card steps back and the Studio rises (Folio).',
  (stage) => {
    stage.innerHTML = `<div class="login" data-moment="curtain"><div class="lcard" data-part="card"><span class="lt">Sign in</span><div class="fake-field">ada@journal.ca</div><button type="button" class="btn primary" data-moment="press">Sign in</button></div><div class="studio" data-part="view"><div class="bar-top"><span class="brand">journal</span></div><div class="ghost-page"><i style="width:40%"></i><i></i><i style="width:85%"></i></div></div><div data-part="bands" aria-hidden="true">${'<i></i>'.repeat(5)}</div></div>`;
    const page = $('[data-moment="curtain"]', stage);
    const btn = $('.lcard .btn', stage);
    return async () => {
      state(page, null);
      state(btn, null);
      btn.textContent = 'Sign in';
      await frame();
      state(btn, 'busy');
      btn.textContent = 'Signing in';
      await wait(900);
      state(btn, null);
      state(page, 'done');
      await wait(1800);
      state(page, null);
      btn.textContent = 'Sign in';
    };
  },
);

add(
  'Moments',
  'develop',
  'Upload tile',
  'The picture develops with the upload, from --progress. Progress, so the same under reduced motion.',
  (stage) => {
    stage.innerHTML = `<div class="tiles"><div class="tile"><span class="ph a"></span></div><div class="tile"><span class="ph b"></span></div></div><div class="foot"><span class="note">riviere-matin.jpg</span></div>`;
    const tiles = $('.tiles', stage);
    let busy = false;
    return async () => {
      if (busy) return;
      busy = true;
      $('[data-moment="develop"]', stage)?.remove();
      tiles.insertAdjacentHTML(
        'beforeend',
        `<div class="tile" data-moment="develop" data-state="busy" style="--progress:0"><span class="ph c" data-part="image"></span><span data-part="progress"></span><span data-part="badge">${TICK}</span></div>`,
      );
      const tile = $('[data-moment="develop"]', stage);
      for (const p of [0.18, 0.3, 0.62, 0.7, 1]) {
        await wait(500);
        tile.style.setProperty('--progress', p);
      }
      await wait(250);
      state(tile, 'done');
      busy = false;
    };
  },
);

add(
  'Moments',
  'pen',
  'Suggestion diff',
  'A line strikes the old words, then the new ones write themselves in. Accept folds the old words away.',
  (stage) => {
    const shell = (inner) => `<div class="sugg">${inner}</div>`;
    stage.innerHTML = shell(
      '<div class="box"><span class="note" style="text-align:left">Press Play to ask for a proofread.</span></div>',
    );
    return async () => {
      stage.innerHTML = shell(
        '<div class="box busy"><span class="note" style="text-align:left">Proofreading…</span></div>',
      );
      await wait(900);
      stage.innerHTML = shell(
        `<div class="box" data-moment="pen"><span class="tagl">Proofread · EN</span><div class="diff">The lake, <span data-part="del">frozen solid</span> <span data-part="ins">locked in ice</span>, stretches north.</div><div class="acts"><button type="button" class="btn primary small" data-moment="press">Accept</button><button type="button" class="btn small" data-moment="press">Dismiss</button></div></div>`,
      );
      const box = $('[data-moment="pen"]', stage);
      $('.btn.primary', box).onclick = () => state(box, 'done');
    };
  },
);

add(
  'Moments',
  'wind',
  'Schedule button',
  'The minute hand winds two turns, the hour hand lands on the time, then the pill reads it.',
  (stage) => {
    stage.innerHTML = `<div class="center"><div class="entry" data-moment="seal"><b>Paris, un an après</b><span class="meta">Article<span class="pill sched"><span data-part="fill"></span><span class="lab" data-part="label">Draft</span></span></span></div><div class="row-btns" style="align-items:center"><span class="when">Thu 6 Nov · 9:00</span><button type="button" class="btn" data-moment="press wind"><svg class="clock-ic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><line data-part="hour" x1="10" y1="10" x2="10" y2="6"/><line data-part="minute" x1="10" y1="10" x2="10" y2="3.8"/></svg>Schedule</button></div></div>`;
    const btn = $('[data-moment~="wind"]', stage);
    const pill = $('[data-moment="seal"]', stage);
    const go = async () => {
      state(btn, null);
      state(pill, null);
      $('.lab', pill).textContent = 'Draft';
      await frame();
      state(btn, 'done');
      await wait(560);
      $('.lab', pill).textContent = 'Scheduled · Thu 9:00';
      state(pill, 'done');
    };
    btn.onclick = go;
    return go;
  },
);

// ── Transitions ────────────────────────────────────────────────────────────────────────────────

add(
  'Transitions',
  'title-flight',
  'List → editor route',
  'The row’s title flies into the editor’s heading and back. Clicks during a flight wait for it to land.',
  (stage) => {
    stage.innerHTML = `<div class="mini-list"><h4>Article</h4>${TITLES.map((t, i) => `<div class="row" tabindex="0" data-i="${i}"><span class="t">${t}</span><small>Draft</small></div>`).join('')}</div><div class="mini-editor" hidden><button type="button" class="back">← Article</button><div class="heading"></div><span class="lbl"></span><div class="ln"></div><span class="lbl"></span><div class="ln short"></div></div>`;
    const list = $('.mini-list', stage);
    const ed = $('.mini-editor', stage);
    const heading = $('.heading', ed);
    const rest = () => [...ed.children].filter((c) => c !== heading);
    let open = null;
    const openRow = async (row) => {
      if (open) return;
      open = row;
      heading.textContent = $('.t', row).textContent;
      ed.hidden = false;
      play(list, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      rest().forEach((c, i) =>
        play(
          c,
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 300, delay: 150 + i * 30 },
        ),
      );
      await flight($('.t', row), heading);
      list.hidden = true;
      list.getAnimations().forEach((a) => a.cancel());
    };
    const back = async () => {
      const row = open;
      if (!row) return;
      list.hidden = false;
      play(list, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 80 });
      rest().forEach((c) =>
        play(c, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }),
      );
      await flight(heading, $('.t', row));
      ed.hidden = true;
      rest().forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
      open = null;
    };
    $$('.row', stage).forEach((r) => (r.onclick = () => openRow(r)));
    $('.back', ed).onclick = back;
    return async () => {
      if (open) await back();
      await openRow($$('.row', stage)[1]);
      await wait(900);
      await back();
    };
  },
  'flight()',
);

add(
  'Transitions',
  'grow-from',
  'Create → editor route',
  'The “+ New” button grows into the new editor; “← Article” shrinks it back.',
  (stage) => {
    stage.innerHTML = `<div class="mini-list"><div class="chead"><h4>Article</h4><button type="button" class="btn primary small newbtn" data-moment="press">+ New article</button></div>${TITLES.map((t) => `<div class="row"><b>${t}</b><small>Draft</small></div>`).join('')}</div><div class="grown" hidden><button type="button" class="linky" style="justify-self:start;padding:0">← Article</button><div class="gtitle">Untitled</div><span class="lbl"></span><div class="ln"></div><span class="lbl"></span><div class="ln short"></div></div>`;
    const btn = $('.newbtn', stage);
    const view = $('.grown', stage);
    const open = async () => {
      view.hidden = false;
      await growFrom(btn, view);
    };
    const close = async () => {
      await growFrom(btn, view, { back: true });
      view.hidden = true;
    };
    btn.onclick = open;
    $('.linky', view).onclick = close;
    return async () => {
      if (!view.hidden) await close();
      await open();
      await wait(1000);
      await close();
    };
  },
  'growFrom()',
);

add(
  'Transitions',
  'unfold',
  'Drawer, Disclosure',
  'Height and opacity, the rows following one another. Closing is a third quicker.',
  (stage) => {
    stage.innerHTML = `<div class="drawer-wrap"><button type="button" class="btn small" data-moment="press" aria-expanded="false">More fields</button><div class="drawer" data-moment="unfold"><div class="row"><b>SEO title</b><small>text</small></div><div class="row"><b>Canonical link</b><small>url</small></div><div class="row"><b>Hide from search</b><small>yes / no</small></div></div></div>`;
    const btn = $('button', stage);
    const drawer = $('.drawer', stage);
    const toggle = () => {
      const open = drawer.dataset.state !== 'open';
      btn.setAttribute('aria-expanded', String(open));
      state(drawer, open ? 'open' : null);
    };
    btn.onclick = toggle;
    return async () => {
      if (drawer.dataset.state === 'open') {
        toggle();
        await wait(400);
      }
      toggle();
    };
  },
);

add(
  'Transitions',
  'dialog',
  'Dialog, Popover, Menu',
  'The backdrop fades while the dialog rises and lands. Closing is quicker and does not rise.',
  (stage) => {
    stage.innerHTML = `<div class="rows">${TITLES.map((t) => `<div class="row"><b>${t}</b></div>`).join('')}<button type="button" class="btn small" data-moment="press" style="justify-self:start">Empty the bin…</button></div>`;
    const open = () => {
      if ($('.dlg', stage)) return;
      stage.insertAdjacentHTML(
        'beforeend',
        `<div class="scrim" data-part="backdrop"></div><div class="dlg" data-moment="dialog" role="dialog" aria-label="Empty the bin"><h5>Empty the bin?</h5><p>Three items go for good.</p><div class="acts"><button type="button" class="btn small" data-moment="press">Keep them</button><button type="button" class="btn danger small" data-moment="press">Empty the bin</button></div></div>`,
      );
      const dlg = $('.dlg', stage);
      const close = async () => {
        state(dlg, 'leaving');
        await settled(dlg);
        $('.scrim', stage)?.remove();
        dlg.remove();
      };
      $$('button', dlg).forEach((b) => (b.onclick = close));
      $('.scrim', stage).onclick = close;
      return close;
    };
    $('.rows .btn', stage).onclick = open;
    return async () => {
      const close = open();
      if (!close) return;
      await wait(1600);
      await close();
    };
  },
);

add(
  'Transitions',
  'bin',
  'Rows in every list',
  'The row slides aside, then its gap closes. Undo opens the gap and brings it back with a change mark.',
  (stage) => {
    const names = [
      ['Lexique', 'Glossary'],
      ['Agenda', 'Events'],
      ['Équipe', 'People'],
      ['Archives', 'Pages'],
    ];
    stage.innerHTML = `<div class="bin-list">${names.map(([a, b]) => `<div class="row"><b>${a}</b><small>${b}</small><button type="button" class="bin-btn">Bin</button></div>`).join('')}</div><div class="undo-bar" hidden><span></span><button type="button">Undo</button></div>`;
    const bar = $('.undo-bar', stage);
    let last = null;
    const remove = async (row) => {
      last = row;
      $('span', bar).textContent = `“${$('b', row).textContent}” moved to the bin`;
      bar.hidden = false;
      await bin(row);
      row.hidden = true;
    };
    const undo = async () => {
      const row = last;
      if (!row) return;
      last = null;
      bar.hidden = true;
      row.hidden = false;
      row.removeAttribute('data-moment');
      $('[data-part="bar"]', row)?.remove();
      await bin(row, { back: true });
      row.dataset.moment = 'change-mark';
      row.insertAdjacentHTML('afterbegin', '<span data-part="bar"></span>');
    };
    $$('.bin-btn', stage).forEach((b) => (b.onclick = () => remove(b.closest('.row'))));
    $('button', bar).onclick = undo;
    return async () => {
      if (last) await undo();
      await remove($$('.row', stage)[1]);
      await wait(700);
      await undo();
    };
  },
  'bin()',
);

add(
  'Transitions',
  'lift',
  'Sortable lists',
  'The row lifts (tilts in Discothèque), follows the pointer, the others glide aside, and it lands.',
  (stage) => {
    const names = ['Title', 'Excerpt', 'Cover image', 'Body'];
    stage.innerHTML = `<div class="drag-list">${names.map((n) => `<div class="row" data-moment="lift"><span class="grip" aria-hidden="true">⋮⋮</span><b>${n}</b></div>`).join('')}</div>`;
    const rows = $$('.row', stage);
    let order = rows.slice();
    const STEP = 46;
    const layout = (except) =>
      order.forEach((r, i) => r !== except && (r.style.transform = `translateY(${i * STEP}px)`));
    layout();
    const moveTo = (r, y) => {
      r.style.transform = `translateY(${y}px)`;
      const slot = Math.max(0, Math.min(order.length - 1, Math.round(y / STEP)));
      if (order.indexOf(r) !== slot) {
        order.splice(order.indexOf(r), 1);
        order.splice(slot, 0, r);
        layout(r);
      }
    };
    const drop = (r) => {
      state(r, null);
      layout();
    };
    rows.forEach((r) => {
      r.onpointerdown = (e) => {
        r.setPointerCapture(e.pointerId);
        const start = e.clientY;
        const base = order.indexOf(r) * STEP;
        state(r, 'lifted');
        r.onpointermove = (ev) =>
          moveTo(
            r,
            Math.max(-8, Math.min((order.length - 1) * STEP + 8, base + ev.clientY - start)),
          );
        r.onpointerup = r.onpointercancel = () => {
          r.onpointermove = r.onpointerup = r.onpointercancel = null;
          drop(r);
        };
      };
    });
    return async () => {
      const r = order[0];
      state(r, 'lifted');
      const t0 = performance.now();
      await new Promise((done) => {
        const step = (now) => {
          const k = Math.min(1, (now - t0) / 900);
          const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
          moveTo(r, e * 2 * STEP);
          k < 1 ? requestAnimationFrame(step) : done();
        };
        requestAnimationFrame(step);
      });
      await wait(120);
      drop(r);
    };
  },
);

add(
  'Transitions',
  'wait',
  'Skeleton',
  'Nothing for 200 ms, so a fast load shows no skeleton; a slow one gets a soft sweep.',
  (stage) => {
    stage.innerHTML = `<div class="load"></div><div class="foot"><button type="button" class="btn small" data-ms="1400">Slow load</button><button type="button" class="btn small" data-ms="140">Fast load</button></div>`;
    const box = $('.load', stage);
    const content = () =>
      TITLES.map((t) => `<div class="row"><b>${t}</b><small>Draft</small></div>`).join('');
    box.innerHTML = content();
    let token = 0;
    const load = async (ms) => {
      const me = ++token;
      box.innerHTML = `<div data-moment="wait" style="display:grid;gap:8px">${'<span data-part="bone"></span>'.repeat(3)}</div>`;
      await wait(ms);
      if (me !== token) return;
      box.innerHTML = content();
      $$('.row', box).forEach((r, i) =>
        play(
          r,
          [
            { opacity: 0, transform: 'translateY(4px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 250, delay: i * 30 },
        ),
      );
    };
    $$('[data-ms]', stage).forEach((b) => (b.onclick = () => load(+b.dataset.ms)));
    return async () => {
      await load(1400);
      await wait(600);
      await load(140);
    };
  },
);

add(
  'Transitions',
  'lights',
  'Theme switch',
  'The new lighting spreads as a circle from the switch (Folio and reduced motion: a cross-fade). Switches this whole page.',
  (stage) => {
    stage.innerHTML = `<div class="center"><button type="button" class="btn primary" data-moment="press">Switch the lights</button></div>`;
    const btn = $('button', stage);
    btn.onclick = () => {
      const r = btn.getBoundingClientRect();
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      return switchLights(() => document.documentElement.setAttribute('data-theme', next), {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      });
    };
    return () => btn.onclick();
  },
  'switchLights()',
);

// ── Site ───────────────────────────────────────────────────────────────────────────────────────

add(
  'Site',
  'ticker',
  'LiveBand',
  'The track scrolls; it stops on hover and focus, and starts paused under reduced motion.',
  (stage) => {
    const items = [
      'Céleste published <em>Paris, un an après</em>',
      'Unit 7 uploaded 3 images',
      'Louise asked for a review of <em>Les androïdes timides</em>',
    ];
    const track = (hidden) =>
      `<div data-part="track"${hidden ? ' aria-hidden="true"' : ''}>${items.map((t) => `<span>${t}</span>`).join('')}</div>`;
    stage.innerHTML = `<div class="band" data-moment="ticker" style="--ticker-time: 24s"><span class="lbl2"><span data-part="dot"></span>En direct</span><div class="viewport" tabindex="0" aria-label="Recent activity">${track(false)}${track(true)}</div><button type="button" class="pause"></button></div>`;
    const band = $('.band', stage);
    const btn = $('.pause', stage);
    const running = () =>
      getComputedStyle($('[data-part="track"]', band)).animationPlayState === 'running' ||
      band.dataset.state === 'running';
    const label = () => {
      const on = band.dataset.state ? band.dataset.state === 'running' : running();
      btn.textContent = on ? '❚❚' : '▶';
      btn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    };
    btn.onclick = () => {
      const on = band.dataset.state ? band.dataset.state === 'running' : running();
      state(band, on ? 'paused' : 'running');
      label();
    };
    requestAnimationFrame(label);
    return () => btn.click();
  },
);

/** Every specimen: its group, name, where it lives, what it shows, and setup(stage) => play(). */
export const specimens = S;
export { groups };
