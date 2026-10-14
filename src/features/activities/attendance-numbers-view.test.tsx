import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AttendanceNumbers } from "./attendance-numbers";
import { AttendanceNumbersView } from "./attendance-numbers-view";
import type { ScheduleKind } from "./schedule-list-address";

function shown(
  numbers: AttendanceNumbers,
  kind: ScheduleKind = "ppks",
): string {
  return renderToStaticMarkup(
    <AttendanceNumbersView numbers={numbers} kind={kind} />,
  );
}

function card(label: string, amount: string, note: string): RegExp {
  return new RegExp(
    `<dt[^>]*>${label}</dt><dd[^>]*>${amount}</dd><dd[^>]*>${note}</dd>`,
  );
}

describe("AttendanceNumbersView", () => {
  it("shows the four numbers, each with its line below", () => {
    const view = shown({
      mean: { percent: 87.5, students: 1250 },
      held: 12,
      waiting: 31,
      coming: 5,
    });

    expect(view).toMatch(
      card("Rerata nilai kehadiran", "87,5%", "1.250 mahasiswa"),
    );
    expect(view).toMatch(card("Kegiatan terlaksana", "12", "PPKS wajib"));
    expect(view).toMatch(card("Menunggu verifikasi", "31", "foto kehadiran"));
    expect(view).toMatch(card("Terjadwal", "5", "akan datang"));
  });

  it("counts the required extra activities held on the tab Kegiatan tambahan", () => {
    const view = shown(
      { mean: { percent: 90, students: 4 }, held: 2, waiting: 0, coming: 1 },
      "extra",
    );

    expect(view).toMatch(card("Kegiatan terlaksana", "2", "tambahan wajib"));
  });

  it('shows "-" as the mean while no student has a score, and a whole mean with its decimal', () => {
    const none = shown({
      mean: { percent: null, students: 0 },
      held: 0,
      waiting: 0,
      coming: 0,
    });
    const whole = shown({
      mean: { percent: 40, students: 5 },
      held: 1,
      waiting: 1,
      coming: 1,
    });

    expect(none).toMatch(card("Rerata nilai kehadiran", "-", "0 mahasiswa"));
    expect(whole).toMatch(
      card("Rerata nilai kehadiran", "40,0%", "5 mahasiswa"),
    );
  });
});
