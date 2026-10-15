import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AttendanceBars } from "./dashboard-bars";

const NOTHING = { present: 0, absent: 0, leave: 0 };
const UNCOUNTED = { attendance: NOTHING, activities: 0, announced: 0 };
const BY_DORM = {
  wismantara_putra: NOTHING,
  wismantara_putri: NOTHING,
  dana_rakca: NOTHING,
  cipta_bakti: NOTHING,
};
const RESIDENTS = {
  wismantara_putra: 0,
  wismantara_putri: 0,
  dana_rakca: 0,
  cipta_bakti: 0,
};

function render(announced: number): string {
  const overall = { ...UNCOUNTED, announced };
  return renderToStaticMarkup(
    <AttendanceBars
      byOrganiser={{ upk: UNCOUNTED, coach: UNCOUNTED, bam: UNCOUNTED }}
      byDorm={BY_DORM}
      residents={RESIDENTS}
      overall={overall}
    />,
  );
}

describe("AttendanceBars", () => {
  it("says no activity is announced when none is, with a - on each bar", () => {
    const shown = render(0);

    expect(shown).toContain("Belum ada kegiatan yang diumumkan.");
    expect(shown).toContain(">-</span>");
  });

  it("says no activity had a student the account sees, when some are announced but none of them has one", () => {
    const shown = render(2);

    expect(shown).toContain(
      "Belum ada kegiatan yang diikuti penghuni yang Anda lihat.",
    );
    expect(shown).not.toContain("Belum ada kegiatan yang diumumkan.");
  });
});
