import { describe, expect, it } from "vitest";
import {
  ANNOUNCED_ON_SAVE,
  announcementNote,
  type TypedRow,
  withDraftRow,
  withoutDraftRow,
} from "./violation-draft";
import {
  NEEDS_OTHER_PUNISHMENT,
  NEEDS_REASON,
  NEEDS_STUDENT,
  NOT_FOR_YOURSELF,
} from "./violation-input";
import type { ViolationPick } from "./violation-residents";

const ANI: ViolationPick = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Ani",
  nim: "9900000001",
  dorm: "dana_rakca",
};
const OWN = "00000000-0000-4000-8000-000000000002";

function typed(more: Partial<TypedRow> = {}): TypedRow {
  return {
    reason: "Terlambat apel pagi",
    punishment: "warning",
    otherPunishment: "",
    ...more,
  };
}

describe("withDraftRow", () => {
  it("adds the picked student's row after the others", () => {
    const first = withDraftRow([], ANI, typed(), OWN, "a");
    if (!first.ok) throw new Error(first.error);
    const second = withDraftRow(
      first.value,
      ANI,
      typed({ reason: "Keluar asrama tanpa izin" }),
      OWN,
      "b",
    );

    expect(second).toMatchObject({
      ok: true,
      value: [
        {
          key: "a",
          studentId: ANI.id,
          name: "Ani",
          reason: "Terlambat apel pagi",
        },
        { key: "b", reason: "Keluar asrama tanpa izin" },
      ],
    });
  });

  it("refuses no student, a reason under 3 letters and an empty Hukuman lainnya", () => {
    expect(withDraftRow([], null, typed(), OWN, "a")).toEqual({
      ok: false,
      error: NEEDS_STUDENT,
    });
    expect(withDraftRow([], ANI, typed({ reason: "ab" }), OWN, "a")).toEqual({
      ok: false,
      error: NEEDS_REASON,
    });
    expect(
      withDraftRow([], ANI, typed({ punishment: "other" }), OWN, "a"),
    ).toEqual({ ok: false, error: NEEDS_OTHER_PUNISHMENT });
  });

  it("refuses a row for the one who records it", () => {
    const self = { ...ANI, id: OWN };

    expect(withDraftRow([], self, typed(), OWN, "a")).toEqual({
      ok: false,
      error: NOT_FOR_YOURSELF,
    });
  });
});

describe("withoutDraftRow", () => {
  it("takes out only the row pressed", () => {
    const rows = withDraftRow([], ANI, typed(), OWN, "a");
    if (!rows.ok) throw new Error(rows.error);
    const both = withDraftRow(rows.value, ANI, typed(), OWN, "b");
    if (!both.ok) throw new Error(both.error);

    expect(withoutDraftRow(both.value, "a").map((row) => row.key)).toEqual([
      "b",
    ]);
  });
});

describe("announcementNote", () => {
  // 10:00 on campus on 12 October 2026.
  const NOW = new Date("2026-10-12T03:00:00Z");

  it("says when the list is announced and until when an appeal is possible", () => {
    expect(announcementNote("2026-10-12", "21:00", NOW)).toBe(
      "Diumumkan 12 Okt 2026 21:00; batas advokasi 13 Okt 2026 00:00.",
    );
  });

  it("says a passed hour announces the list as it is saved", () => {
    expect(announcementNote("2026-10-12", "09:00", NOW)).toBe(
      ANNOUNCED_ON_SAVE,
    );
  });

  it("says nothing while the day or the hour is not filled in", () => {
    expect(announcementNote("", "21:00", NOW)).toBe("");
  });
});
