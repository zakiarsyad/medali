// Sample Tahun akademik of this file: 3292 to 3292.
// Sample NIMs of this file: 9986102000 to 9986102099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { scheduleWarningCall } from "./schedule-call";
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
import { SCHEDULE_IN_PAST, SCHEDULE_INCOMPLETE } from "./warning-input";
import {
  CALL_CHANGED,
  CALL_MOVED,
  CALL_SENT,
  NOT_CALLED,
  OWN_CALL,
  WARNING_NOT_ALLOWED,
} from "./warning-messages";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3292.
const NOW = new Date("3292-10-20T03:00:00Z");
const LATER = new Date("3292-10-20T05:00:00Z");

const CALL = {
  day: "3292-10-21",
  time: "16:00",
  place: "Kantor Pengelola Asrama",
};

/** Ani is called for SP 1 by 7 violations; Bea is not called. */
async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3292, "Prodi Uji Jadwal SP", [
    "9986102001",
    "9986102002",
    "9986102003",
    "9986102004",
    "9986102005",
  ]);
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Jadwal", ["bam_bphk"]);
  const manager = await addViolationActor(db, "Pengelola Uji Jadwal", [
    "dorm_manager",
  ]);
  await addTestViolations(db, ani, bam.id, 7, "3292-10-01");
  const periodId = await periodIdOf(db, 3292);
  return { ani, bea, cici, bam, manager, periodId };
}

function send(
  db: Database,
  actor: Parameters<typeof scheduleWarningCall>[1],
  studentId: string,
  more: Record<string, unknown> = {},
  at = NOW,
) {
  return scheduleWarningCall(
    db,
    actor,
    { studentId, level: 1, ...CALL, ...more },
    at,
  );
}

describe("scheduleWarningCall", () => {
  it("saves the call of a resident called for SP 1 with a line in the log, and shows it on the list", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await setUp(db);

      expect(await send(db, manager, ani)).toEqual({
        ok: true,
        value: CALL_SENT,
      });

      const [letter] = await lettersOf(db, ani);
      expect(letter).toMatchObject({
        level: 1,
        callDay: CALL.day,
        callPlace: CALL.place,
        issuedAt: null,
      });
      const lines = await letterLinesOf(db, letter?.id ?? "");
      expect(lines).toMatchObject([
        {
          changedBy: manager.id,
          action: "scheduled",
          callDay: CALL.day,
          callPlace: CALL.place,
        },
      ]);
      const [call] = (await readWarningCalls(db, eq(students.id, ani), NOW, 1))
        .calls;
      expect(call?.schedule).toEqual(CALL);
    });
  });

  it("changes the call with a second line in the log, keeping one call", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await setUp(db);
      await send(db, manager, ani);

      expect(
        await send(
          db,
          manager,
          ani,
          { day: "3292-10-22", place: "Aula" },
          LATER,
        ),
      ).toEqual({ ok: true, value: CALL_MOVED });

      const letters = await lettersOf(db, ani);
      expect(letters).toHaveLength(1);
      expect(letters[0]).toMatchObject({
        callDay: "3292-10-22",
        callPlace: "Aula",
      });
      const lines = await letterLinesOf(db, letters[0]?.id ?? "");
      expect(lines.map((line) => line.callDay)).toEqual([
        CALL.day,
        "3292-10-22",
      ]);
    });
  });

  it("refuses an empty field or a past date, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager } = await setUp(db);

      expect(await send(db, manager, ani, { place: "" })).toEqual({
        ok: false,
        error: SCHEDULE_INCOMPLETE,
      });
      expect(await send(db, manager, ani, { day: "3292-10-19" })).toEqual({
        ok: false,
        error: SCHEDULE_IN_PAST,
      });
      expect(await lettersOf(db, ani)).toEqual([]);
    });
  });

  it("refuses a hand-made schedule of any role but Pengelola Asrama", async () => {
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
        expect(await send(db, actor, ani)).toEqual(WARNING_NOT_ALLOWED);
      }
      expect(await lettersOf(db, ani)).toEqual([]);
    });
  });

  it("refuses a resident not called, an unknown key, and an SP the resident is not called for", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, manager } = await setUp(db);

      expect(await send(db, manager, bea)).toEqual(NOT_CALLED);
      expect(await send(db, manager, "not-a-key")).toEqual(NOT_CALLED);
      expect(await send(db, manager, ani, { level: 2 })).toEqual(CALL_CHANGED);
      expect(await send(db, manager, ani, { level: "1" })).toEqual(
        CALL_CHANGED,
      );
    });
  });

  it("refuses to change the call of an SP already issued", async () => {
    await inTestDatabase(async (db) => {
      const { cici, bam, manager, periodId } = await setUp(db);
      await addTestRejection(db, cici, bam.id, "3292-10-05");
      await addTestLetter(db, {
        studentId: cici,
        periodId,
        level: 1,
        ...issuedBy(manager.id),
      });
      await addTestRejection(db, cici, bam.id, "3292-10-06");

      // Called for SP 2 now: a form still showing SP 1 is out of date.
      expect(await send(db, manager, cici)).toEqual(CALL_CHANGED);
      expect(await send(db, manager, cici, { level: 2 })).toEqual({
        ok: true,
        value: CALL_SENT,
      });
    });
  });

  it("refuses the call of a Pengelola Asrama who is the resident", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);
      const self = await addViolationActor(
        db,
        "Pengelola Penghuni",
        ["dorm_manager", "student"],
        ani,
      );

      expect(await send(db, self, ani)).toEqual(OWN_CALL);
    });
  });

  it("calls for nothing more once the SP is issued, so its call cannot be changed", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, periodId } = await setUp(db);
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 1,
        ...issuedBy(manager.id),
      });

      expect(await send(db, manager, ani)).toEqual(NOT_CALLED);
    });
  });
});
