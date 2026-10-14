import { describe, expect, it } from "vitest";
import { warningsOf } from "./leave-card";

/** A time on campus, such as 2026-10-14T19:30, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

const NOW = on("2026-10-14T10:00");

function leave(more: Partial<Parameters<typeof warningsOf>[0]> = {}) {
  return {
    kind: "outing" as const,
    status: "submitted" as const,
    start: on("2026-10-15T09:00"),
    end: on("2026-10-15T16:00"),
    ...more,
  };
}

describe("warningsOf", () => {
  it("has none for a request that waits and fits", () => {
    expect(warningsOf(leave(), NOW)).toEqual([]);
  });

  it("warns when the start has passed, in the words of the kind", () => {
    expect(
      warningsOf(
        leave({ start: on("2026-10-14T09:00"), end: on("2026-10-14T16:00") }),
        NOW,
      ),
    ).toEqual(["Waktu berangkat sudah lewat."]);
    expect(
      warningsOf(
        leave({ kind: "skip_activities", start: on("2026-10-14T09:00") }),
        NOW,
      ),
    ).toEqual(["Jam mulai sudah lewat."]);
  });

  it("warns when Izin pesiar is 12 hours or more, or goes overnight", () => {
    expect(warningsOf(leave({ end: on("2026-10-16T08:00") }), NOW)).toEqual([
      "Durasi tidak sesuai ketentuan izin pesiar.",
    ]);
  });

  it("has none for a request that was decided or cancelled", () => {
    const passed = { start: on("2026-10-13T09:00") };

    expect(warningsOf(leave({ ...passed, status: "approved" }), NOW)).toEqual(
      [],
    );
    expect(warningsOf(leave({ ...passed, status: "cancelled" }), NOW)).toEqual(
      [],
    );
  });
});
