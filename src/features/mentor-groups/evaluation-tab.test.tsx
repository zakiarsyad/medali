import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ListedEvaluation } from "./evaluation-rows";
import { FormArea, TabLists } from "./evaluation-tab";
import { FormPartLinks } from "./form-part-links";
import type { ListedReplacement } from "./replacement-rows";

const WAITING: ListedReplacement = {
  id: "00000000-0000-4000-8000-000000000002",
  startsOn: "2026-11-02",
  group: {
    id: "00000000-0000-4000-8000-000000000001",
    studyProgramId: 7,
    cohortYear: 2025,
    entryPath: "regular",
    number: 1,
    programCode: "UJI",
  },
  members: 30,
  oldMentorName: "Pengasuh Uji Lama",
  oldMentorStatus: "reserve",
  newMentorName: "Pengasuh Uji Baru",
  reason: "own_request",
  note: null,
  letterNumber: "ND-1/UJI/2026",
  status: "scheduled",
  cancelled: null,
};

const EVALUATION: ListedEvaluation = {
  id: "00000000-0000-4000-8000-000000000003",
  period: { startYear: 2026, term: "odd" },
  group: WAITING.group,
  mentorName: "Pengasuh Uji Lama",
  activity: 80,
  attendance: 80,
  achievement: 80,
  feedback: 80,
  note: null,
  evaluatedAt: new Date("2026-10-13T03:00:00Z"),
  evaluatorName: "Kepala Uji",
};

const WHO_DOES_IT =
  "Evaluasi dan penggantian pengasuh dilakukan oleh Kepala Unit Pembangunan Karakter.";

/** The tab under its head, as an account that only reads or as Kepala Unit. */
function shownTo(reader: "reads" | "kepala unit"): string {
  const mayCancel = reader === "kepala unit";
  const form = mayCancel ? (
    <FormPartLinks
      offered={["evaluation", "replacement"]}
      open="evaluation"
      chosenGroupId={null}
    />
  ) : null;
  return renderToStaticMarkup(
    <>
      <FormArea form={form} />
      <TabLists
        replacements={[WAITING]}
        rights={{ groupLimit: { kind: "all" }, mayCancel }}
        latest={[EVALUATION]}
      />
    </>,
  );
}

describe("the tab Evaluasi dan penggantian for an account that only reads", () => {
  const screen = shownTo("reads");

  it("says who does the work, then shows Riwayat penggantian and Evaluasi terbaru", () => {
    expect(screen).toContain(WHO_DOES_IT);
    expect(screen).toMatch(
      /Riwayat penggantian<\/h2>.*Pengasuh Uji Baru.*Evaluasi terbaru<\/h2>.*Ganjil 2026\/2027/s,
    );
  });

  it("has no form, no switch, no steps and no button: also none on a replacement that waits", () => {
    expect(screen).toContain("Terjadwal");
    for (const absent of [
      "<form",
      "<button",
      "Bagian formulir",
      "Alur penggantian",
      "Batalkan",
      "Ganti pengasuh",
    ]) {
      expect(screen).not.toContain(absent);
    }
  });
});

describe("the tab Evaluasi dan penggantian for Kepala Unit", () => {
  const screen = shownTo("kepala unit");

  it("shows the form beside Alur penggantian, the switch, and Batalkan on a replacement that waits", () => {
    expect(screen).not.toContain(WHO_DOES_IT);
    for (const present of [
      "Bagian formulir",
      "Alur penggantian",
      "Riwayat penggantian",
      "Batalkan",
      "Evaluasi terbaru",
    ]) {
      expect(screen).toContain(present);
    }
  });
});
