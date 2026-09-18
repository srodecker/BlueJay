/* ==========================================================================
   Rivosus Ranch - portal.js
   Behaviour for the private investor area: the passphrase gate, session
   persistence, and the archive filter.

   ------------------------------------------------------------------------
   READ THIS BEFORE YOU TRUST IT
   ------------------------------------------------------------------------
   The gate below is OBFUSCATION, NOT SECURITY. Everything it guards has
   already been delivered to the browser before the gate is drawn, and the
   PDF under /portfolio/docs/ can be fetched directly by anyone who guesses
   or is given the URL. A determined visitor needs only View Source.

   It is genuinely useful for one thing: keeping the portal out of casual
   sight and out of search results. If the material behind it must actually
   stay private, put server-side authentication in front of /portfolio/*.
   README.md gives three ways to do that, none of which take more than
   about ten minutes.
   ========================================================================== */

(function () {
  'use strict';

  /* Salted SHA-256 of the passphrase. To change it, see README.md ->
     "Changing the portal passphrase". */
  var PASS_SHA256 = '27fccf48c05d90953c634f49f837c428033118aaf5f3b54a0f2f01d7d931a9e8';
  var PASS_FNV32  = '2141ae1f';   // fallback for non-secure contexts
  var SALT = 'rivosus::';
  var SESSION_KEY = 'rr.portal.session';

  /* ---------- Hashing ------------------------------------------------------ */

  function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) return Promise.resolve(null);
    var bytes = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
      return Array.prototype.map
        .call(new Uint8Array(buf), function (b) { return ('00' + b.toString(16)).slice(-2); })
        .join('');
    });
  }

  /* Used only where crypto.subtle is unavailable (e.g. a page opened over
     plain file:// in some browsers). No weaker in practice than the above,
     given everything is client side regardless. */
  function fnv1aHex(text) {
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  function verify(passphrase) {
    var salted = SALT + passphrase;
    return sha256Hex(salted).then(function (hex) {
      if (hex) return hex === PASS_SHA256;
      return fnv1aHex(salted) === PASS_FNV32;
    });
  }

  /* ---------- Session ------------------------------------------------------ */

  function isUnlocked() {
    try { return window.sessionStorage.getItem(SESSION_KEY) === 'open'; }
    catch (e) { return false; }
  }

  function remember() {
    try { window.sessionStorage.setItem(SESSION_KEY, 'open'); } catch (e) { /* private mode */ }
  }

  function forget() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- Gate --------------------------------------------------------- */

  function initGate() {
    var gate = document.getElementById('gate');
    if (!gate) return;

    var card = gate.querySelector('.gate__card');
    var form = document.getElementById('gateForm');
    var input = document.getElementById('gateInput');
    var error = document.getElementById('gateError');

    function unlock(skipFocus) {
      gate.setAttribute('data-unlocked', 'true');
      document.body.removeAttribute('data-locked');
      window.setTimeout(function () { gate.hidden = true; }, 650);
      if (!skipFocus) {
        var h1 = document.querySelector('.dossier__title');
        if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus(); }
      }
    }

    if (isUnlocked()) { gate.hidden = true; gate.setAttribute('data-unlocked', 'true'); document.body.removeAttribute('data-locked'); return; }

    document.body.setAttribute('data-locked', 'true');
    window.setTimeout(function () { if (input) input.focus(); }, 400);

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (input.value || '').trim();
      if (!value) return;

      verify(value).then(function (ok) {
        if (ok) {
          error.textContent = '';
          remember();
          unlock(false);
        } else {
          error.textContent = 'Not recognised';
          input.value = '';
          input.focus();
          card.classList.remove('is-wrong');
          void card.offsetWidth;          // restart the animation
          card.classList.add('is-wrong');
        }
      });
    });
  }

  /* ---------- Sign out ------------------------------------------------------ */

  function initSignOut() {
    document.querySelectorAll('[data-signout]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        forget();
        window.location.href = '/';
      });
    });
  }

  /* ---------- Archive filter ------------------------------------------------ */

  function initFilter() {
    var bar = document.getElementById('filterbar');
    var table = document.getElementById('fileTable');
    if (!bar || !table) return;

    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('.filterbar__btn'));
    var empty = document.getElementById('fileEmpty');

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filterbar__btn');
      if (!btn) return;

      var filter = btn.getAttribute('data-filter');
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });

      var shown = 0;
      rows.forEach(function (row) {
        var match = filter === 'all' || row.getAttribute('data-category') === filter;
        row.hidden = !match;
        if (match) shown++;
      });

      if (empty) empty.hidden = shown !== 0;
    });
  }

  /* ---------- PDF embed fallback --------------------------------------------- */
  /* Some mobile browsers refuse to render an inline PDF. If the frame never
     paints, surface the download link instead of an empty grey box. */

  function initDocFallback() {
    var frame = document.getElementById('docFrame');
    var fallback = document.getElementById('docFallback');
    if (!frame || !fallback) return;

    // Narrow viewports: skip the embed entirely, it is never good there.
    if (window.matchMedia('(max-width: 720px)').matches) {
      frame.hidden = true;
      fallback.hidden = false;
      return;
    }

    var painted = false;
    frame.addEventListener('load', function () { painted = true; });
    window.setTimeout(function () {
      if (!painted) { frame.hidden = true; fallback.hidden = false; }
    }, 3500);
  }

  /* ---------- Boot ------------------------------------------------------------ */

  function boot() {
    initGate();
    initSignOut();
    initFilter();
    initDocFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
