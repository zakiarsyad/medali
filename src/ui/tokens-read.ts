const COMMENT = /\/\*[\s\S]*?\*\//g;
const NAMED_VALUE_DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;
const PHONE_RULE = "@media (max-width:";
const DARK_RULE = "@media (prefers-color-scheme: dark)";
const LITERAL_COLOUR = /^(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?)\(.*\))$/;
const PX = /^(-?\d*\.?\d+)px$/;
const TEXT_SIZE_NAME = "--text-";

export type NamedValues = Map<string, string>;

export interface TokenBlocks {
  light: NamedValues;
  phone: NamedValues;
  dark: NamedValues;
}

function normalised(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** The named values written in one part of the tokens file. */
export function namedValuesIn(block: string): NamedValues {
  const values: NamedValues = new Map();
  const declarations = block.replace(COMMENT, "");
  for (const [, name = "", value = ""] of declarations.matchAll(
    NAMED_VALUE_DECLARATION,
  )) {
    values.set(name, normalised(value));
  }
  return values;
}

/**
 * Reads the tokens file in its three parts: the light values at any width,
 * the values a phone changes, and the values dark mode changes.
 */
export function tokenBlocks(tokens: string): TokenBlocks {
  const phoneStart = tokens.indexOf(PHONE_RULE);
  const darkStart = tokens.indexOf(DARK_RULE);
  if (phoneStart === -1 || darkStart < phoneStart) {
    throw new Error("The tokens file has no phone part before its dark part.");
  }
  return {
    light: namedValuesIn(tokens.slice(0, phoneStart)),
    phone: namedValuesIn(tokens.slice(phoneStart, darkStart)),
    dark: namedValuesIn(tokens.slice(darkStart)),
  };
}

/** The values in force where `changes` set some names over `base`. */
export function inForce(base: NamedValues, changes: NamedValues): NamedValues {
  return new Map([...base, ...changes]);
}

function isLiteralColour(value: string): boolean {
  return LITERAL_COLOUR.test(value.toLowerCase());
}

function colourKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

/**
 * The groups of colour names that hold the same colour in light and in dark
 * mode. Only names written as a colour count: a name that only points at
 * another name, such as the ink of a part, names a use, not a colour.
 */
export function sameColourNames(
  light: NamedValues,
  dark: NamedValues,
): string[][] {
  const namesByColours = new Map<string, string[]>();
  for (const [name, lightValue] of light) {
    if (!isLiteralColour(lightValue)) continue;
    const darkValue = dark.get(name) ?? lightValue;
    const key = `${colourKey(lightValue)} ${colourKey(darkValue)}`;
    namesByColours.set(key, [...(namesByColours.get(key) ?? []), name]);
  }
  return [...namesByColours.values()].filter((names) => names.length > 1);
}

/** A size in px as a number, or undefined for any other value. */
export function pxOf(value: string): number | undefined {
  const match = value.match(PX);
  if (!match) return undefined;
  return Number(match[1]);
}

interface TextSize {
  name: string;
  px: number;
}

function textSizes(values: NamedValues): TextSize[] {
  const sizes: TextSize[] = [];
  for (const [name, value] of values) {
    const px = pxOf(value);
    if (!name.startsWith(TEXT_SIZE_NAME) || px === undefined) continue;
    sizes.push({ name, px });
  }
  return sizes.sort((a, b) => a.px - b.px);
}

/** The pairs of text sizes, of those in force together, less than 1px apart. */
export function closeTextSizes(values: NamedValues): string[][] {
  const sizes = textSizes(values);
  const close: string[][] = [];
  for (let index = 1; index < sizes.length; index += 1) {
    const smaller = sizes[index - 1];
    const larger = sizes[index];
    if (!smaller || !larger) continue;
    if (larger.px - smaller.px < 1) close.push([smaller.name, larger.name]);
  }
  return close;
}
