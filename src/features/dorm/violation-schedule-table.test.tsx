// Sample NIMs of this file: 9989640000 to 9989640099. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OWN_RECORD_NOTE } from "./own-record";
import type { ScheduledViolation } from "./violation-schedule";
import { ViolationScheduleTable } from "./violation-schedule-table";

vi.mock("./violation-actions", () => ({ cancelViolationAction: vi.fn() }));

const ANI = "00000000-0000-4000-8000-0000000000a1";

const ROW: ScheduledViolation = {
  id: "00000000-0000-4000-8000-0000000000c1",
  studentId: ANI,
  announcedAt: new Date("2026-10-12T14:00:00Z"),
  day: "2026-10-12",
  name: "Penghuni Uji Jadwal",
  nim: "9989640001",
  dorm: "dana_rakca",
  reason: "Terlambat apel pagi",
  punishment: "warning",
  otherPunishment: "",
  enteredBy: "BAM Uji Jadwal",
};

function table(ownStudentId: string | null): string {
  return renderToStaticMarkup(
    <ViolationScheduleTable rows={[ROW]} ownStudentId={ownStudentId} />,
  );
}

describe("ViolationScheduleTable", () => {
  it("offers Batalkan on a violation of another resident, and to an account that is not a student", () => {
    for (const own of ["00000000-0000-4000-8000-0000000000b2", null]) {
      const shown = table(own);

      expect(shown).toContain(">Batalkan</button>");
      expect(shown).not.toContain(OWN_RECORD_NOTE);
    }
  });

  it("shows the account's own violation with the line in place of Batalkan, with the key in capitals too", () => {
    for (const own of [ANI, ANI.toUpperCase()]) {
      const shown = table(own);

      expect(shown).toContain("Penghuni Uji Jadwal");
      expect(shown).toContain(OWN_RECORD_NOTE);
      expect(shown).not.toContain("Batalkan");
    }
  });
});
