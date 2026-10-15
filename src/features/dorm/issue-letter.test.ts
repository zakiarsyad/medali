// Sample Tahun akademik of this file: 3294 to 3294.
// Sample NIMs of this file: 9986104000 to 9986104099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { dormWarningLetters } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { issueWarningLetter } from "./issue-letter";
import { scheduleWarningCall } from "./schedule-call";
import { addTestClarification } from "./test-clarifications";
import { EVERYONE } from "./test-records";
import { addViolationActor, addViolationSetting } from "./test-violations";
import {
  addTestLetter,
  addTestRejection,
  addTestViolations,
  issuedBy,
  letterLinesOf,
  lettersOf,
  periodIdOf,
} from "./test-warnings";
import { readWarningCalls } from "./warning-calls";
import { RESULT_LENGTH } from "./warning-input";
import {
  CALL_CHANGED,
  NOT_CALLED,
  OWN_CALL,
  SP1_ISSUED,
  SP2_ISSUED,
  WARNING_NOT_ALLOWED,
} from "./warning-messages";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3294.
const NOW = new Date("3294-10-20T03:00:00Z");
const RESULT = "Mahasiswa hadir dan mengakui pelanggarannya.";
const NOTE = "Pelanggaran berulang setelah SP 1.";

/** Ani is called for SP 1 by 7 violations; Bea has SP 1 and is called for SP 2 by 12. */
async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3294, "Prodi Uji Terbit SP", [
    "9986104001",
    "9986104002",
    "9986104003",
    "9986104004",
    "9986104005",
  ]);
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Terbit", ["bam_bphk"]);
  const manager = await addViolationActor(db, "Pengelola Uji Terbit", [
    "dorm_manager",
  ]);
  const periodId = await periodIdOf(db, 3294);
  await addTestViolations(db, ani, bam.id, 7, "3294-10-01");
  await addTestLetter(db, {
    studentId: bea,
    periodId,
    level: 1,
    ...issuedBy(manager.id),
  });
  await addTestViolations(db, bea, bam.id, 12, "3294-09-01");
  return { ani, bea, cici, bam, manager, periodId };
}

function issue(
  db: Database,
  actor: Parameters<typeof issueWarningLetter>[1],
  studentId: string,
  level: unknown,
  more: Record<string, unknown> = {},
) {
  return issueWarningLetter(
    db,
    actor,
    { studentId, level, result: RESULT, proposalNote: "", ...more },
    NOW,
  );
}

async function calledIds(db: Database) {
  const calls = await readWarningCalls(db, EVERYONE, NOW, 1);
  return calls.calls.map((call) => call.studentId);
}

describe("issueWarningLetter", () => {
  it("issues SP 1 of a scheduled call with Hasil klarifikasi and a line in the log keeping the schedule, and the resident leaves the list with the mark SP 1", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await setUp(db);
      const call = { day: "3294-10-21", time: "16:00", place: "Aula" };
      await scheduleWarningCall(
        db,
        manager,
        { studentId: ani, level: 1, ...call },
        NOW,
      );

      expect(await issue(db, manager, ani, 1)).toEqual({
        ok: true,
        value: SP1_ISSUED,
      });

      const [letter] = await lettersOf(db, ani);
      expect(letter).toMatchObject({
        level: 1,
        result: RESULT,
        proposalNote: "",
        issuedBy: manager.id,
        issuedAt: NOW,
        callDay: call.day,
      });
      const lines = await letterLinesOf(db, letter?.id ?? "");
      expect(lines.map((line) => [line.action, line.callDay])).toEqual([
        ["scheduled", call.day],
        ["issued", call.day],
      ]);
      expect(await calledIds(db)).not.toContain(ani);
      const all = await readWarningCalls(db, EVERYONE, NOW, 1);
      expect(all.withLetter).toBe(2);
    });
  });

  it("issues SP 1 without a call, with an empty schedule in the log", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await setUp(db);

      expect(await issue(db, manager, ani, 1)).toEqual({
        ok: true,
        value: SP1_ISSUED,
      });

      const [letter] = await lettersOf(db, ani);
      expect(letter?.callDay).toBeNull();
      const lines = await letterLinesOf(db, letter?.id ?? "");
      expect(lines).toMatchObject([{ action: "issued", callDay: null }]);
    });
  });

  it("issues SP 2 with the proposal note for Kepala Unit", async () => {
    await inTestDatabase(async (db) => {
      const { bea, manager } = await setUp(db);

      expect(await issue(db, manager, bea, 2, { proposalNote: NOTE })).toEqual({
        ok: true,
        value: SP2_ISSUED,
      });

      const letters = await lettersOf(db, bea);
      expect(
        letters.map((letter) => [letter.level, letter.proposalNote]),
      ).toEqual([
        [1, ""],
        [2, NOTE],
      ]);
      expect(await calledIds(db)).not.toContain(bea);
    });
  });

  it("saves one SP when pressed twice: the second is told the resident is no longer called", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, manager } = await setUp(db);

      await issue(db, manager, ani, 1);
      expect(await issue(db, manager, ani, 1)).toEqual(NOT_CALLED);
      await issue(db, manager, bea, 2);
      expect(await issue(db, manager, bea, 2)).toEqual(NOT_CALLED);

      expect(await lettersOf(db, ani)).toHaveLength(1);
      expect(await lettersOf(db, bea)).toHaveLength(2);
    });
  });

  it("refuses short Hasil klarifikasi, and an SP the resident is not called for", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await setUp(db);

      expect(await issue(db, manager, ani, 1, { result: "Hadir." })).toEqual({
        ok: false,
        error: RESULT_LENGTH,
      });
      expect(await issue(db, manager, ani, 2)).toEqual(CALL_CHANGED);
      expect(await lettersOf(db, ani)).toEqual([]);
    });
  });

  it("refuses a hand-made SP of any role but Pengelola Asrama, and of Pengelola Asrama for themselves", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);
      const others: RoleId[] = [
        "head_of_unit",
        "bam_bphk",
        "bam_compliance",
        "director",
        "head_of_program",
        "student",
      ];
      for (const role of others) {
        const actor = await addViolationActor(db, `Uji ${role}`, [role]);
        expect(await issue(db, actor, ani, 1)).toEqual(WARNING_NOT_ALLOWED);
      }
      const self = await addViolationActor(
        db,
        "Pengelola Penghuni",
        ["dorm_manager", "student"],
        ani,
      );
      expect(await issue(db, self, ani, 1)).toEqual(OWN_CALL);
      expect(await lettersOf(db, ani)).toEqual([]);
    });
  });

  it("keeps an issued SP when its cause is later accepted, and the database keeps one SP of a level per semester", async () => {
    await inTestDatabase(async (db) => {
      const { cici, bam, manager, periodId } = await setUp(db);
      const rejection = await addTestRejection(db, cici, bam.id, "3294-10-05");
      await issue(db, manager, cici, 1);
      await addTestClarification(db, bam.id, {
        countId: rejection.countId,
        studentId: cici,
        status: "accepted",
        sentAt: new Date("3294-10-16T03:00:00Z"),
      });

      const [kept] = await lettersOf(db, cici);
      expect(kept).toMatchObject({ level: 1, result: RESULT });
      const calls = await readWarningCalls(db, EVERYONE, NOW, 1);
      expect(calls.calls.map((call) => call.studentId)).not.toContain(cici);
      expect(calls.withLetter).toBe(2);
      await expect(
        db.insert(dormWarningLetters).values({
          studentId: cici,
          periodId,
          level: 1,
          ...issuedBy(manager.id),
        }),
      ).rejects.toThrow();
    });
  });
});
