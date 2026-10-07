# Editing the portfolio

| What to change | File or folder |
| --- | --- |
| Prices and social links | `content/commissions.json` |
| Terms of Service | `content/terms.json` |
| English and Spanish text | `content/translations.json` |
| Main Home drawing | `assets/floral-portrait.jpg` |
| Smaller Home drawing | `assets/strawberry-portrait.jpg` |
| Gallery drawings | `assets/gallery/` |
| Drawing titles and categories | `content/gallery-meta.json` |

Use numbered filenames for new gallery drawings, such as `33-character.jpg`. The number sets their order. Smaller previews go in `assets/gallery/thumbnails/`; when replacing a drawing, replace its preview too or remove its `thumbnail` entry from the metadata.

Update both `en` and `es` when changing bilingual text. Keep JSON valid; `content-data.js` is rebuilt automatically.

Commit and push changes to `main` to publish them through GitHub Pages.
