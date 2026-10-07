# Portfolio validation

## Home and Commission Info social buttons

Matching Instagram, X, and PayPal buttons appear in a compact row below the Home navigation and inside the commission contact window. Native SVG icons and lavender, pink, and turquoise accents follow the existing design. The buttons use one `socialLinks` configuration in `content/commissions.json`; the build generates both rows. Instagram points to `https://www.instagram.com/r.ougx/` and X to `https://x.com/AngieReygadas`. Their links open in a new tab with `noopener noreferrer`. PayPal stays a disabled native button without a URL until the artist supplies it. The generic missing-contact notice is hidden when configured social links are available.

The existing 18 automated tests passed; the commission-content test now additionally covers configured social URLs, an empty PayPal link, and invalid protocols or embedded credentials. Browser checks verified both rows at 1440px, 390px, and 320px, including exact destinations, bilingual accessible labels, minimum 44px heights, label fit, and no horizontal overflow. The narrow phone layout places each icon above its label. Rendered desktop and narrow-phone views were inspected. External profiles were not opened and no PayPal transaction or messaging integration was added.

## Home opening arrangement

On wide desktop screens, the welcome, system-message, and Retry error windows form a spaced column to the left of the floral artwork, matching the supplied arrangement. The palette stays along its right edge, the heart near its lower-left corner, and the strawberry portrait over its lower-right corner. The artwork stage is capped at 610px to reserve room for the left column while retaining the existing shorter-screen cap. These are the original stylesheet positions, so opening the page and pressing Retry use the same composition. Window dragging still preserves its captured angles; compact desktop and phone arrangements continue to use their existing responsive rules.

Edge renders were checked at 1440 × 900, 1440 × 820, and a 390 × 900 mobile viewport, with no horizontal overflow. Browser hit checks confirm that the left, center, and right portions of all five mini-window title bars receive input. The intro's blank space passes pointer input through to nearby windows while its visible content and navigation remain interactive. A browser mouse drag from the welcome title bar preserves its tilt and final offset; clicking Retry restores its opening position. Reduced motion was used for stable comparison with the reference. Real-device touch remains untested.

## Home signature watermark

The original signature is larger and sits behind the Home identity as a soft lavender watermark. Its existing SVG luminance mask keeps the paper background transparent. Absolute positioning and a negative stacking level inside the isolated intro place the name and navigation above it; reserved header height preserves their established positions. Desktop and phone sizes are bounded to the intro width. The signature ignores pointer input and is hidden from assistive technology because it is now background decoration.

The signature revision was inspected in rendered Edge previews at 1440 × 900 and with mobile emulation at 390 × 900. The mobile page width remains 390px; the watermark is fully within the viewport and text stays above it. Source and publication builds pass the existing asset, translation, HTML/SVG, ID, and mask checks. These renders verify this visual change, not native phone touch or window-drag behavior.

## Draggable Home windows

Both artwork windows and all five mini-windows support title-bar dragging with primary mouse, touch, or pen input. A selected window moves into a dedicated Home desktop layer above the composition, with an invisible placeholder preserving the original layout. It comes to the front and keeps its captured angle while idle float motion pauses. Visual bounds account for the rotation so grabbing does not cause a position jump. Pointer capture follows the grab after reparenting. Movement is coalesced into animation frames; release applies its final coordinates. Horizontal bounds keep the window within the viewport, and vertical bounds keep the title bar reachable while the desktop clips any part below the screen.

The error pop-up's Retry button restores every moved window, including its own pop-up, to the original layout and inline styles. The separate Reset windows button is removed. Retry retains focus after its window returns and has a bilingual accessible label. Below 1320px, the error pop-up joins the smaller windows below the artwork so the same control remains available; on touch devices its button is at least 44px high. Focused title bars support arrows, Shift for larger moves, Enter/Space to bring a window forward, and Escape to restore it. Title bars have button semantics and bilingual keyboard instructions; their decorative chrome stays hidden from assistive technology. Touch title bars are at least 44px high and suppress native scrolling only on the handle. The decorative floating-window group is accessible because its title bars are interactive.

