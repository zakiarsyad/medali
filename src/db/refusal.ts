/**
 * A command's "no", with the reason for whoever ran it. Any other error
 * is a fault of the command itself.
 */
export class Refusal extends Error {}

/**
 * What a command prints when it fails: a refusal as its one line of
 * words, any other fault whole, with where it came from.
 */
export function shownFor(error: unknown): unknown {
  return error instanceof Refusal ? error.message : error;
}

/**
 * The code a fault carries, such as the database's own for a refused
 * write, or null when it has none. A fault may be wrapped in another, so
 * each cause is looked at in turn. A code never holds what was typed.
 */
export function faultCodeOf(error: unknown): string | null {
  let fault = error;
  while (fault instanceof Error) {
    if ("code" in fault && typeof fault.code === "string") return fault.code;
    fault = fault.cause;
  }
  return null;
}
