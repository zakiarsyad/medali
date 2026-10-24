import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BADGE_TONES } from "./badge-tone";
import shared from "./data-screen.module.css";
import { ToneBadge, toneBadge } from "./tone-badge";

// Starts with a break, so the first rule is found like every other.
const SHARED = `\n${readFileSync("src/ui/data-screen.module.css", "utf8")}`;

/** What a rule of the shared style file holds, without the breaks between its lines. */
function ruleOf(selector: string): string {
  const start = SHARED.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = SHARED.slice(start, SHARED.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

describe("the shared look of a status badge", () => {
  /*
   * Two classes outweigh the one class of .badge and of any badge class of
   * a screen, so the order the style files load in decides nothing.
   */
  it.each(BADGE_TONES)(
    "gives a %s badge the text, background and border of its tone, over the gold badge look",
    (tone) => {
      const rule = ruleOf(`.badge.${tone}`);

      expect(rule).toContain(
        `border: var(--line-width) solid var(--badge-${tone}-line);`,
      );
      expect(rule).toContain(`background: var(--badge-${tone}-bg);`);
      expect(rule).toContain(`color: var(--badge-${tone}-ink);`);
    },
  );

  it.each(BADGE_TONES)("draws a %s badge with its words", (tone) => {
    const html = renderToStaticMarkup(
      <ToneBadge tone={tone}>Menunggu</ToneBadge>,
    );

    expect(html).toMatch(
      new RegExp(
        `^<span class="[^"]*badge[^"]* [^"]*${tone}[^"]*">Menunggu</span>$`,
      ),
    );
  });

  it("leaves a status with no colour of its own the gold badge look", () => {
    expect(toneBadge(null)).toBe(shared.badge);
  });
});
