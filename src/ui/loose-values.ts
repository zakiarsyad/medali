import { CSS_COLOUR_NAMES } from "./css-colour-names";

const COMMENT = /\/\*[\s\S]*?\*\//g;
const NAMED_VALUE = /var\(--[\w-]+\)/g;
const DECLARATION = /([\w-]+)\s*:\s*([^;{}]+)(?=[;}])/g;

export const HEX_COLOUR = /#[0-9a-f]{3,8}\b/gi;
export const COLOUR_FUNCTION =
  /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/gi;
const WORD_BREAK = /[\s,()/]+/;
const NUMBER_WITH_UNIT = /(?<![\w#.])-?\d*\.?\d+[a-z]+/gi;
const WIDTH_RULE = /@(?:media|container)\b[^{]*/gi;
const UNIT = /[a-z]+$/i;

const ALLOWED_UNITS = ["fr"];
const FONT_PROPERTIES = ["font", "font-family"];
const NAMED_ONLY_PROPERTIES = [
  "font-size",
  "font-weight",
  "line-height",
  "z-index",
];
const VALUES_THAT_NAME_NOTHING = ["", "inherit", "initial", "unset"];

interface Declaration {
  property: string;
  value: string;
}

function declarations(stylesheet: string): Declaration[] {
  const checked = stylesheet.replace(COMMENT, "").replace(NAMED_VALUE, "");
  const found: Declaration[] = [];
  for (const [, property = "", value = ""] of checked.matchAll(DECLARATION)) {
    found.push({ property: property.toLowerCase(), value: value.trim() });
  }
  return found;
}

function colourWords(value: string): string[] {
  const words = value.toLowerCase().split(WORD_BREAK);
  return words.filter((word) => CSS_COLOUR_NAMES.has(word));
}

function hasForbiddenUnit(size: string): boolean {
  const unit = size.match(UNIT)?.[0] ?? "";
  return !ALLOWED_UNITS.includes(unit.toLowerCase());
}

function sizesWithUnit(value: string): string[] {
  const sizes = value.match(NUMBER_WITH_UNIT) ?? [];
  return sizes.filter(hasForbiddenUnit);
}

function mustBeNamed(property: string): boolean {
  return (
    FONT_PROPERTIES.includes(property) ||
    NAMED_ONLY_PROPERTIES.includes(property)
  );
}

function widthRules(stylesheet: string): string[] {
  const rules = stylesheet.replace(COMMENT, "").match(WIDTH_RULE) ?? [];
  return rules.map((rule) => rule.trim());
}

function looseValuesIn({ property, value }: Declaration): string[] {
  const namesNothing = VALUES_THAT_NAME_NOTHING.includes(value.toLowerCase());
  if (mustBeNamed(property) && !namesNothing) {
    return [`${property}: ${value}`];
  }
  return [
    ...(value.match(HEX_COLOUR) ?? []),
    ...(value.match(COLOUR_FUNCTION) ?? []),
    ...colourWords(value),
    ...sizesWithUnit(value),
  ];
}

/**
 * Lists the colours, sizes and fonts written straight into a stylesheet
 * instead of through a named value.
 *
 * Found: a colour as hex, function or word; a number with any unit except
 * `fr`; any value of `font`, `font-family`, `font-size`, `font-weight`,
 * `line-height` or `z-index` that is not a named value; and every `@media`
 * or `@container` rule, because the widths where the layout changes are
 * written in the tokens file only.
 *
 * Still allowed: `0`, plain numbers elsewhere, `%`, `fr`, and keywords such
 * as `none`, `auto`, `inherit`, `transparent` and `currentColor`.
 */
export function findLooseValues(stylesheet: string): string[] {
  return [
    ...widthRules(stylesheet),
    ...declarations(stylesheet).flatMap(looseValuesIn),
  ];
}
