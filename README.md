# Rivosus Ranch — www.rivosus.com

A static site framework. No build step, no dependencies, no package manager.
Every file here can be opened in a browser or uploaded to any host as-is.

---

## 1. Structure

```
BlueJay Site/
├── index.html                  Public landing page (the blank canvas)
├── robots.txt                  Crawler policy — see the note inside it
├── sitemap.xml                 Public URLs only
├── README.md
│
├── assets/
│   ├── css/
│   │   ├── base.css            Tokens, reset, typography, header, footer
│   │   ├── site.css            Public page components
│   │   └── portal.css          Private area components
│   ├── js/
│   │   ├── site.js             Nav, header state, reveal, parallax, lightbox
│   │   └── portal.js           Gate, session, archive filter
│   └── img/                    All six image assets, original filenames intact
│
└── portfolio/                  ← PRIVATE. Unlisted; no public page links here.
    ├── index.html              Gate + category overview
    ├── philanthropic.html      01 — camp, charity, religious organisations
    ├── development.html        02 — residential lots, affordable housing
    ├── commercial.html         03 — wedding venue, boat storage, lodge
    ├── recreational.html       04 — glamping, campground, trails
    ├── archive.html            05 — file archive + embedded PDF study
    ├── .htaccess.example       Real access control — read this
    └── docs/
        └── BlueJay - Rivosus - Potential Uses.pdf
```

**Why the PDF lives in `portfolio/docs/` and not `assets/`:** so that a single
server rule over `/portfolio/*` protects the study and the pages together. If
the PDF sat in `assets/` it would still be publicly fetchable after you locked
the pages down, which would defeat the point.

---

## 2. Preview it locally

Open `index.html` in a browser and it will work. But the portal gate uses the
Web Crypto API, which some browsers only expose over `http(s)://`, and the
`/portfolio/` shortcut uses a root-relative path. So prefer a local server:

```bash
cd "C:\Users\Shane\Documents\BlueJay Site"
python -m http.server 8000
```

Then visit **http://localhost:8000**.

---

## 3. The public page

`index.html` is deliberately a heritage page and nothing else. It covers the
forest and streams, the stonework, the history and the location, and stops
there.

It contains **no** mention of development, subdivision, housing, events,
storage, camping, glamping, investment, sale, acreage yield or commercial use
of any kind, and **no link to `/portfolio/`**. Anything you add to it should
be held to that same line — the value of the page is what it omits.

### Getting into the portal

Because nothing on the public site links there, type the word **`rivosus`**
anywhere on the public page and it will navigate to `/portfolio/`. That is a
convenience for you, not a security feature; it is implemented in
`assets/js/site.js` and anyone reading that file can see it. Delete
`initShortcut()` if you would rather it did not exist.

---

## 4. The portal, and what its gate is actually worth

**The passphrase gate is obfuscation, not security.**

The whole page is delivered to the browser before the gate is drawn. View
Source shows everything. `portfolio/docs/*.pdf` can be fetched directly by URL
without ever meeting the gate. A salted SHA-256 of a short passphrase sitting
in a JavaScript file is minutes of work to break, and does not need breaking
anyway, because the content is already on the other side of it.

What the gate *does* buy you, honestly:

- it keeps the portal out of search results (with the `noindex` tags),
- it stops a casual or accidental visitor,
- it signals clearly that the material is confidential.

If the material genuinely needs to stay private, put server-side
authentication in front of `/portfolio/*`. Pick whichever matches your host:

| Host | What to do | Effort |
|---|---|---|
| **Apache / cPanel / shared hosting** | Rename `portfolio/.htaccess.example` to `.htaccess` and follow the steps inside it | ~10 min |
| **Cloudflare (any origin)** | Zero Trust → Access → Add an application → path `/portfolio/*`, policy "emails in list". Sends a one-time code to named recipients; no shared password to leak | ~15 min |
| **Netlify** | Site settings → Access control → password protection, or per-path rules via `_headers` / Netlify Identity | ~5 min |
| **Vercel** | Deployment Protection → Password Protection (Pro), or a middleware check | ~5 min |

Cloudflare Access is the one to choose if you want to know *who* opened the
file and to revoke one person without changing everyone's password.

Once a server-side rule is in place, the JS gate is harmless to leave in — it
just becomes a second, cosmetic door. There is no need to remove it.

### Changing the portal passphrase

The current passphrase is **`pineview1915`**.

To change it, generate the two hashes and paste them into
`assets/js/portal.js`:

```bash
python -c "
import hashlib
p = 'YOUR-NEW-PASSPHRASE'
s = 'rivosus::' + p
h = 2166136261
for ch in s.encode('utf-8'):
    h ^= ch; h = (h * 16777619) & 0xFFFFFFFF
print('PASS_SHA256 =', hashlib.sha256(s.encode()).hexdigest())
print('PASS_FNV32  =', format(h, '08x'))
"
```

