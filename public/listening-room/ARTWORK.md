# Listening room artwork

Generated with the built-in image generation tool using the user's supplied listening-room mockup as the visual reference on 2026-11-11.

- Original: `scene.png` (2135 × 737).
- Website asset: `/optimized/listening-room/scene.webp` (1800 × 621, about 413 KiB).
- Animation: `components/ListeningPainting.tsx` composites the illustration through a canvas brush mask. Drawing takes 6.5 seconds, the completed painting holds for 6.5 seconds, erasing takes 3.5 seconds, then a 0.6-second pause precedes the next loop. Reduced-motion preferences show the complete illustration.

## Generation prompt

Use the user's latest attached listening-room mockup as the visual reference. Create ONLY the panoramic painted illustration occupying the middle of that mockup, without any UI, typography, labels, numbers, clock, sticky notes, panels, buttons or borders. Wide landscape aspect ratio about 2.9:1. Reproduce the same composition and objects faithfully: warm wooden desk stretching across the foreground, vintage walnut record player with transparent open lid at left, black headphones resting on desk near left-center, copper articulated desk lamp arching across the middle casting golden light, open book front-center, steaming cream mug at right of book, large blue nighttime rain-streaked window behind with glowing distant city windows, leafy green houseplant left and trailing ivy top right, bookshelves in right background, rust orange upholstered reading chair at far right with lilac cushion and a cream knit blanket. Rich tactile gouache / colored-pencil painterly illustration printed on warm textured paper, deep cobalt and indigo rainy night contrasted with amber lamplight, lilac accents, rust orange chair. Keep all furniture and principal objects sharply recognizable; dense hand-painted brush grain and paper texture like the reference. Fill the complete rectangular image edge to edge with the illustration; no exterior blank paper margins, no ripped border, no text or symbols representing interface. This is a source artwork for a canvas brush-stroke reveal animation in a real working website, not a screenshot of the interface.
