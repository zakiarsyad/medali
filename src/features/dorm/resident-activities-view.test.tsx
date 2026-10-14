import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ResidentActivities } from "./resident-activities";
import { ResidentActivitiesView } from "./resident-activities-view";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

const NOW = { day: "2026-10-14", time: "18:00" };

function view(activities: Partial<ResidentActivities>): string {
  return renderToStaticMarkup(
    <ResidentActivitiesView
      activities={{
        dorm: "dana_rakca",
        now: NOW,
        today: [],
        coming: [],
        ...activities,
      }}
    />,
  );
}

describe("Kegiatan asrama for a resident", () => {
  it("shows Hari ini as cards with the time, the place, the state, the penanggung jawab and the rincian", () => {
    const shown = view({ today: [TEST_ROW, TEST_ONE_OFF] });

    expect(shown).toContain("Hari ini</h2>");
    expect(shown.match(/<h3/g)).toHaveLength(2);
    expect(shown).toContain("05:30–06:15 · Lapangan uji");
    expect(shown).toContain("Selesai</span>");
    expect(shown).toContain("Hari ini, belum dimulai</span>");
    expect(shown).toContain("Penanggung jawab: ");
    expect(shown).toContain("Pelatih</span>");
    expect(shown).toContain("Tim Pelatih Uji");
    expect(shown).toContain("<b>05:30</b><span>Apel uji</span>");
  });

  it("shows Akan datang with the day, the name, the penanggung jawab, the time and the place of each", () => {
    const coming = [
      { day: "2026-10-15", activity: TEST_ROW },
      { day: "2026-10-16", activity: TEST_ROW },
    ];
    const shown = view({ coming });

    expect(shown).toContain("Akan datang</h2>");
    expect(shown).toContain("15 Okt 2026");
    expect(shown).toContain("16 Okt 2026");
    expect(shown.match(/<b>Apel pagi uji<\/b>/g)).toHaveLength(2);
  });

  it("says so when there is nothing today or to come", () => {
    const shown = view({});

    expect(shown).toContain("Tidak ada kegiatan hari ini.");
    expect(shown).toContain("Belum ada jadwal.");
  });

  it("offers nothing to change", () => {
    const shown = view({ today: [TEST_ROW] });

    expect(shown).not.toContain("<button");
    expect(shown).not.toContain("<form");
  });
});
