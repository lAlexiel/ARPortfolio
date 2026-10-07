# Angie Rouge portfolio: implementation brief

## Current milestone

The user has already created a project inside ChatGPT named **Portfolio Angie**, confirmed the repository is attached, and moved this existing chat into it. Do not ask them to repeat those steps. The later mention of `D:\CHTGPTE` was clarified as referring to the project inside ChatGPT; do not assume the repository moved there.

The user has expanded the milestone to implement Gallery, Commission Info, and Terms of Service as a complete first draft for later adjustments. Home's approved design is retained. Phones are the priority. Use the existing local repository, preserve user changes, and check the actual remote before assuming the repository was renamed.

- Confirmed artist name: **Angie Rouge**, replacing the earlier misspelling Angie Rougue.
- Local repository supplied by the user: `D:\Cosas\Github\angie-rougue-portfolio`.
- Last verified remote: `https://github.com/lAlexiel/angie-rougue-portfolio`; the user discussed renaming it, but no rename was verified.
- Hosting target: GitHub Pages.
- Latest visual Home mockup: `C:\Users\danie\.codex\generated_images\01a110a5-f8bd-7880-ab68-c8b9e7edb4f9\exec-a75cc4de-c801-44c8-b2fe-488404abdb98.png`.
- The latest mockup still shows the old spelling. Render **Angie Rouge** in the implemented page.
- Latest requested adjustment: Gallery, Commission Info, and Terms of Service buttons are too large on desktop. Make them smaller, better proportioned, and visually balanced. Keep comfortable touch targets on phones.
- Build the page using real responsive elements and supplied image assets. The mockup is a visual reference, not a flat image to use as the entire website.

## Visual direction

Dark early-internet/Y2K aesthetic: charcoal textured backdrop, lavender and turquoise accents, vintage computer-window frames, wireframe globes, stars, compact discs, restrained circuit traces. Preserve artwork colors and original compositions. The page should be visually appealing and easy to navigate, with artwork taking priority over decoration. Fit portrait artwork sensibly without cutting away important parts. Use the actual supplied signature and artwork rather than generated substitutes.

The two mood references are:

- `C:\Users\danie\AppData\Local\Temp\codex-clipboard-8810e672-7c58-40d1-94d8-9d97b5cfc1e6.png`
- `C:\Users\danie\AppData\Local\Temp\codex-clipboard-327d0111-5773-4782-aab5-4b07a372e514.png`

## Navigation and Home contents

Home shows the artist name, handwritten signature, a featured drawing, and clear navigation. Gallery, Commission Info, and Terms of Service each open their own view. Do not stack all site sections on Home or make those buttons scroll to sections. Scrolling inside a selected view is acceptable where needed, particularly on phones.

All four views are now implemented. Do not invent artist availability, prices, biography, contact details, or social handles. Prices, contact channels, and accepted/declined subjects await the artist's input in `content/commissions.json`. The small English subtitle in the mockup is acceptable as proposed design copy; no site-wide language requirement was explicitly supplied. The user prefers English assistant replies.

The user's Zyon portfolio reference is **for button behavior only**, not visual style:

- Live reference: `https://zyon64.github.io/Portfolio/`
- Saved HTML: `D:\Cosas\Descargas\Zyon64 — Game Developer.html`
- Its category buttons switch the displayed projects. Apply the same principle to this site's distinct views.

## Supplied artwork and branding

Signature logo:

- `D:\danie\Pictures\WhatsApp Image 2026-07-19 at 9.41.21 PM.jpeg`

Primary Home artwork, floral head illustration:

- `D:\danie\Pictures\WhatsApp Image 2026-07-31 at 9.13.39 PM.jpeg`

Secondary Home artwork, strawberry portrait:

- `D:\danie\Pictures\WhatsApp Image 2026-07-19 at 8.30.22 AM.jpeg`

Other supplied full illustrations:

- `D:\danie\Pictures\WhatsApp Image 2026-07-19 at 8.30.22 AM (1).jpeg`
- `D:\danie\Pictures\WhatsApp Image 2026-07-19 at 8.30.22 AM (2).jpeg`
- `D:\danie\Pictures\WhatsApp Image 2026-07-19 at 8.30.22 AM (3).jpeg`

Six supplied portrait compositions:

