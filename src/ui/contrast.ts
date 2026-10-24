const SIX_DIGIT_HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

function channelsOf(hex: string): number[] {
  const match = hex.match(SIX_DIGIT_HEX);
  if (!match) throw new Error(`Not a six digit hex colour: ${hex}`);
  return match.slice(1).map((digits) => Number.parseInt(digits, 16));
}

function linear(channel: number): number {
  const share = channel / 255;
  if (share <= 0.04045) return share / 12.92;
  return ((share + 0.055) / 1.055) ** 2.4;
}

function luminanceOf(hex: string): number {
  const [red = 0, green = 0, blue = 0] = channelsOf(hex).map(linear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** The WCAG contrast of two colours, from 1 (the same) to 21 (black on white). */
export function contrastRatio(first: string, second: string): number {
  const one = luminanceOf(first);
  const other = luminanceOf(second);
  const lighter = Math.max(one, other);
  const darker = Math.min(one, other);
  return (lighter + 0.05) / (darker + 0.05);
}
