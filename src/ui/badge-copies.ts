import { rulesOf } from "./css-rules";

const STATUS_COLOUR =
  /var\(--(?:ok|warn|bad|fit-good|category-colour|badge-[\w-]+)\)/;
const CATEGORY_COLOUR = "var(--category-colour)";
const SURFACE_TEXT = "var(--surface)";
const TEXT_COLOURED_LINE = "currentcolor";
const LINE_PROPERTIES = ["border", "border-color"];

function lineValues(declarations: Map<string, string>): string[] {
  return LINE_PROPERTIES.map((property) => declarations.get(property) ?? "");
}

function hasStatusLine(declarations: Map<string, string>): boolean {
  return lineValues(declarations).some((value) => STATUS_COLOUR.test(value));
}

function hasTextColouredLine(declarations: Map<string, string>): boolean {
  return lineValues(declarations).some((value) =>
    value.toLowerCase().includes(TEXT_COLOURED_LINE),
  );
}

function isSolidStatus(declarations: Map<string, string>): boolean {
  const background = declarations.get("background") ?? "";
  return (
    STATUS_COLOUR.test(background) && declarations.get("color") === SURFACE_TEXT
  );
}

/**
 * Whether a rule colours a badge by status. `linesFollowText` holds when
 * the file draws a border in the colour of the text, so a status colour
 * of the text alone colours that border too.
 */
function colorsLikeBadge(
  declarations: Map<string, string>,
  linesFollowText: boolean,
): boolean {
  if (isSolidStatus(declarations)) return true;
  const text = declarations.get("color") ?? "";
  if (text.includes(CATEGORY_COLOUR)) return true;
  if (!STATUS_COLOUR.test(text)) return false;
  return linesFollowText || hasStatusLine(declarations);
}

/**
 * The selectors of a style file whose rule gives a badge its own status
 * colours: text and border in a status colour, a solid status colour
 * under white text, or text in the colour of a category. The shared
 * badge look holds the only such rules.
 */
export function statusBadgeCopies(stylesheet: string): string[] {
  const rules = rulesOf(stylesheet);
  const linesFollowText = rules.some((rule) =>
    hasTextColouredLine(rule.declarations),
  );
  return rules
    .filter((rule) => colorsLikeBadge(rule.declarations, linesFollowText))
    .map((rule) => rule.selector);
}