- `D:\danie\Pictures\Angie\icono angie 1.png`
- `D:\danie\Pictures\Angie\icono angie 2.png`
- `D:\danie\Pictures\Angie\icono angie 3.png`
- `D:\danie\Pictures\Angie\icono angie 4.png`
- `D:\danie\Pictures\Angie\icono angie 5.png`
- `D:\danie\Pictures\Angie\icono angie 6.png`

Copy the required assets into the repository using sensible portable names, leaving originals intact. Keep artist signatures. Verify the files are available before relying on them.

## Requirements for the remaining views

- Gallery maintenance must be easy: the user uploads numbered images, such as 01, 02, 03, into a folder **in GitHub**, and the published gallery automatically discovers and orders them without manually editing the page for each image. The user explicitly understands that local-only folder changes do not update GitHub. Select a GitHub Pages-compatible generation method when implementing this later.
- Commissions is an informational view, titled Commission Info rather than Commission Select. It displays the artist's real contact details; customers then contact the artist through those channels. No built-in messaging form, checkout, payment integration, or automated order submission was requested.
- Commission categories: headshot, half-body, full-body; simple and full shading; backgrounds as an option/category as appropriate; extras and extra-character information; labeled examples that open larger; accepted and declined subjects; working process; link to separate Terms view. All actual prices and policies need the artist's own information. Do not copy another artist's prices or restrictions.
- Eden's Lovely screenshots were supplied as **content structure references**, not design references. They showed price tables, simple/full shading comparisons, background examples, extra-character negotiation, accepted subjects, and commission boundaries.
- Research already reviewed: `https://dismayarts.carrd.co/`, `https://gammawilson.carrd.co/`, `https://shadoca.carrd.co/`, and `https://ivafreelance.carrd.co/`. These support presenting examples with prices, explaining the work process, and handling inquiries through email or social channels. They do not establish this artist's rates or policies.
- Terms of Service is its own view containing the supplied text, preserving headings and emphasis. The user explicitly requested displaying that text as supplied, rather than adapting it or discussing its wording.

## Supplied Terms of Service text for the later Terms milestone

## ***☆ TERMS OF SERVICE ☆***

-***WAIT TIME***-

*It may take 1 day to process your order, but the wait time after is from 3-4 days. With extra revisions, the time may increase.Usually the commission finish time is a month, but can increase with negotiations (please tell beforehand if there is a deadline)*

---

-***TRANSACTION / PAYMENT***-

*・50/50 transaction. **50%** after **confirmation** that the illustration is gonna be made, and **50%** after I have **finished** it.・For the sake of not getting scammed, I will send a very **censored** sample to show the art is ready, and I will not send the **uncensored** picture until you have sent the **remaining 50%**.・This system makes sure that both the **artist and patron** are not getting **cheated**.・Revisions after a completed piece will be **priced**.The payment will be through **PayPal**.*

-***COPYRIGHT POLICY***-

*・All commissioned art will hold my **signature**.・My signature shall **not be removed**.・The art **cannot be resold**, **printed** or any **profit** being made off of it unless **I state** it is **okay** ( the price will **change** then).・The commissions may be on my **portfolio***

## Validation and delivery

Check the views at realistic narrow phone and desktop sizes, including no horizontal overflow, readable typography, usable touch targets, artwork proportions, and keyboard-accessible navigation. Avoid inventing evidence of browser/device testing: report what was actually checked. The remaining views were authorized as a complete first draft for visual review and further changes.

## Implementation checkpoint

Home, Gallery, Commission Info, and Terms of Service are implemented locally in the supplied repository. `views.css` styles the new views; `app.js` handles routing, filtering, and the native image dialog. Seven supplied original artworks are copied to `assets/gallery` with numbered names. `scripts/build.mjs` regenerates the gallery and commission examples and produces a standalone publication folder. The Pages workflow is prepared but has not run remotely. Actual browser/device rendering has not been verified. No commit, push, or publication has been performed.

The user supplied four further composite screenshots explicitly as asset sources, not design references. A transparent butterfly, silver chain/star, and floppy-disk composite was derived from two of them using the built-in image tool and stored as `assets/y2k-stickers.png`. Its prompt and provenance are in `docs/ASSETS.md`. Keep the approved layout rather than copying those screenshots' layouts.
