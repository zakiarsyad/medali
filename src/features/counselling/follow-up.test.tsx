// Sample NIMs of this file: 9988720200 to 9988720299.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ConsentPick } from "./consent-picks";
import { CounsellorConsentPanel } from "./counsellor-consent-panel";
import { followUpOf } from "./follow-up";
import type { ReferralRow } from "./referral-view";
import type { ConsentPicking } from "./use-consent-pick";

const ROW: ReferralRow = {
  studentId: "00000000-0000-4000-8000-000000000201",
  name: "Budi Tindak Lanjut",
  nim: "9988720201",
  program: "D3 Pajak",
  dorm: "cipta_bakti",
  room: null,
  observation: "Menarik diri.",
  markedAt: new Date("2026-10-14T03:00:00Z"),
  markedBy: "Sari Kesehatan",
  consent: null,
  activeSchedule: null,
};

/** The panel's state once the server says the student was never asked. */
function pickingOf(picked: ConsentPick): ConsentPicking {
  return {
    picked,
    looked: { ok: true, value: null },
    sessions: null,
    message: { error: null, done: null },
    pending: false,
    pick: () => undefined,
    clear: () => undefined,
    send: () => undefined,
  };
}

describe("Tindak lanjuti of a referral", () => {
  it("puts the referred student in Persetujuan konseling, ready for Kirim permintaan persetujuan", () => {
    const picks: ConsentPick[] = [];
    let broughtIntoView = 0;
    const followUp = followUpOf(
      (student) => picks.push(student),
      () => {
        broughtIntoView += 1;
      },
    );

    followUp(ROW);

    expect(picks).toEqual([
      {
        id: ROW.studentId,
        name: "Budi Tindak Lanjut",
        nim: "9988720201",
        program: "D3 Pajak",
      },
    ]);
    expect(broughtIntoView).toBe(1);
    const [picked] = picks;
    if (!picked) throw new Error("No student was picked.");
    const html = renderToStaticMarkup(
      <CounsellorConsentPanel picking={pickingOf(picked)} />,
    );
    expect(html).toContain("Budi Tindak Lanjut");
    expect(html).toContain("NIM 9988720201 · D3 Pajak");
    expect(html).toContain(">Kirim permintaan persetujuan</button>");
  });
});
