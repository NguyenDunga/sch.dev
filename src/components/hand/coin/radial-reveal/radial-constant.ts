/** The anticipation (s): after the hover, a tiny slow peek grows before the
 *  wipe — the reveal winds up instead of firing instantly. */
export const ANTICIPATE = 0.3
/** The wipe (s): the fast radial reveal once the anticipation ends. */
export const WIPE = 0.25
/** The peek radius (% of the disk) reached by the end of the anticipation. */
export const PEEK_RADIUS = 12
/** The glyph scale: at rest / at the end of the anticipation / revealed. */
export const SCALE_REST = 0.85
export const SCALE_PEEK = 0.95