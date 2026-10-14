/** The longest side of a sent photo, in dots. */
export const PHOTO_MAX_SIDE = 1280;

export interface PhotoSize {
  width: number;
  height: number;
}

/**
 * The size a picked picture is sent in: made smaller, with its shape
 * kept, until its longest side is `maxSide`, the largest allowed unless
 * told otherwise. A picture that is small enough already keeps its size.
 */
export function shrunkSize(
  size: PhotoSize,
  maxSide: number = PHOTO_MAX_SIDE,
): PhotoSize {
  const longest = Math.max(size.width, size.height);
  if (longest <= maxSide) return size;
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}