Home window positions survive tab and language changes during a visit, with the desktop layer hidden outside Home. Resizing resets the composition to avoid carrying desktop offsets into the phone layout. Pointer cancellation, lost capture, browser blur, or a background-tab change cancels a grab cleanly. The Home depth effect pauses during dragging. The language switch remains in its original header position.

Eighteen automated tests passed, including seven drag-behavior tests for layout reservation, front ordering, capture/release, final coordinates, touch and keyboard input, viewport limits, narrow-screen width fitting, cancellation, focus, tab visibility, reset, resize, and background interruption. Regression checks cover positive and negative rotation in both 2D and 3D transforms, grab/release position stability, repeat dragging, and Retry resetting its own window while retaining focus. The previous eleven language/navigation/gallery/content checks also pass. These are script tests with DOM fixtures; native browser dragging and real phone touch interaction still need manual review.

## Simple Y2K background details

A separate background layer adds faint lavender/turquoise grid lines, orbital outlines, four-point stars, and a small pixel-cross cluster across all views. Decorations stay below the complete site, are clipped to the viewport, ignore pointer input, and are hidden from assistive technology. The center of the grid fades out to preserve the title and artwork hierarchy. Phones use fewer, smaller marks near the edges. Slow drift and gentle star brightness follow the existing reduced-motion and background-tab pause settings. Static build checks validate the added SVG symbol references; actual browser appearance remains for visual review.

## English / Spanish language window

The header now contains a compact lavender window matching the approved Home mini-window chrome. Native SVG US and Mexican flag icons flank a semantic switch; the flags are also direct language buttons. The window remains available in all four views. At narrower widths, the navigation moves to its own row, and phone labels remain compact. The switch thumb animates with the existing reduced-motion override.

All interface copy, decorative window messages, gallery titles and descriptions, commission information, Terms, image-viewer controls, page titles, and accessibility labels have English and Spanish versions. The supplied English Terms remain exact; Spanish paragraphs use their own sentence structure and preserve emphasis. Translation strings and artist-configured text are rendered as text nodes, with only explicitly marked Terms pieces becoming strong elements. Artwork pixels and the original signature remain unchanged.

Language choice is saved locally when permitted. Invalid values fall back to English, and blocked storage does not break switching. Changing language keeps the current view and gallery filter and refreshes an open preview without moving to a different drawing. Optional bilingual artist data supports future gallery titles, contact labels, descriptive rates, and boundaries. Numeric rates retain their configured currency and amount.

Eleven automated tests passed, including the previous seven behavior/content checks plus full translation coverage, translated rich Terms, persistence, blocked storage, retained gallery/preview state, and bilingual commission data. Source and publication-folder builds also pass translation, local-asset, HTML/SVG, and generated-content validation. These are static and DOM-fixture checks; browser rendering and real phone interaction still require visual review. No commit, push, or publication has been performed.

## Gallery, Commission Info, and Terms draft

The expanded draft keeps all four destinations separate. Seven original artworks form the initial gallery. Filter buttons update the visible collection and artwork count; a native dialog enlarges gallery and commission sample images, supports previous/next and keyboard arrows, closes with Escape, and restores focus. The original-file link remains available, and modified clicks on a drawing retain normal browser behavior.

Commission Info includes headshot, half-body, full-body, simple/full shading rates, background options, extras, portfolio samples, the supplied 50/50 payment and preview/delivery process, contact placement, and accepted/declined subject sections. Rates, currency, contact details, and boundaries remain unconfirmed. Framing guides and general portfolio samples are labeled honestly. Terms text is preserved verbatim, with its original emphasis and headings.

