const PDF_START = new TextEncoder().encode("%PDF-1.4\n");
const PNG_START = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * A made-up paper for the checks: bytes that start as a PDF does and
 * hold nothing after that. It names nobody.
 */
export function testPaper(byteCount = 64): Uint8Array {
  const bytes = new Uint8Array(byteCount);
  bytes.set(PDF_START);
  return bytes;
}

/** Bytes that start as a PNG picture does and hold nothing after that. */
export function testPngPicture(byteCount = 64): Uint8Array {
  const bytes = new Uint8Array(byteCount);
  bytes.set(PNG_START);
  return bytes;
}
