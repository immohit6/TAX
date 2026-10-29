'use strict';
/* BAS Quarter. Plain JS, no dependencies. All data lives in localStorage on the user's device. */

var KEY = 'bas-quarter-v1';
var QMONTHS = { 1: ['Jul', 'Aug', 'Sep'], 2: ['Oct', 'Nov', 'Dec'], 3: ['Jan', 'Feb', 'Mar'], 4: ['Apr', 'May', 'Jun'] };
var SECTIONS = {
  income: { title: 'Income (gross, incl. GST)', note: 'Gross fares, fees, bonuses and tips from each platform\'s monthly tax summary, before their service fee.', total: 'Total sales', add: 'Add income line' },
  gst: { title: 'Expenses with GST', note: 'Anything that included GST on the receipt. Tick "× business %" for shared costs like the car and phone.', total: 'Total purchases (G11)', add: 'Add expense line' },
  nogst: { title: 'Expenses without GST', note: 'These stay off the BAS. They still reduce income tax in your return, at the same business-use %.', total: 'Business portion', add: 'Add no-GST line' }
};

/* Starter lines for a brand-new person. Rideshare-flavoured, all zero, fully editable. */
function starterLines() {
  var L = function (sec, label, pct) { return { id: uid(), sec: sec, label: label, pct: !!pct, v: [0, 0, 0] }; };
  return [
    L('income', 'Rideshare platform 1'), L('income', 'Rideshare platform 2'),
    L('gst', 'Fuel', 1), L('gst', 'Insurance (GST part)', 1), L('gst', 'Phone', 1), L('gst', 'Tolls', 1),
    L('gst', 'Car wash', 1), L('gst', 'Servicing and repairs', 1), L('gst', 'Parking', 1),
    L('gst', 'Platform service fees'),
    L('nogst', 'Registration (incl. CTP)', 1), L('nogst', 'Car loan interest', 1), L('nogst', 'Bank fees', 1)
  ];
}