The numbered gallery build runs without external packages. It discovers supported images, sorts their numeric prefixes, encodes filenames safely, generates static cards and local content data, and versions scripts/styles by content. It can produce a standalone `_site` publication folder. The GitHub Pages workflow uses checkout, Node setup, configure-pages, artifact upload, and deployment actions; its permissions and environment follow the official Pages workflow documentation. It has not been run on GitHub, and no publication has been performed.

Seven automated tests passed, covering:

- Separate views, direct links, history events, active navigation, focus, and invalid routes.
- Gallery filters, filtered image navigation, Escape, original-image links, and modal closure during view changes.
- Honest missing-data states and configured prices, contacts, and boundaries.
- Bounded Home movement, touch exclusion, reduced motion, and background-tab suspension.
- Discovery/order/encoding of numbered files, removed artwork, ignored files, and escaped metadata.
- Commission configuration validation.
- Exact preservation of all three supplied Terms paragraphs.

Both the source and standalone publication builds completed. HTML/SVG nesting, IDs, local assets, generated data, and whitespace are checked separately. These are static and script checks with a DOM fixture; actual browser rendering and real phone interactions have not been verified. Phone layouts are ready for visual review.

## Home revision history

The latest revision restores the mockup's heavier title, tinted signature, decorative illustration toolbar, chrome navigation, lavender framed artwork, compact matching destination buttons, circuit details, and layered portrait. The original supplied artwork files remain unchanged.

The identity column now groups the welcome label and small signature into one header row. The artist name sits above its ornaments in the stacking order, with separate padded gradient spans and closely spaced baselines. Its display font's actual ink bounds were inspected: both words descend by .21em, so each span retains .12em of bottom padding while the second span moves upward by .12em. This tightens the title without cutting off its descenders. The role, divider, destination buttons, and quieter welcome note follow a consistent alignment; the button styling is retained.

The original signature is displayed through an inline SVG luminance mask instead of backdrop-dependent blending, so entrance animation and isolated layers cannot create a black rectangle. Circuit lines below the buttons are anchored to the button group and separated from the welcome note. The artwork caption is larger, brighter, and inset from the decorative star on desktop and phone.

Three decorative floating windows use the established window chrome and colors: a welcome note, a palette, and a pixel heart. They are native HTML/CSS/SVG elements inspired by the supplied asset types, rather than screenshots or AI-edited crops. They have no click targets, do not intercept pointer input, and are hidden from assistive technology. On phones, the welcome and heart windows move into a row below the artwork; the palette is omitted. On intermediate widths, only the lower heart window remains. Their motion follows the existing reduced-motion and background-tab rules.

On wide desktop screens, a two-window error collage fills the central gap. It is offset 224px left of the artwork stage and appears only from 1320px upward, to avoid crowding the title and navigation at narrower widths. Its messages and action-like labels are decorative. It shares the existing floating motion, reduced-motion setting, and background-tab pause behavior. This positioning has not been checked in a rendered browser.

Animations include a short entrance sequence, slow CD rotation, a floating portrait, gentle decorative sparkle, hover highlights, and mouse-only artwork depth limited to four pixels. Touch navigation is usable without hover. Reduced-motion preferences disable animations and mouse depth; changes to that preference cancel pending movement. Background tabs pause animation.

Passed local checks:

- JavaScript syntax and local asset references, including the real font file.
- HTML IDs and SVG symbol references.
- Direct routes, navigation history events, view replacement, page titles, active navigation, focus restoration, and invalid-route handling.
- Pointer movement is clamped and coalesced into one animation frame.
- Touch devices do not run pointer depth effects.
- Enabling reduced motion cancels pending movement.
- Background-tab changes cancel pointer frames and pause animations.
- Responsive rules, visible keyboard focus, and reduced-motion CSS are present.
- Git whitespace check.

These are static checks and script behavior checks with a DOM fixture. Actual visual browser rendering and real phone interactions have not been verified in this session. The local preview is ready for visual review. No commit, push, or GitHub Pages publication has been performed.
