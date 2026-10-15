import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SchemeForm } from "./scheme-form";
import { STARTING_SCHEME, STARTING_VERSION } from "./scheme-ids";

function shownForm(): string {
  return renderToStaticMarkup(
    <SchemeForm
      inForce={{
        scheme: STARTING_SCHEME,
        version: STARTING_VERSION,
        set: null,
      }}
    />,
  );
}

describe("Skema bobot for Kepala Unit", () => {
  it("lets every field be typed in, and offers Simpan skema", () => {
    const page = shownForm();

    const fields = page.match(/<(input|select)(?![^>]*type="hidden")[^>]*>/g);
    expect(fields).toHaveLength(9);
    for (const field of fields ?? []) {
      expect(field).not.toContain("disabled");
    }
    expect(page).toMatch(/<button type="submit"[^>]*>Simpan skema<\/button>/);
    expect(page).not.toMatch(/<button[^>]*disabled[^>]*>Simpan skema/);
    expect(page).not.toContain("Skema bobot ditetapkan oleh");
  });

  it("carries the version of the scheme it was opened on", () => {
    expect(shownForm()).toContain(
      '<input type="hidden" name="version" value="start"/>',
    );
  });
});
