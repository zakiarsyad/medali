// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { activeAccounts } from "@/auth/accounts";
import type { RoleId } from "@/auth/role-ids";
import { fillWithSampleData } from "@/db/seed";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { COACHING_START } from "./coaching-address";
import { readCoachingBoard } from "./coaching-board";
import { readStudentCoaching } from "./student-coaching";

// Loading the sample data in the shared database keeps every other check
// that loads it waiting until this one ends.
const own = withOwnTestDatabase("panelpembinaan");

/** "Within about 1 second", for the panel's read on one opening. */
const OPENING_LIMIT_MS = 1000;

const READER_ROLES: RoleId[] = [
  "head_of_unit",
  "director",
  "head_of_program",
  "mentor",
];

describe("Pembinaan (level) on the sample data", { timeout: 60_000 }, () => {
  it("reads a listed student's panel for each role within about 1 second", async () => {
    const { db } = own;
    await fillWithSampleData(db);
    const accounts = await activeAccounts(db);

    for (const role of READER_ROLES) {
      const account = accounts.find((each) => each.roles.includes(role));
      if (!account) throw new Error(`No sample account is ${role}.`);
      const board = await readCoachingBoard(
        db,
        account,
        COACHING_START,
        campusDay(),
      );
      const [first] = board?.list.rows ?? [];
      if (!first) throw new Error(`The sample data lists nobody for ${role}.`);

      const started = performance.now();
      const coaching = await readStudentCoaching(db, account, first.studentId);
      const took = performance.now() - started;

      expect(took, role).toBeLessThan(OPENING_LIMIT_MS);
      expect(coaching, role).toEqual({
        level: first.level,
        weakest: first.weakest,
        status: first.status,
        note: first.note,
      });
    }
  });
});
