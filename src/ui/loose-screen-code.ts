import { COLOUR_FUNCTION } from "./loose-values";

const INLINE_STYLE = /\bstyle=/g;
const QUOTED_HEX_COLOUR =
  /(?<!href=)(["'])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\1/gi;

/**
 * Lists the places where a screen's code sets its own look instead of
 * using a style file: a `style=` attribute, a colour function, or a hex
 * colour. A hex colour counts only when it is a whole quoted text, such as
 * `"#fff"`, and is not the value of `href`, so a link to `#add`, a
 * character code such as `&#160;` and a note such as `#123` are left alone.
 *
 * Not found: a colour written as a word, such as `fill="red"`. Ordinary
 * screen text uses the same words.
 */
export function findLooseValuesInScreenCode(code: string): string[] {
  return [
    ...(code.match(INLINE_STYLE) ?? []),
    ...(code.match(QUOTED_HEX_COLOUR) ?? []),
    ...(code.match(COLOUR_FUNCTION) ?? []),
  ];
}