function uid() { return Math.random().toString(36).slice(2, 9); }
function num(x) { var n = parseFloat(x); return isFinite(n) ? n : 0; }
function sum(a) { return a.reduce(function (t, x) { return t + num(x); }, 0); }
function money(n) { return (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function clampPct(x) { return Math.min(100, Math.max(0, num(x))); }

/* Pure calculation. Same maths as the original worksheet. */
function calc(q) {
  var I = 0, P = 0, N = 0, byMonth = [];
  for (var m = 0; m < 3; m++) {
    var p = clampPct(q.pct[m]) / 100, inc = 0, pur = 0, nog = 0;
    q.lines.forEach(function (l) {
      var v = num(l.v[m]);
      if (l.sec === 'income') inc += v;
      else if (l.sec === 'gst') pur += l.pct ? v * p : v;
      else if (l.sec === 'nogst') nog += l.pct ? v * p : v;
    });
    I += inc; P += pur; N += nog;
    byMonth.push({ income: inc, purchases: pur, nogst: nog });
  }
  var a1 = I / 11, b1 = P / 11;
  return { g1: I, a1: a1, g11: P, b1: b1, net: a1 - b1, nogst: N, byMonth: byMonth };
}

/* ---------- state ---------- */
function blankState() { return { v: 1, profile: { name: '', abn: '' }, current: '', quarters: {} }; }

function sanitize(raw) {
  var s = blankState();
  if (!raw || typeof raw !== 'object') return s;
  var pr = raw.profile || {};
  s.profile.name = String(pr.name || '').slice(0, 80);
  s.profile.abn = String(pr.abn || '').replace(/[^\d ]/g, '').slice(0, 14);
  var qs = raw.quarters || {};
  Object.keys(qs).forEach(function (k) {
    var m = /^(\d{4})-(\d{2})-Q([1-4])$/.exec(k);
    var q = qs[k];
    if (!m || !q || !Array.isArray(q.lines)) return;
    s.quarters[k] = {
      pct: [0, 1, 2].map(function (i) { return clampPct((q.pct || [])[i]); }),
      lines: q.lines.slice(0, 80).map(function (l) {
        return {
          id: String(l.id || uid()).slice(0, 12).replace(/[^\w-]/g, ''),
          sec: SECTIONS[l.sec] ? l.sec : 'gst',
          label: String(l.label || '').slice(0, 60),
          pct: !!l.pct,
          v: [0, 1, 2].map(function (i) { return Math.max(0, num((l.v || [])[i])); })
        };
      })
    };
  });
  s.current = s.quarters[raw.current] ? raw.current : (Object.keys(s.quarters).sort().pop() || '');
  return s;
}

function qKey(fyStart, q) { return fyStart + '-' + String((fyStart + 1) % 100).padStart(2, '0') + '-Q' + q; }
function qInfo(key) {
  var m = /^(\d{4})-(\d{2})-Q([1-4])$/.exec(key); if (!m) return null;
  var fy = +m[1], q = +m[3];
  return { fy: fy, q: q, months: QMONTHS[q], fyLabel: m[1] + '–' + m[2], label: 'Q' + q + ' ' + m[1] + '–' + m[2] };
}
function guessCurrentQuarter(d) {
  var mo = d.getMonth() + 1, y = d.getFullYear();
  var fy = mo >= 7 ? y : y - 1;
  var q = mo >= 7 && mo <= 9 ? 1 : mo >= 10 ? 2 : mo <= 3 ? 3 : 4;
  return { fy: fy, q: q };
}

/* ---------- node test hook ---------- */
if (typeof document === 'undefined') {
  module.exports = { calc: calc, sanitize: sanitize, qKey: qKey, qInfo: qInfo, starterLines: starterLines, money: money };
} else {
  (function () {
    var S, saveTimer;
    var $ = function (id) { return document.getElementById(id); };

    function load() { try { return sanitize(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return blankState(); } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { say('Could not save here. Export a backup from Settings.'); } }
    function say(t) { $('status').textContent = t; clearTimeout(saveTimer); saveTimer = setTimeout(function () { $('status').textContent = ''; }, 3500); }
    function cur() { return S.quarters[S.current]; }

    function el(tag, attrs, kids) {
      var e = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (k) {
        if (k === 'text') e.textContent = attrs[k];
        else if (k === 'class') e.className = attrs[k];
        else if (k === 'checked' || k === 'value') e[k] = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
      (kids || []).forEach(function (c) { e.appendChild(c); });
      return e;
    }

    /* ---------- render ---------- */
    function renderQuarterSelect() {
      var sel = $('quarter'); sel.textContent = '';
      var keys = Object.keys(S.quarters).sort().reverse();
      keys.forEach(function (k) {
        var o = el('option', { value: k, text: qInfo(k).label }); if (k === S.current) o.selected = true; sel.appendChild(o);
      });
      sel.disabled = !keys.length;
    }

    function renderHeader() {
      var who = [S.profile.name, S.profile.abn ? 'ABN ' + S.profile.abn : ''].filter(Boolean).join(' · ');
      $('who').textContent = who || 'Tap Settings to add your name and ABN';
      var qi = S.current && qInfo(S.current);
      $('qdesc').textContent = qi ? qi.months.join(' · ') + ' · financial year ' + qi.fyLabel : 'Create your first quarter to begin.';
    }

    function renderPct(q, qi) {
      var box = $('pct-row'); box.textContent = '';
      for (var m = 0; m < 3; m++) {
        (function (m) {
          var inp = el('input', { class: 'pct', type: 'number', inputmode: 'decimal', min: 0, max: 100, step: 1, value: String(q.pct[m]), 'aria-label': 'Business use percent, ' + qi.months[m] });
          inp.dataset.p = m;
          box.appendChild(el('div', {}, [el('div', { class: 'mh', text: qi.months[m] }), inp]));
        })(m);
      }
    }

    function renderSection(sec, q, qi) {
      var host = $('sec-' + sec), cfg = SECTIONS[sec]; host.textContent = '';
      host.appendChild(el('h2', { text: cfg.title }));
      host.appendChild(el('p', { class: 'note', text: cfg.note }));
      var heads = el('div', { class: 'nums' }, qi.months.map(function (mn) { return el('div', { class: 'mh', text: mn }); }));
      host.appendChild(heads);
      q.lines.forEach(function (l, idx) {
        if (l.sec !== sec) return;
        var name = el('input', { class: 'lname', value: l.label, 'aria-label': 'Line name', placeholder: 'Name this line' });
        name.dataset.id = l.id; name.dataset.f = 'label';
        var del = el('button', { type: 'button', class: 'x', 'aria-label': 'Remove ' + (l.label || 'line'), text: '×' });
        del.dataset.del = l.id;
        var nums = el('div', { class: 'nums' });
        for (var m = 0; m < 3; m++) {
          var inp = el('input', { class: 'num', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: l.v[m] ? String(l.v[m]) : '', placeholder: '0.00', 'aria-label': (l.label || 'Line') + ', ' + qi.months[m] });
          inp.dataset.id = l.id; inp.dataset.m = m; nums.appendChild(inp);
        }
        var tot = el('span', { class: 'lt', text: 'Line total ' + money(sum(l.v)) }); tot.dataset.lt = l.id;
        var foot = el('div', { class: 'ltot' }, [tot]);
        if (sec !== 'income') {
          var cb = el('input', { type: 'checkbox', checked: l.pct }); cb.dataset.id = l.id; cb.dataset.f = 'pct';
          foot.appendChild(el('label', { class: 'chk' }, [cb, el('span', { text: '× business %' })]));
        }
        host.appendChild(el('div', { class: 'line' }, [el('div', { class: 'lhead' }, [name, del]), nums, foot]));
      });
      var add = el('button', { type: 'button', class: 'addline', text: '+ ' + cfg.add }); add.dataset.add = sec; host.appendChild(add);
      var st = el('div', { class: 'subtotal' }, [el('span', { text: cfg.total }), el('span', { text: '$0.00' })]);
      st.lastChild.id = 'st-' + sec; host.appendChild(st);
    }

    function renderAll() {
      renderHeader(); renderQuarterSelect();
      var q = cur(), qi = S.current && qInfo(S.current);
      ['income', 'gst', 'nogst'].forEach(function (s) { $('sec-' + s).hidden = !q; });
      $('pct-row').parentNode.hidden = !q;
      if (!q) { update(); return; }
      renderPct(q, qi);
      ['income', 'gst', 'nogst'].forEach(function (s) { renderSection(s, q, qi); });
      update();
    }

    /* Update numbers only, so inputs keep focus while typing. */
    function update() {
      var q = cur();
      var r = q ? calc(q) : { g1: 0, a1: 0, g11: 0, b1: 0, net: 0, nogst: 0 };
      $('g1').textContent = money(r.g1); $('a1').textContent = money(r.a1);
      $('g11').textContent = money(r.g11); $('b1').textContent = money(r.b1);
      var lbl = r.net >= 0 ? 'GST to pay' : 'GST refund';
      $('netlbl').textContent = lbl; $('bar-lbl').textContent = lbl;
      $('net').textContent = money(Math.abs(r.net)); $('bar-net').textContent = money(Math.abs(r.net));
      $('ng').textContent = money(r.nogst);
      if (q) {
        var base = { income: 0, gst: 0, nogst: 0 };
        for (var m = 0; m < 3; m++) {
          var p = clampPct(q.pct[m]) / 100;
          q.lines.forEach(function (l) { var v = num(l.v[m]); base[l.sec] += l.sec === 'income' || !l.pct ? v : v * p; });
        }
        ['income', 'gst', 'nogst'].forEach(function (s) { var n = $('st-' + s); if (n) n.textContent = money(base[s]); });
        q.lines.forEach(function (l) { var n = document.querySelector('[data-lt="' + l.id + '"]'); if (n) n.textContent = 'Line total ' + money(sum(l.v)); });
      }
      var flag = $('pctflag');
      var hi = q && q.pct.some(function (p) { return clampPct(p) >= 100; }) && q.lines.some(function (l) { return l.pct && sum(l.v) > 0; });
      flag.hidden = !hi;
      flag.textContent = hi ? 'Business use is 100% in a month. If you also use the car or phone privately, lower it to your real share.' : '';
    }

    /* ---------- events ---------- */
    document.addEventListener('input', function (e) {
      var t = e.target, q = cur(); if (!q) return;
      if (t.dataset.p !== undefined) { q.pct[+t.dataset.p] = clampPct(t.value); }
      else if (t.dataset.m !== undefined) { var l = q.lines.find(function (x) { return x.id === t.dataset.id; }); if (l) l.v[+t.dataset.m] = Math.max(0, num(t.value)); }
      else if (t.dataset.f === 'label') { var l2 = q.lines.find(function (x) { return x.id === t.dataset.id; }); if (l2) l2.label = t.value.slice(0, 60); }
      else if (t.dataset.f === 'pct') { var l3 = q.lines.find(function (x) { return x.id === t.dataset.id; }); if (l3) l3.pct = t.checked; }
      else return;
      update(); save();
    });

    document.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var q = cur();
      if (b.dataset.add && q) {
        q.lines.push({ id: uid(), sec: b.dataset.add, label: '', pct: false, v: [0, 0, 0] });
        save(); renderAll();
        var names = document.querySelectorAll('#sec-' + b.dataset.add + ' .lname'); if (names.length) names[names.length - 1].focus();
      } else if (b.dataset.del && q) {
        var l = q.lines.find(function (x) { return x.id === b.dataset.del; });
        if (l && (sum(l.v) === 0 || confirm('Remove "' + (l.label || 'this line') + '" and its amounts?'))) {
          q.lines = q.lines.filter(function (x) { return x.id !== b.dataset.del; }); save(); renderAll();
        }
      }
    });

    $('quarter').addEventListener('change', function () { S.current = this.value; save(); renderAll(); });

    function summaryText() {
      var q = cur(); if (!q) return '';
      var r = calc(q), qi = qInfo(S.current);
      return ['BAS ' + qi.label + (S.profile.abn ? ' (ABN ' + S.profile.abn + ')' : ''),
        'G1 ' + money(r.g1), '1A ' + money(r.a1), 'G11 ' + money(r.g11), '1B ' + money(r.b1),
        (r.net >= 0 ? 'GST to pay ' : 'GST refund ') + money(Math.abs(r.net))].join('\n');
    }
    $('btn-copy').addEventListener('click', function () {
      var t = summaryText(); if (!t) return say('Nothing to copy yet.');
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { say('Copied BAS figures.'); }, function () { say('Copy was blocked. Try Share summary instead.'); });
    });
    $('btn-share').addEventListener('click', function () {
      var t = summaryText(); if (!t) return say('Nothing to share yet.');
      if (navigator.share) navigator.share({ text: t }).catch(function () {}); else say('Sharing is not available here. Use Copy instead.');
    });

    /* settings */
    $('btn-settings').addEventListener('click', function () { $('s-name').value = S.profile.name; $('s-abn').value = S.profile.abn; $('dlg-settings').showModal(); });
    $('s-name').addEventListener('input', function () { S.profile.name = this.value.slice(0, 80); save(); renderHeader(); });
    $('s-abn').addEventListener('input', function () { S.profile.abn = this.value.replace(/[^\d ]/g, '').slice(0, 14); this.value = S.profile.abn; save(); renderHeader(); });
    $('btn-export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'bas-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
    $('btn-import').addEventListener('click', function () { $('file').click(); });
    $('file').addEventListener('change', function () {
      var f = this.files[0]; this.value = ''; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var inc = sanitize(JSON.parse(r.result));
          if (!Object.keys(inc.quarters).length) throw new Error('empty');
          if (Object.keys(S.quarters).length && !confirm('Importing replaces the data on this device. Continue?')) return;
          S = inc; save(); renderAll(); $('dlg-settings').close(); say('Backup imported.');
        } catch (err) { alert('That file is not a valid backup.'); }
      };
      r.readAsText(f);
    });
    $('btn-wipe').addEventListener('click', function () {
      if (confirm('Delete everything saved on this device? Export a backup first if you might need it.')) {
        S = blankState(); try { localStorage.removeItem(KEY); } catch (e) {} $('dlg-settings').close(); renderAll(); openNewQuarter();
      }
    });

    /* new quarter */
    function openNewQuarter() {
      var g = guessCurrentQuarter(new Date()), fy = $('nq-fy'); fy.textContent = '';
      for (var y = g.fy + 1; y >= g.fy - 6; y--) fy.appendChild(el('option', { value: y, text: y + '–' + String((y + 1) % 100).padStart(2, '0') }));
      fy.value = g.fy; $('nq-q').value = g.q;
      $('nq-copy').checked = !!cur(); $('nq-copy').disabled = !cur();
      $('dlg-newq').showModal();
    }
    $('btn-newq').addEventListener('click', openNewQuarter);
    $('f-newq').addEventListener('submit', function (e) {
      var v = e.submitter && e.submitter.value; if (v !== 'ok') return;
      var key = qKey(+$('nq-fy').value, +$('nq-q').value);
      if (S.quarters[key]) { S.current = key; save(); renderAll(); return say('That quarter already exists. Switched to it.'); }
      var src = cur();
      S.quarters[key] = ($('nq-copy').checked && src)
        ? { pct: src.pct.slice(), lines: src.lines.map(function (l) { return { id: uid(), sec: l.sec, label: l.label, pct: l.pct, v: [0, 0, 0] }; }) }
        : { pct: [100, 100, 100], lines: starterLines() };
      S.current = key; save(); renderAll();
    });

    /* ---------- boot ---------- */
    S = load(); renderAll();
    if (!Object.keys(S.quarters).length) openNewQuarter();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
  })();
}
