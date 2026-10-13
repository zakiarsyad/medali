import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { linesOf } from "@/auth/asks-who";
import { SCHEDULE_ALREADY_SENT } from "./add-schedule";
import {
  isOutdatedList,
  SCHEDULE_CHANGED_BY_OTHER,
  SCHEDULE_NOT_FOUND,
} from "./change-schedule";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import { NO_ACTIVITY } from "./schedule-input";

const ACTIONS = readFileSync("src/features/activities/actions.ts", "utf8");

describe("isOutdatedList", () => {
  it("is so when someone else changed or removed the schedule since the form opened", () => {
    expect(isOutdatedList(SCHEDULE_CHANGED_BY_OTHER.error)).toBe(true);
    expect(isOutdatedList(SCHEDULE_NOT_FOUND.error)).toBe(true);
  });

  it("is not so for a fault in the form itself, or for a role without the right", () => {
    expect(isOutdatedList(NO_ACTIVITY.error)).toBe(false);
    expect(isOutdatedList(SCHEDULES_NOT_ALLOWED.error)).toBe(false);
    expect(isOutdatedList(SCHEDULE_ALREADY_SENT.error)).toBe(false);
    expect(isOutdatedList("Jam selesai harus setelah jam mulai.")).toBe(false);
  });
});

describe("what a person is told when the schedule is gone or changed", () => {
  it("says what happened and what to do next", () => {
    expect(SCHEDULE_NOT_FOUND.error).toContain("dihapus orang lain");
    expect(SCHEDULE_NOT_FOUND.error).toContain("Tekan Batal");
    expect(SCHEDULE_NOT_FOUND.error).toContain("daftar terbaru");
    expect(SCHEDULE_CHANGED_BY_OTHER.error).toContain("diubah orang lain");
    expect(SCHEDULE_CHANGED_BY_OTHER.error).toContain("Tekan Batal");
  });
});

describe("a refused save or removal", () => {
  it("has the list read again when it is out of date, so the table shows what is there now", () => {
    expect(linesOf(ACTIONS, "refusal")).toEqual([
      "if (isOutdatedList(error)) revalidatePath(SCHEDULES_ADDRESS);",
      "return { error, done: null };",
    ]);
  });

  it.each(["saveScheduleAction", "removeScheduleAction"])(
    "%s answers every refusal that way",
    (action) => {
      const refusals = linesOf(ACTIONS, action).filter((line) =>
        line.includes(".ok) return"),
      );

      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toMatch(
        /^if \(!\w+\.ok\) return refusal\(\w+\.error\);$/,
      );
    },
  );
});
