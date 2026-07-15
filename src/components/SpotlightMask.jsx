/**
 * Semi-transparent dark overlay covering the full rendered PDF page, with a
 * rectangular cutout over the focused lot so it renders un-dimmed. Uses an
 * SVG mask (evenodd fill) rather than four separate divs so the cutout edge
 * stays pixel-accurate at any size.
 *
 * Lives in the same coordinate space as the canvas underneath it (same
 * width/height, same scroll parent) — NOT the fixed-position lot-controls
 * overlay, which is centered independently. This component only draws the
 * dimming + the cutout's border; it renders no interactive controls.
 */
export default function SpotlightMask({ width, height, cutout }) {
  const maskId = 'spotlight-cutout-mask';

  return (
    <svg
      className="spotlight-mask"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        <mask id={maskId}>
          {/* White = visible (dimmed), black = cut out (fully clear) */}
          <rect x="0" y="0" width={width} height={height} fill="white" />
          <rect
            x={cutout.x}
            y={cutout.y}
            width={cutout.width}
            height={cutout.height}
            fill="black"
          />
        </mask>
      </defs>

      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="rgba(10, 12, 16, 0.72)"
        mask={`url(#${maskId})`}
      />

      {/* Thin border to read as a "card" around the cutout, per spec */}
      <rect
        x={cutout.x}
        y={cutout.y}
        width={cutout.width}
        height={cutout.height}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        rx="6"
      />
    </svg>
  );
}
