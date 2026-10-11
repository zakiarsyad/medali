const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether what was sent is a text with the shape of a row id, so the
 * database can be asked.
 */
export function isUuid(text: unknown): boolean {
  return typeof text === "string" && UUID.test(text);
}
