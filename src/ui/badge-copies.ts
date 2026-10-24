const COMMENT = /\/\*[\s\S]*?\*\//g;
const RULE = /([^{}]+)\{([^{}]*)\}/g;
const DECLARATION = /([\w-]+)\s*:\s*([^;]+)/g;
const STATUS_COLOUR =
  /var\(--(?:ok|warn|bad|fit-good|category-colour|badge-[\w-]+)\)/;
const CATEGORY_COLOUR = "var(--category-colour)";
const LINE_PROPERTIES = ["border", "border-color"];

function declarationsOf(body: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, property = "", value = ""] of body.matchAll(DECLARATION)) {
    found.set(property.toLowerCase(), value.trim());
  }
  return found;
}

function hasStatusLine(declarations: Map<string, string>): boolean {
  return LINE_PROPERTIES.some((property) =>
    STATUS_COLOUR.test(declarations.get(property) ?? ""),
  );
}

function colorsLikeBadge(declarations: Map<string, string>): boolean {
  const text = declarations.get("color") ?? "";
  if (text.includes(CATEGORY_COLOUR)) return true;
  return STATUS_COLOUR.test(text) && hasStatusLine(declarations);
}

/**
 * The selectors of a style file whose rule gives a badge its own status
 * colours: text and border in a status colour, or text in the colour of a
 * category. The shared badge look holds the only such rules.
 */
export function statusBadgeCopies(stylesheet: string): string[] {
  const found: string[] = [];
  const checked = stylesheet.replace(COMMENT, "");
  for (const [, selector = "", body = ""] of checked.matchAll(RULE)) {
    if (colorsLikeBadge(declarationsOf(body))) found.push(selector.trim());
  }
  return found;
}
