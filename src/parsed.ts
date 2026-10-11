/** The outcome of checking an input: the checked value, or why it is refused. */
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
