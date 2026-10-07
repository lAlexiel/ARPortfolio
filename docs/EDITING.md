# Updating the portfolio

## Image folders

- `assets/gallery/`: the drawings shown in Gallery. Add numbered filenames such as `08.jpg`, `09-new-character.png`, or `10.webp`. The number sets the order. Supported formats: JPG, JPEG, PNG, WebP, GIF, and AVIF. Unnumbered files are ignored. Deleting a drawing removes it from Gallery after the next publication.
- `assets/gallery/thumbnails/`: smaller previews that help the gallery load quickly on phones. These are not separate gallery entries. Optional `thumbnail` metadata points to a filename in this folder; without it, the gallery uses the drawing itself. When replacing an artwork, update its thumbnail too, or remove the `thumbnail` field to use the full image.
- `assets/`: Home artwork (`floral-portrait.jpg`, `strawberry-portrait.jpg`), the signature (`signature.jpg`), and decorative assets. These are separate from Gallery: adding a drawing to Gallery does not replace the two Home pictures. Keep these filenames when replacing Home artwork.
- `assets/fonts/`: the website font and its license. This is not a drawing folder.
- `docs/`: documentation and the screenshot displayed in the GitHub README. Images here do not appear in Gallery.

Optional drawing titles and descriptions go in `content/gallery-meta.json`, using the exact image filename as the key. `title` and `alt` are English; `titleEs` and `altEs` are Spanish. `category` can be `Portraits` (color portraits), `Illustrations` (character illustrations), `Monochrome` (ink and monochrome), `Sketches` (sketches and line art), or `Posters` (posters and graphic artwork). Without metadata, a new drawing gets a numbered title automatically. `sourceName`, when present, records its original Drive filename for your reference.

## Terms of Service

Edit **`content/terms.json`**. `en` contains the English text and `es` the Spanish text. Edit both versions to keep their meaning consistent; the site does not automatically translate your edits.

Each language contains:

- `title`: the page title.
- `waitHeading` and `wait`: the wait-time heading and paragraph.
- `paymentHeading` and `payment`: the payment heading and paragraph.
- `copyrightHeading` and `copyright`: the copyright heading and paragraph.

A paragraph can be a simple string:

```json
"wait": "Write your updated wait-time policy here."
```

Or use text pieces with bold emphasis:

```json
"payment": ["Payment is made through ", { "strong": "PayPal" }, "."]
```

Keep the JSON quotes, commas, and braces valid. Text is displayed safely as text, not HTML. You do not need to edit `index.html`, `app.js`, or `content-data.js`.

## Publish your edits

Save the file, then commit and push your changes to `main` in GitHub Desktop. You can also edit or upload files directly on GitHub and commit them there. The **Publish Angie Rouge portfolio** workflow rebuilds the gallery and Terms and publishes the changes automatically. Wait for its green check before refreshing the live website.

Saving a file only on your computer does not change the live website. If invalid JSON makes the workflow fail, the previous published website remains live.

## Color themes

The four swatches in Home's `color.art` window choose lavender, turquoise, pink, or silver. The choice applies to every tab and is remembered on that browser. Original artwork keeps its colors. **Retry** restores the lavender theme and all Home window positions.

## Mini Paint

Home's main artwork window includes a pencil, brush, eraser, undo, clear, a blank-paper toggle, and a drawing-color picker. Choose the pointer to stop drawing and scroll normally on a phone. Only the title bar moves the window. Doodles last for the current visit and never change the original artwork file. **Retry** also clears the doodles and restores the original picture.

## Dream

**Dream** plays a 5.6-second Y2K animation and then restores the normal Home view, preserving your window positions, selected theme, and doodles. **Retry** or **Escape** ends it immediately. Browsers with reduced motion enabled get a calmer version. Only the lettering on the spinning CD opens the hidden YouTube link; its appearance stays the same.
