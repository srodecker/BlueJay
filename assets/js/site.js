/* ==========================================================================
   Rivosus Ranch - site.js
   Structural behaviour for the public site: navigation, header state,
   scroll reveal, hero parallax and the photographic lightbox.
   No dependencies.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Mobile navigation --------------------------------------- */

  function initNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('primaryNav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.setAttribute('data-open', String(open));
      document.body.setAttribute('data-nav-open', String(open));
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close when a destination is chosen.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when the layout leaves mobile width.
    window.matchMedia('(min-width: 881px)').addEventListener('change', function (m) {
      if (m.matches) setOpen(false);
    });
  }

  /* ---------- 2. Header state -------------------------------------------- */
  /* "over"   - transparent, sitting on top of the hero
     "pinned" - parchment bar, once the hero has scrolled away            */

  function initHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;

    var hero = document.getElementById('hero');

    // Interior pages have no hero: the bar is always solid.
    if (!hero) {
      header.setAttribute('data-mode', 'pinned');
      return;
    }

    var ticking = false;
    function update() {
      var threshold = Math.max(hero.offsetHeight - 120, 120);
      header.setAttribute('data-mode', window.scrollY > threshold ? 'pinned' : 'over');
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 3. Scroll reveal -------------------------------------------- */

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Hero parallax -------------------------------------------- */
  /* The stonework drifts a little slower than the page, so the wall reads as
     standing behind the type rather than pasted onto it.                   */

  function initParallax() {
    var stone = document.getElementById('heroStonework');
    var hero = document.getElementById('hero');
    if (!stone || !hero) return;

    // Let the entrance animation finish, then take ownership of `translate`.
    function settle() { stone.classList.add('is-settled'); }
    stone.addEventListener('animationend', settle, { once: true });
    setTimeout(settle, 2800); // fallback if the animation never fires

    if (reduceMotion) return;

    var ticking = false;
    function update() {
      var y = window.scrollY;
      if (y < hero.offsetHeight + 200) {
        stone.style.translate = '0 ' + (y * 0.18).toFixed(1) + 'px';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  /* ---------- 5. Lightbox --------------------------------------------------- */

  function initLightbox() {
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lightboxImg');
    var cap = document.getElementById('lightboxCap');
    var closeBtn = document.getElementById('lightboxClose');
    if (!box || !img || !closeBtn) return;

    var lastFocus = null;

    function open(src, caption, alt) {
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = alt || caption || '';
      if (cap) cap.textContent = caption || '';
      box.hidden = false;
      // Force a frame so the opacity transition runs.
      window.requestAnimationFrame(function () {
        box.setAttribute('data-open', 'true');
        closeBtn.focus();
      });
      document.body.style.overflow = 'hidden';
    }

    function close() {
      box.setAttribute('data-open', 'false');
      document.body.style.overflow = '';
      window.setTimeout(function () {
        box.hidden = true;
        img.src = '';
      }, 450);
      if (lastFocus) lastFocus.focus();
    }

    document.querySelectorAll('[data-lightbox]').forEach(function (fig) {
      var frame = fig.querySelector('.plate__frame') || fig;
      var inner = fig.querySelector('img');

      frame.setAttribute('role', 'button');
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('aria-label', 'Enlarge photograph');

      function fire() {
        open(
          fig.getAttribute('data-lightbox'),
          fig.getAttribute('data-lightbox-caption'),
          inner ? inner.alt : ''
        );
      }

      frame.addEventListener('click', fire);
      frame.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
      });
    });

    closeBtn.addEventListener('click', close);
    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.getAttribute('data-open') === 'true') close();
    });
  }

  /* ---------- 6. Footer year ------------------------------------------------ */

  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- 7. Unlisted portal shortcut ----------------------------------- */
  /*
     Convenience only, NOT access control. The public pages carry no link to
     the investor portal; typing the word below jumps there so you do not have
     to keep the URL in your head. Anyone reading this file can see the path,
     which is precisely why the portal itself must sit behind real server-side
     authentication before anything confidential lives on it. See README.md.
  */

  function initShortcut() {
    var target = ['por', 'tfo', 'lio'].join('');   // /portfolio/
    var word = ['ri', 'vo', 'sus'].join('');       // type this anywhere
    var buffer = '';

    document.addEventListener('keydown', function (e) {
      // Ignore typing inside form fields.
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.key.length !== 1) return;

      buffer = (buffer + e.key.toLowerCase()).slice(-word.length);
      if (buffer === word) {
        buffer = '';
        window.location.href = '/' + target + '/';
      }
    });
  }

  /* ---------- 8. Boot -------------------------------------------------------- */

  function boot() {
    initNav();
    initHeader();
    initReveal();
    initParallax();
    initLightbox();
    initYear();
    initShortcut();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
