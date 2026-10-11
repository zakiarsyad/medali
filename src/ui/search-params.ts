/** What comes after the `?` in a screen's address. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** One text for a part of the address that may be missing or repeated. */
export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
