import { existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MedaliLogo } from "./medali-logo";

describe("the MEDALI logo", () => {
  it('is one picture named "Logo MEDALI" for a screen reader', () => {
    const logo = renderToStaticMarkup(<MedaliLogo />);

    expect(logo).toMatch(/^<svg[^>]*role="img"/);
    expect(logo).toMatch(/^<svg[^>]*aria-label="Logo MEDALI"/);
  });

  it("is the icon of the browser tab", () => {
    expect(existsSync("src/app/icon.svg")).toBe(true);
  });
});
