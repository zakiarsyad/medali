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
