/**
 * How many letters a text holds, as the database counts them: an emoji
 * is one, where the length of a text would count two.
 */
export function lettersIn(text: string): number {
  return [...text].length;
}

/**
 * The first `max` letters of a text, as the database counts them, so an
 * emoji is never cut in half.
 */
export function firstLetters(text: string, max: number): string {
  return [...text].slice(0, max).join("");
}
