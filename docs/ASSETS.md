# Home assets

## Gallery originals

Seven supplied works are copied unchanged into `assets/gallery`, numbered 01 through 07: floral portrait, strawberry portrait, pink-haired bunny character, green-haired character, ruffled character, blonde portrait composition, and cat-inspired portrait composition. Their descriptive text and categories are in `content/gallery-meta.json`. Gallery and commission sample images use `object-fit: contain` so the original compositions and signatures remain visible.

Commission framing guides are original inline SVG silhouettes and selection outlines. They are explicitly labeled guides, not examples of the artist's drawing style. Simple and full shading remain price options without fabricated image comparisons.

The artist's original signature, floral portrait, and strawberry portrait are copied into `assets/` without repainting or changing their colors. The original signature JPEG is displayed through an inline SVG luminance mask: only the ink receives the lavender display tint, and the background is transparent. This does not alter the original file or depend on blending with a background layer.

`assets/y2k-stickers.png` is a transparent decorative composite derived from two user-supplied reference screenshots using the built-in image generation tool. The supplied layouts are not used as design templates. This derivative is not represented as a pixel-exact crop of the source images. The remaining supplied screenshots are retained in the conversation for future asset selection.

## Asset prompt

Use case: background-extraction. Asset type: one transparent decorative sticker cluster for the existing Angie Rouge portfolio Home. Input image 1 is the supplied void.exe screenshot and contains extraction targets; input image 2 is the supplied Life OS screenshot and contains extraction targets. Extract and arrange just three decorative source elements as a small cohesive airy cluster: the lavender butterfly near the upper right of image 1, a short silver chain with its hanging five-point silver star from image 1, and one purple floppy disk icon from the HABITS panel of image 2. Preserve each element's recognisable appearance and colors from its source. Keep all three isolated, fully visible, not touching or overlapping, balanced in a wide horizontal composition with generous transparent gaps. The chain is a short curved segment, not a frame around the entire canvas. The butterfly is largest; star and disk smaller. Remove surrounding website backgrounds, UI windows, people, text and other objects. Output truly transparent alpha background with clean antialiased edges. This is asset extraction/compositing only; do not make a website design, poster, banner, new characters, text, logos, watermarks, solid background, or checkerboard background. Keep palette lavender, chrome silver, subdued purple. Maintain the source details rather than redesigning the elements.

## Floating windows

The additional supplied error-window crop, collage, and pastel sticker sheet inform the kinds of decorative objects used on Home. The three new floating windows are original HTML/CSS/SVG components using the site's existing lavender and turquoise chrome. They are not raster crops from those references. They use friendly decorative messages and contain no real error alerts, loading states, or functional close buttons.

The empty space between the identity column and artwork on wide screens now contains two more original overlapping windows: a dark creative-overload message and a pale lavender fictional ERROR 404 window. Their warning symbol is inline SVG, and their action-like labels are decorative spans. The group inherits the parent's assistive-technology exclusion and pointer exclusion. It is only shown from 1320px upward, where the layout has room for it; the established phone composition stays compact.

## Typography

Home uses self-hosted Archivo Black from the Google Fonts repository so the display title has consistent weight on desktop and phone. The font and its SIL Open Font License are stored in `assets/fonts/`.

Source: https://github.com/google/fonts/tree/main/ofl/archivoblack