Replace the `PASS_SHA256` and `PASS_FNV32` constants at the top of
`assets/js/portal.js`. The salt (`rivosus::`) exists so that a plain rainbow
table lookup of the passphrase alone fails; change it too if you like, as long
as it matches the `SALT` constant.

The unlock is remembered in `sessionStorage`, so it lasts until the browser
tab is closed. "Sign out" clears it.

---

## 5. Editing content

### Categories and concepts

Each category page (`philanthropic.html`, `development.html`,
`commercial.html`, `recreational.html`) is built from repeating `.concept`
blocks. To add one, copy an existing `<article class="concept">` and edit it.

The status chip takes one of three classes:

- `chip--priority` (amber) — actively pursued
- `chip--concept` (green) — under consideration
- `chip--study` (blue) — needs work before it can be judged

A `concept__meta` value carrying the class `v--todo` renders as an unfilled
placeholder in grey italic — that is how the "To be modelled" and "To be
confirmed" rows appear:

```html
<li><span class="k">Capital</span><span class="v v--todo">To be modelled</span></li>
<li><span class="k">Season</span><span class="v">Summer</span></li>
```

**Every financial figure in the portfolio is currently such a placeholder** —
no numbers have been invented. As diligence comes in, replace the text and
drop the `v--todo` class and the row restyles itself as a known value.

> These four pages were generated from a shared template so their chrome could
> not drift apart. They are now plain static HTML — edit them directly; there
> is nothing to re-run.

### Adding files to the archive

Drop the file into `portfolio/docs/`, then add a `<tr>` to the table in
`portfolio/archive.html` with a `data-category` of `study`, `photography` or
`identity`. The filter bar picks it up with no further work. For a new
category, add a button to the filter bar with a matching `data-filter`.

### Contact addresses

Placeholders are in use and should be changed before launch:

- `enquiries@rivosus.com` — public page (`index.html`, footer and Enquiries)
- `invest@rivosus.com` — portal footers

---

## 6. Design notes

**Palette** is taken from the assets themselves: the deep pine of
`Rivosus Ranch Seal.png` (`#0E3B24`), a warm parchment drawn from the 1917
photography, stone greys, and a brass accent that echoes the gold in the RPI
mark.

**Type** is Cormorant Garamond for display and Spectral for body, loaded from
Google Fonts with full system-serif fallbacks. If you would rather not call
out to Google, delete the two `<link rel="preconnect">` tags and the fonts
`<link>` from each page — the fallback stack is deliberately good enough to
ship on.

**How each asset is used:**

| Asset | Where |
|---|---|
| `bluejay land logo.png` | The hero. It is a measured elevation of the wall in the 2026 photograph, so it is used at full width along the bottom of the hero, white stone against dark pine, with a slow parallax drift. |
| `Rivosus Ranch Seal.png` | Header mark, hero, enquiries section, every footer, the portal gate, and the favicon. |
| `RPI-1 - RodeckerR_Logo_3-newbird - Copy.png` | Footer credit on every page, public and private. |
| `Bluejay - 1917 stone work.jpg` | "The Stonework" — left plate, with a light sepia wash. |
| `Bluejay - 2026 stone work.jpg` | "In the Trees" and "The Stonework" — right plate. |
| `Bluejay - 1917 - 2026 stone work.jpg` | Full-bleed comparison band; also on the portal overview. |
| `BlueJay - Rivosus - Potential Uses.pdf` | `portfolio/archive.html` only — embedded and downloadable. Appears nowhere public. |

**Responsive** down to 320px. Fluid type via `clamp()`, grids that collapse at
880px and 720px, a full-screen mobile nav, and horizontal scroll confined to
the archive table. Honours `prefers-reduced-motion` throughout.

**Accessibility:** skip link, visible focus rings, labelled landmarks,
keyboard-operable lightbox with Escape-to-close and focus restoration, and
`aria-current` on the active nav item.

---

## 7. Two things worth knowing before launch

1. **The originals are still in the project root.** `assets/img/` and
   `portfolio/docs/` hold copies, so nothing was moved or destroyed. Once you
   have confirmed the site renders, the seven files in the root — plus
   `IDEAS.pdf` and `eml.pdf`, which are not referenced by the site — can be
   deleted or moved out of the folder you upload. Do not upload `IDEAS.pdf` or
   `eml.pdf` to the server; they are not linked from anywhere, but an
   unprotected file in the web root is one directory listing away from being
   public.

2. **A website is not the disclosure surface that matters.** If a use in the
   portfolio ever goes forward, the county entitlement process — applications,
   hearings, CEQA review — is public by statute, and that is where plans
   become visible regardless of what this site says. Keeping the portfolio
   unlisted is reasonable commercial confidentiality for the exploratory
   stage; it is not a substitute for a plan about how and when you engage the
   neighbours, and it will not hold once anything is filed.
