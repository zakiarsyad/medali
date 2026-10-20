import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkFields } from "./mental-health-mark-fields";
import { MARK_FORM_NOTE } from "./mental-health-mark-words";

function fieldNamed(html: string, name: string): string {
  return html.match(new RegExp(`<[^<]*name="${name}"[^>]*>`))?.[0] ?? "";
}

describe("MarkFields", () => {
  it("shows the part with its note, the three choices and the confidential observation", () => {
    const html = renderToStaticMarkup(<MarkFields mark={null} />);

    expect(html).toContain("Potensi kesehatan mental");
    expect(html).toContain(MARK_FORM_NOTE);
    expect(MARK_FORM_NOTE).toContain("bukan diagnosis");
    expect(html).toContain("Kategori potensi");
    expect(html).toContain("Pengamatan (rahasia)");
    expect(html).toContain(
      '<option value="" selected="">Tidak ada indikasi</option>',
    );
    expect(html).toContain(
      '<option value="monitor">Potensi: perlu pemantauan</option>',
    );
    expect(html).toContain(
      '<option value="refer">Potensi: perlu dirujuk ke konselor</option>',
    );
    expect(fieldNamed(html, "markObservation")).toContain("disabled");
  });

  it("is filled with the student's current mark", () => {
    const html = renderToStaticMarkup(
      <MarkFields mark={{ category: "refer", observation: "Menarik diri." }} />,
    );

    expect(html).toContain(
      '<option value="refer" selected="">Potensi: perlu dirujuk ke konselor</option>',
    );
    const observation = fieldNamed(html, "markObservation");
    expect(observation).toContain('value="Menarik diri."');
    expect(fieldNamed(html, "markFilledCategory")).toContain('value="refer"');
    expect(fieldNamed(html, "markFilledObservation")).toContain(
      'value="Menarik diri."',
    );
    expect(observation).not.toContain("disabled");
  });

  it("lays its fields out on the shared form grid, which is one column at phone width", () => {
    const code = readFileSync(
      "src/features/dorm/mental-health-mark-fields.tsx",
      "utf8",
    );
    expect(code).toContain("<div className={shared.form}>");
  });
});
