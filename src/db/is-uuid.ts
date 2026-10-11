const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether a text has the shape of a row id, so the database can be asked. */
export function isUuid(text: string): boolean {
  return UUID.test(text);
}
