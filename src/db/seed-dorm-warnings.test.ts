// Sample Tahun akademik of this file: those of the app's sample data.
import { describe, expect, it } from "vitest";
import {
  accountRoles,
  dormViolationChanges,
  dormViolations,
  dormWarningLetterChanges,
  dormWarningLetters,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample calls and warning letters", { timeout: 20_000 }, () => {
  it("call one resident, give one SP 1 and two SP 1 and SP 2, by the sample Pengelola Asrama, each logged", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const letters = await db.select().from(dormWarningLetters);
      const lines = await db.select().from(dormWarningLetterChanges);
      const roles = await db.select().from(accountRoles);
      const managers = roles
        .filter((each) => each.role === "dorm_manager")
        .map((each) => each.accountId);

      const shown = letters
        .map((letter) => `${letter.level}:${letter.issuedAt !== null}`)
        .sort();
      expect(shown).toEqual([
        "1:false",
        "1:true",
        "1:true",
        "1:true",
        "2:true",
        "2:true",
      ]);
      expect(new Set(letters.map((letter) => letter.studentId)).size).toBe(4);
      for (const second of letters.filter((letter) => letter.level === 2)) {
        expect(second.proposalNote).not.toBe("");
      }
      for (const letter of letters) {
        const ofIt = lines.filter(
          (line) => line.letterId === letter.id && line.action !== "handled",
        );
        expect(ofIt.map((line) => line.action).sort()).toEqual(
          letter.issuedAt === null ? ["scheduled"] : ["issued", "scheduled"],
        );
        for (const line of ofIt) expect(managers).toContain(line.changedBy);
        if (letter.issuedBy !== null) {
          expect(managers).toContain(letter.issuedBy);
        }
      }
    });
  });

  it("have one proposal Diajukan and one Diproses by the sample Kepala Unit, logged", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const letters = await db.select().from(dormWarningLetters);
      const lines = await db.select().from(dormWarningLetterChanges);
      const roles = await db.select().from(accountRoles);
      const heads = roles
        .filter((each) => each.role === "head_of_unit")
        .map((each) => each.accountId);

      const proposals = letters.filter((letter) => letter.level === 2);
      const handled = proposals.filter((letter) => letter.handledAt !== null);
      expect(proposals).toHaveLength(2);
      expect(handled).toHaveLength(1);
      for (const letter of handled) {
        expect(heads).toContain(letter.handledBy);
        const ofIt = lines.filter(
          (line) => line.letterId === letter.id && line.action === "handled",
        );
        expect(ofIt.map((line) => [line.changedBy, line.changedAt])).toEqual([
          [letter.handledBy, letter.handledAt],
        ]);
      }
    });
  });

  it("log the entry of every violation that led to them", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const kept = await db.select().from(dormViolations);
      const lines = await db.select().from(dormViolationChanges);

      const entered = lines.filter((line) => line.action === "entered");
      expect(entered).toHaveLength(kept.length);
    });
  });

  it("mark two reductions by the sample Pengelola Asrama, each with its reason and a line in the log", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const kept = await db.select().from(dormViolations);
      const lines = await db.select().from(dormViolationChanges);
      const roles = await db.select().from(accountRoles);
      const managers = roles
        .filter((each) => each.role === "dorm_manager")
        .map((each) => each.accountId);

      const reduced = kept.filter((violation) => violation.reducedAt !== null);
      expect(reduced).toHaveLength(2);
      for (const violation of reduced) {
        expect(managers).toContain(violation.reducedBy);
        const ofIt = lines.filter(
          (line) =>
            line.violationId === violation.id && line.action === "reduced",
        );
        expect(
          ofIt.map((line) => [line.changedAt, line.reductionReason]),
        ).toEqual([[violation.reducedAt, violation.reductionReason]]);
      }
    });
  });
});
