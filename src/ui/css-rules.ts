const COMMENT = /\/\*[\s\S]*?\*\//g;
const RULE = /([^{}]+)\{([^{}]*)\}/g;
const DECLARATION = /([\w-]+)\s*:\s*([^;]+)/g;

export interface Rule {
  selector: string;
  declarations: Map<string, string>;
}

function declarationsOf(body: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, property = "", value = ""] of body.matchAll(DECLARATION)) {
    found.set(property.toLowerCase(), value.trim());
  }
  return found;
}

/** The rules of a style file, its comments left out. */
export function rulesOf(stylesheet: string): Rule[] {
  const checked = stylesheet.replace(COMMENT, "");
  const rules: Rule[] = [];
  for (const [, selector = "", body = ""] of checked.matchAll(RULE)) {
    rules.push({
      selector: selector.trim().replace(/\s+/g, " "),
      declarations: declarationsOf(body),
    });
  }
  return rules;
}
