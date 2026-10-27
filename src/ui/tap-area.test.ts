import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rulesOf } from "./css-rules";
import { inForce, resolvedValue, tokenBlocks } from "./tokens-read";

const TOKENS = tokenBlocks(readFileSync("src/ui/tokens.css", "utf8"));
const PHONE = inForce(TOKENS.light, TOKENS.phone);
const TAP = "var(--tap-least)";

function declarationsOf(file: string, selector: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const rule of rulesOf(readFileSync(file, "utf8"))) {
    const selectors = [rule.selector, ...rule.selector.split(", ")];
    if (!selectors.includes(selector)) continue;
    for (const [property, value] of rule.declarations) {
      found.set(property, value);
    }
  }
  return found;
}

describe("the tap area", () => {
  it("is the tap size on a phone", () => {
    expect(resolvedValue("--tap-least", PHONE)).toBe("44px");
  });

  it("leaves the least size as it was on a computer", () => {
    expect(resolvedValue("--tap-least", TOKENS.light)).toBe("auto");
  });

  it.each(["--field-height", "--button-height"])(
    "makes %s the tap size on a phone",
    (name) => {
      expect(resolvedValue(name, PHONE)).toBe("44px");
    },
  );

  it("lets a link stand as a box on a phone only", () => {
    expect(resolvedValue("--link-display", TOKENS.light)).toBe("inline");
    expect(resolvedValue("--link-display", PHONE)).toBe("inline-block");
  });
});

describe("the shared parts", () => {
  it.each([
    ["src/ui/data-screen.module.css", ".button"],
    ["src/ui/data-screen.module.css", ".quiet"],
  ])("%s %s is at least as wide as the tap area", (file, selector) => {
    expect(declarationsOf(file, selector).get("min-width")).toBe(TAP);
  });

  it.each([
    ["src/ui/data-screen.module.css", ".link"],
    ["src/ui/data-screen.module.css", ".danger"],
    ["src/ui/data-screen.module.css", ".role"],
    ["src/ui/tab-links.module.css", ".tab"],
    ["src/ui/top-bar.module.css", ".menuButton"],
  ])("%s %s takes the tap area both ways", (file, selector) => {
    const rule = declarationsOf(file, selector);
    expect(rule.get("min-width")).toBe(TAP);
    expect(rule.get("min-height")).toBe(TAP);
  });

  it.each([
    ["src/ui/menu-links.module.css", ".link"],
    ["src/ui/account-box.module.css", ".out"],
    ["src/ui/file-upload.module.css", ".mode"],
    ["src/ui/file-upload.module.css", ".skipped summary"],
  ])("%s %s is at least as high as the tap area", (file, selector) => {
    expect(declarationsOf(file, selector).get("min-height")).toBe(TAP);
  });

  it("stands a link as a box without weight, so a screen's own display wins", () => {
    const rule = declarationsOf(
      "src/ui/data-screen.module.css",
      ":where(a.link, a.danger)",
    );
    expect(rule.get("display")).toBe("var(--link-display)");
  });

  it("keeps a link inline inside running words, where no least size applies", () => {
    const rule = declarationsOf("src/ui/data-screen.module.css", ".inline");
    expect(rule.get("display")).toBe("inline");
  });
});
