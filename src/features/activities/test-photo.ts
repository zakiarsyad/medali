/** The bytes every JPEG picture starts with. */
const JPEG_START = [0xff, 0xd8, 0xff, 0xe0];

/**
 * A made-up photo for the checks: bytes that start as a JPEG does and
 * hold nothing after that. It is a picture of nobody.
 */
export function testPhoto(byteCount = 64): Uint8Array {
  const bytes = new Uint8Array(byteCount);
  bytes.set(JPEG_START);
  return bytes;
}
