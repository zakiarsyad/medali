/** What comes after the `?` in a screen's address. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** One text for a part of the address that may be missing or repeated. */
export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** As long as the id of a record is. */
const ID_LENGTH = 36;

/**
 * The id a part of the address names, or null when it names none. It is
 * not checked here: the read of the record answers "not found" for what
 * is no id, as for an id of nothing.
 */
export function idParam(value: string | string[] | undefined): string | null {
  const id = firstParam(value).trim().slice(0, ID_LENGTH);
  return id === "" ? null : id;
}
