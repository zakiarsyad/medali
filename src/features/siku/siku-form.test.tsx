import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SikuForm } from "./siku-form";

describe("Input nilai SIKU", () => {
  const html = renderToStaticMarkup(
    <SikuForm
      newEntryId="7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f"
      base={100}
      today="2026-10-24"
      groups={[]}
    />,
  );

  it("chooses Penambahan or Pengurangan in the shared choose-one row, named Jenis", () => {
    expect(html).toMatch(
      /<fieldset class="[^"]*modes[^"]*"><legend[^>]*>Jenis<\/legend>/,
    );
    expect(html).toContain('aria-pressed="true">Penambahan</button>');
    expect(html).toContain('aria-pressed="false">Pengurangan</button>');
  });

  it("sends the chosen kind with the form", () => {
    expect(html).toContain('<input type="hidden" name="kind" value="gain"/>');
  });
});
