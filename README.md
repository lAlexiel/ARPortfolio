# Angie Rouge portfolio

An artist portfolio for GitHub Pages, with a phone-first layout and separate Home, Gallery, Commission Info, and Terms of Service views. The approved Y2K direction stays charcoal, lavender, and turquoise.

## Preview

Open `index.html` in a browser. The generated artwork list is included as a local script, so the site works directly from a folder. No installation is required to view it.

## Publish

In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. Commit and push the files to `main` to activate the included `.github/workflows/pages.yml` workflow. It tests the site, discovers numbered artwork, builds the publication folder, and deploys it to Pages.

This replaces the earlier Home-only suggestion to deploy directly from a branch, which would not regenerate the artwork list. The site uses relative asset paths and supports repository project URLs. See [GitHub's custom Pages workflow instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Current scope

- Home includes the artist name, supplied signature, floral portrait, and strawberry portrait.
- The two Home artwork windows and five small pop-ups can be dragged by their title bars with mouse, touch, or pen. The selected window comes to the front and retains its original angle. **Retry** in the error pop-up restores the composition, including that pop-up itself. It stays available on desktop and phone; focused title bars also support arrow keys, Shift for larger steps, and Escape to restore a window.
- Navigation changes the visible view; it does not scroll between stacked sections. Browser Back and Forward work with the selected view.
- A lavender language window in the header switches every view between English and Spanish, with US and Mexican flag buttons and a center switch. It is available on desktop and phone and remembers the visitor's selection when browser storage is available.
- Gallery includes seven original drawings, category filters, and an enlarged image viewer. Escape closes the viewer, and arrow keys move through the selected collection.
- Commission Info includes framing guides, shading tiers, background pricing, extras, portfolio examples, the payment/delivery process, and accepted/declined subject sections. Prices, contact details, and drawing boundaries are visibly awaiting the artist's information.
- Terms of Service preserves the supplied English wording, punctuation, headings, and emphasis exactly, with a Spanish translation that retains the same emphasis and conditions.
- No availability, pricing, contact handles, order form, checkout, or payment processing is invented.
- Original source artwork is stored in `assets/` and displayed without changing its colors.

## Add artwork

Upload numbered images into `assets/gallery` on GitHub, such as `08.jpg`, `09.png`, and `10.webp`, and commit the upload to `main`. After the Pages workflow finishes, the gallery updates in numerical order. Names like `08-new-character.jpg` are also supported. JPG, JPEG, PNG, WebP, GIF, and AVIF are supported; unnumbered files are ignored.

No metadata entry or HTML edit is needed for a new drawing. It defaults to a title such as `Artwork 08` in Illustrations. Optional titles, descriptive alt text, and categories go in `content/gallery-meta.json`. Files removed from the folder disappear on the next build.

For Spanish titles and accessible image descriptions, add optional `titleEs` and `altEs` beside the English `title` and `alt`. New drawings without metadata automatically receive `Artwork 08` / `Obra 08`. Custom English titles remain as supplied until a Spanish title is entered; there is no external translation service.

## Fill in commission information

Edit `content/commissions.json`:

- Set `currency` to a three-letter code such as `USD` or `EUR` when entering numeric prices. Unknown prices remain `null`; descriptive strings such as `Custom quote` are also supported.
- Add actual `contacts` as objects with `label` and `url`. URLs can use `https:` or `mailto:`.
- Set `socialLinks.instagram`, `socialLinks.x`, and `socialLinks.paypal` to your HTTPS profile URLs. The same buttons appear on Home and Commission Info. A `null` entry displays a disabled button until its profile link is supplied; rebuild after changing the links.
- Set the `rates` for headshot, half-body, full-body, backgrounds, and extras.
- Set `examples` to numbered artwork filenames. Removed images are omitted; if no selected images remain, up to three current drawings are used.
- Fill `acceptedSubjects` and `declinedSubjects` with the artist's confirmed subjects and boundaries.

Contact labels, descriptive price text, and accepted/declined subjects can use a plain string or a bilingual object, for example `{"en": "Custom quote", "es": "Cotización personalizada"}`. Plain strings stay as entered in both languages. Numeric prices use the selected language's formatting while retaining the configured currency and amount.

The reference artist's rates and restrictions have not been adopted as Angie Rouge's policies. The silhouette drawings are labeled framing guides. Portfolio samples do not claim to demonstrate specific shading tiers or full-body commissions.

## Language text

Edit `content/translations.json` to update the interface and Terms in English or Spanish. Both languages must contain the same message keys and placeholders. Terms paragraphs are arrays of text and `{ "strong": "emphasized text" }` pieces; text is never interpreted as HTML. The build validates translations and includes them in the local content script, so switching languages works from a local folder without a server or third-party service.

The default is English. A saved `en` or `es` preference is reused; unavailable browser storage only prevents saving between visits. Changing language keeps the active view, selected gallery filter, and artwork preview position. The switch supports normal keyboard activation and announces the chosen language to assistive technology.

Moved Home windows retain their arrangement while switching views during the current visit. They are hidden outside Home and reset on a viewport resize or reload, so changing between phone and desktop layouts restores the responsive composition. Only title bars intercept touch scrolling. The language window stays in the header.

## Local build and checks

With Node.js 24 installed, run:

```text
node scripts/build.mjs
node --test
node scripts/check-site.mjs
```

The build regenerates gallery cards, commission examples, and `content-data.js`. To build an independent publication folder, run `node scripts/build.mjs --out _site` and open `_site/index.html`. There are no third-party runtime dependencies. The build versions its scripts and styles from their contents so newly published images and changes refresh consistently.

The earlier repository name contained a spelling mistake. The displayed artist name is **Angie Rouge**. Check the current remote before renaming repository folders or changing Git configuration.

## Visual revision

The Home revision brings back the mockup's prominent display typography, lavender signature, decorative toolbar, layered artwork windows, CD and circuit details, and three compact matching buttons. Entrance, hover, floating, sparkle, and bounded mouse-depth effects respect reduced-motion settings. See `docs/VALIDATION.md` for the checks and remaining visual-review limits.

No commit, push, or public deployment was performed while preparing this draft. Browser rendering and real phone interactions still need visual review.
