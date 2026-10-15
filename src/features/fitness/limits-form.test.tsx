import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_LIMITS, STARTING_VERSION } from "./fitness-ids";
import { LimitsForm } from "./limits-form";

function shownForm(): string {
  return renderToStaticMarkup(
    <LimitsForm
      inForce={{
        limits: STARTING_LIMITS,
        version: STARTING_VERSION,
        set: null,
      }}
    />,
  );
}

describe("Ambang skor for Kepala Unit", () => {
  it("lets the three limits be typed in, and offers Simpan ambang", () => {
    const page = shownForm();

    const fields = page.match(/<input(?![^>]*type="hidden")[^>]*>/g);
    expect(fields).toHaveLength(3);
    for (const field of fields ?? []) {
      expect(field).not.toContain("disabled");
    }
    expect(page).toMatch(/<button type="submit"[^>]*>Simpan ambang<\/button>/);
    expect(page).toContain(
      "Ambang awal, sesuaikan dengan pedoman tes kebugaran.",
    );
    expect(page).not.toContain("Ambang ditetapkan oleh");
  });

  it("carries the version of the limits it was opened on", () => {
    expect(shownForm()).toContain(
      '<input type="hidden" name="version" value="start"/>',
    );
  });
});
