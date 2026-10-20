import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ConsentStatus } from "./consent-ids";
import type { ConsentView } from "./consent-view";
import { CounsellorSessionPart } from "./counsellor-session-part";
import { NEEDS_CONSENT } from "./session-words";

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

const STUDENT_ID = "00000000-0000-4000-8000-00000005e551";

function consentOf(status: ConsentStatus): ConsentView {
  return {
    status,
    way: status === "approved" ? "paper" : null,
    changedAt: MOMENT,
    counsellorName: null,
    version: MOMENT.toISOString(),
  };
}

function partOf(consent: ConsentView | null): string {
  return renderToStaticMarkup(
    <CounsellorSessionPart studentId={STUDENT_ID} consent={consent} />,
  );
}

function optionsOf(page: string, name: string): string[] {
  const select = page.match(
    new RegExp(`<select name="${name}"[^>]*>(.*?)</select>`),
  );
  return [
    ...(select?.[1] ?? "").matchAll(/<option[^>]*>([^<]*)<\/option>/g),
  ].map((match) => match[1] ?? "");
}

describe("the sessions of a student picked by Konselor", () => {
  it.each([null, ...(["waiting", "declined", "withdrawn"] as const)])(
    "say a session needs the consent, with no form, while it is %s",
    (status) => {
      const page = partOf(status === null ? null : consentOf(status));

      expect(page).toContain(NEEDS_CONSENT);
      expect(page).not.toContain("Catat sesi");
      expect(page).not.toContain("<form");
    },
  );

  it("offer Catat sesi with every field once the consent is Disetujui", () => {
    const page = partOf(consentOf("approved"));

    expect(page).not.toContain(NEEDS_CONSENT);
    expect(page).toContain("Catat sesi");
    expect(page).toContain("Tanggal sesi");
    expect(page).toMatch(/<input type="date"[^>]*name="day"/);
    expect(optionsOf(page, "kind")).toEqual([
      "Individu tatap muka",
      "Individu daring",
      "Kelompok",
    ]);
    expect(optionsOf(page, "topic")).toEqual([
      "Akademik",
      "Adaptasi kampus",
      "Keluarga",
      "Relasi sosial",
      "Keuangan",
      "Emosi dan stres",
      "Lainnya",
    ]);
    expect(page).toContain("Catatan sesi (rahasia)");
    expect(optionsOf(page, "followUp")).toEqual([
      "Sesi lanjutan",
      "Pemantauan",
      "Rujuk ke psikolog klinis",
      "Rujuk ke psikiater",
      "Selesai",
    ]);
    expect(page).toContain("Sesi berikutnya (opsional)");
    expect(page).toContain(`name="studentId" value="${STUDENT_ID}"`);
    expect(page).toContain("Simpan sesi");
  });
});
