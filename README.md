# AstraStasis portfolio

Static GitHub Pages portfolio for AndreiG: digital artwork, video editing, motion design, and GitHub projects. No build step is required.

## Preview

Run `preview.cmd` on Windows with Python installed. It opens a localhost preview. Keep its terminal open while viewing the site. Opening `index.html` directly works for browsing artwork, but YouTube embeds require an HTTP website address.

## Artwork

The gallery uses optimized WebP thumbnails and larger viewing copies in `assets/artworks/`. Original artwork files remain unchanged in the repository root and are available through each viewer's **Open original** link. Backgrounds and the After Effects logo are excluded from the artwork gallery.

To regenerate the viewing copies after changing artwork, install Pillow and run `python scripts/build_art_assets.py`. Gallery entries live in `index.html`; viewer metadata lives in `script.js`.

## Process comparisons and collection views

Sketches in `drawing sketch/` are paired with finished artwork by `studio.js`. Gallery and Contact sheet use 800px previews; the viewer and focused collage use viewing copies up to 2000px. Originals remain available through Open original. Generate sketch previews with `python scripts/build_sketch_assets.py`. Comparison dividers support mouse and touch dragging as well as a dedicated keyboard-accessible slider. The viewer and slider follow each artwork's aspect ratio. Collage transitions use transforms and preloaded images to keep rapid navigation responsive.

Videos default to Screening room, with Cinema and Card grid available through the layout switch. The small interface labels use DM Sans. The orb control triggers a short particle burst when motion is enabled.

## GitHub Pages

Commit the HTML, CSS, JavaScript, assets, and original artwork to the repository used by GitHub Pages. This remains a plain static site. Fonts and the optional Three.js scene load from CDNs; the content and gallery remain usable if the 3D scene cannot load. Animation respects reduced-motion preferences and can be paused using the footer control.
