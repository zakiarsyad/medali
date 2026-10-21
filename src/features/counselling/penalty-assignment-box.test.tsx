import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PenaltyAssignmentBox } from "./penalty-assignment-box";
import type { PenaltyAssignment } from "./penalty-assignments";

/** Senin 19 Oktober 2026, 10:05 on campus. */
const SENT: Pick<PenaltyAssignment, "sentAt" | "sentBy"> = {
  sentAt: new Date("2026-10-19T03:05:00Z"),
  sentBy: "Pembina Contoh",
};

function box(assignment: Omit<PenaltyAssignment, "sentAt" | "sentBy">) {
  return renderToStaticMarkup(
    <PenaltyAssignmentBox assignment={{ ...assignment, ...SENT }} />,
  );
}

describe("how a Penugasan sent from a penalty stands, for its sender", () => {
  it("shows Konseling wajib, Menunggu jadwal, when and by whom it was sent, and that the session is the counsellor's alone", () => {
    const html = box({ status: "awaiting", day: null, hour: null });

    expect(html).toContain("<b>Konseling wajib:</b>");
    expect(html).toContain("Menunggu jadwal");
    expect(html).toContain("Ditugaskan 19 Okt 2026, 10.05 oleh Pembina Contoh.");
    expect(html).toContain("Isi sesi konseling hanya diketahui konselor.");
    expect(html).not.toContain("pukul");
  });

  it.each([
    ["scheduled", "Dijadwalkan"],
    ["done", "Selesai"],
    ["missed", "Tidak hadir"],
  ] as const)(
    "shows %s with the date and Jam Konselor set",
    (status, words) => {
      const html = box({ status, day: "2026-10-26", hour: "10:00" });

      expect(html).toContain(words);
      expect(html).toContain("26 Okt 2026 pukul 10:00");
    },
  );

  it("shows Minta jadwal ulang with no time", () => {
    const html = box({ status: "reschedule_asked", day: null, hour: null });

    expect(html).toContain("Minta jadwal ulang");
    expect(html).not.toContain("pukul");
  });
});
