// Sample Tahun akademik of this file: 3050 to 3050.
// Sample NIMs of this file: 9937980600 to 9937980699.
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import {
  CLARIFICATION_NOT_FOUND,
  DECIDE_NOT_ALLOWED,
  DECIDED_FIRST,
  REJECTION_NEEDS_NOTE,
  STILL_WAITS_FOR_BAM,
  UNKNOWN_DECISION,
  VERIFY_NOT_ALLOWED,
} from "./clarification-decision";
import { readDayAttendance } from "./day-attendance";
import { decideDormClarification } from "./decide-clarification";
import { OWN_RECORD } from "./own-record";
import { readOwnAttendance } from "./resident-attendance";
import { addTestActivity } from "./test-activities";
import {
  addTestClarification,
  addTestCount,
  changesOf,
  clarificationById,
} from "./test-clarifications";
import { addTestResidents } from "./test-leave";
import { addTestActor, EVERYONE, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const DAY = "3050-10-13";
/** 23:00 on campus on the day after: the counted activities are over. */
const NEXT_NIGHT = new Date("3050-10-14T16:00:00Z");

/** A resident absent at the Apel pagi of the day, with a clarification that waits for BAM. */
async function addRecords(db: Database) {
  const [ani] = await addTestResidents(db, 3050, "Prodi Uji Putus Klar", [
    "9937980601",
  ]);
  if (!ani) throw new Error("The resident was not added.");
  const bam = await addTestActor(db, "BAM Uji Putus Klar", ["bam_bphk"]);
  const ki = await addTestActor(db, "BAM KI Uji Putus Klar", [
    "bam_compliance",
  ]);
  const manager = await addTestActor(db, "Pengelola Uji Putus Klar", [
    "dorm_manager",
  ]);
  const head = await addTestActor(db, "Kepala Uji Putus Klar", [
    "head_of_unit",
  ]);
  const activityId = await addTestActivity(db, bam.id, {
    versions: [{ startsOn: "3050-10-01" }],
  });
  const countId = await addTestCount(db, {
    activityId,
    day: DAY,
    byId: bam.id,
    marks: { [ani.studentId]: { isAbsent: true, note: "" } },
  });
  const id = await addTestClarification(db, bam.id, {
    countId,
    studentId: ani.studentId,
  });
  return { ani, bam, ki, manager, head, activityId, countId, id };
}

type Actor = Pick<TestActor, "id" | "roles" | "studentId">;

function verify(
  db: Database,
  actor: Actor,
  id: string,
  kind: string,
  note = "",
) {
  return decideDormClarification(db, actor, "verify", { id, kind, note });
}

function decide(
  db: Database,
  actor: Actor,
  id: string,
  kind: string,
  note = "",
) {
  return decideDormClarification(db, actor, "decide", { id, kind, note });
}

describe("the check of BAM", () => {
  it.each(["bam", "ki"] as const)(
    "passes one that waits on to Pengelola Asrama, by BAM - %s, with who, when and the note, and its log line",
    async (who) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const actor = records[who];

        expect(
          await verify(db, actor, records.id, "pass", " Dikonfirmasi. "),
        ).toEqual({ ok: true, value: "verified" });

        const kept = await clarificationById(db, records.id);
        expect(kept).toMatchObject({
          status: "verified",
          verifiedBy: actor.id,
          verifyNote: "Dikonfirmasi.",
          decidedAt: null,
        });
        const [line] = await changesOf(db, records.id);
        expect(line).toMatchObject({
          changedBy: actor.id,
          changedAt: kept?.verifiedAt,
          statusBefore: "submitted",
          statusAfter: "verified",
          note: "Dikonfirmasi.",
        });
      });
    },
  );

  it.each([
    ["bam_bphk", "pass"],
    ["bam_compliance", "reject"],
  ] as const)(
    "refuses a resident who is also %s their own clarification, %s also with its key in capitals, and keeps it waiting",
    async (role, kind) => {
      await inTestDatabase(async (db) => {
        const { ani, id } = await addRecords(db);
        const own = await addTestActor(
          db,
          "Ani BAM Uji Putus Klar",
          ["student", role],
          ani.studentId,
        );

        for (const key of [id, id.toUpperCase()]) {
          expect(await verify(db, own, key, kind, "Catatan uji.")).toEqual(
            OWN_RECORD,
          );
        }
        expect(await clarificationById(db, id)).toMatchObject({
          status: "submitted",
          verifiedBy: null,
        });
        expect(await changesOf(db, id)).toEqual([]);
      });
    },
  );

  it("lets a resident who is BAM check the clarification of another resident", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addRecords(db);
      const programId = await addTestProgram(db, "Prodi Uji Putus Klar Bea");
      const bea = await addTestStudent(db, programId, {
        nim: "9937980602",
        name: "Bea Uji Putus Klar",
        cohortYear: 3050,
      });
      const beaBam = await addTestActor(
        db,
        "Bea BAM Uji Putus Klar",
        ["student", "bam_bphk"],
        bea,
      );

      expect(await verify(db, beaBam, id, "pass")).toEqual({
        ok: true,
        value: "verified",
      });
    });
  });

  it("rejects only with a note, and then it does not go to Pengelola Asrama", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, id } = await addRecords(db);

      expect(await verify(db, bam, id, "reject", " ")).toEqual(
        REJECTION_NEEDS_NOTE,
      );
      expect(await verify(db, bam, id, "reject", "Tidak ada surat.")).toEqual({
        ok: true,
        value: "rejected",
      });
      expect(await decide(db, manager, id, "present")).toEqual(DECIDED_FIRST);
      expect(await clarificationById(db, id)).toMatchObject({
        status: "rejected",
        verifyNote: "Tidak ada surat.",
        decidedAt: null,
      });
    });
  });

  it.each([
    ["Pengelola Asrama", "manager"],
    ["Kepala Unit", "head"],
  ] as const)("is refused to %s, also sent by hand", async (_who, key) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      expect(await verify(db, records[key], records.id, "pass")).toEqual(
        VERIFY_NOT_ALLOWED,
      );
      expect(await clarificationById(db, records.id)).toMatchObject({
        status: "submitted",
      });
    });
  });

  it("refuses a decision of Pengelola at the check, and an unknown clarification", async () => {
    await inTestDatabase(async (db) => {
      const { bam, id } = await addRecords(db);

      expect(await verify(db, bam, id, "present")).toEqual(UNKNOWN_DECISION);
      expect(await verify(db, bam, "bukan-kunci", "pass")).toEqual(
        CLARIFICATION_NOT_FOUND,
      );
      expect(
        await verify(db, bam, "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "pass"),
      ).toEqual(CLARIFICATION_NOT_FOUND);
    });
  });

  it("refuses a second check of one already checked", async () => {
    await inTestDatabase(async (db) => {
      const { bam, ki, id } = await addRecords(db);
      await verify(db, bam, id, "pass");

      expect(await verify(db, ki, id, "reject", "Tidak sah.")).toEqual(
        DECIDED_FIRST,
      );
    });
  });
});

describe("the decision of Pengelola Asrama", () => {
  it("says one that still waits for BAM waits, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const { manager, id } = await addRecords(db);

      expect(await decide(db, manager, id, "present")).toEqual(
        STILL_WAITS_FOR_BAM,
      );
      expect(await clarificationById(db, id)).toMatchObject({
        status: "submitted",
      });
    });
  });

  it.each([
    ["BAM - BPHK", "bam"],
    ["BAM - KI", "ki"],
    ["Kepala Unit", "head"],
  ] as const)("is refused to %s, also sent by hand", async (_who, key) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await verify(db, records.bam, records.id, "pass");

      expect(await decide(db, records[key], records.id, "present")).toEqual(
        DECIDE_NOT_ALLOWED,
      );
      expect(await clarificationById(db, records.id)).toMatchObject({
        status: "verified",
      });
    });
  });

  it("rejects only with a note, which the resident reads with Ajukan ulang", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, ani, id } = await addRecords(db);
      await verify(db, bam, id, "pass");

      expect(await decide(db, manager, id, "reject", "")).toEqual(
        REJECTION_NEEDS_NOTE,
      );
      expect(
        await decide(db, manager, id, "reject", "Surat tidak sah."),
      ).toEqual({ ok: true, value: "rejected" });

      // Within the seven days of the activity.
      const own = await readOwnAttendance(
        db,
        ani,
        new Date("3050-10-15T03:00:00Z"),
      );
      if (own.kind !== "shown") throw new Error("It was refused.");
      const row = own.attendance.history.find((entry) => entry.day === DAY);
      expect(row?.status).toBe("absent");
      expect(row?.clarification).toMatchObject({
        badge: "rejected",
        note: "Surat tidak sah.",
        action: "ask_again",
      });
    });
  });

  it("accepts as present: the resident is Hadir in Riwayat, in Rincian and in both percentages", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, ani, id } = await addRecords(db);
      await verify(db, bam, id, "pass");

      expect(await decide(db, manager, id, "present", "Sesuai.")).toEqual({
        ok: true,
        value: "accepted",
      });

      const kept = await clarificationById(db, id);
      expect(kept).toMatchObject({
        status: "accepted",
        acceptedAs: "present",
        decidedBy: manager.id,
        decisionNote: "Sesuai.",
      });
      const lines = await changesOf(db, id);
      expect(lines.at(-1)).toMatchObject({
        statusBefore: "verified",
        statusAfter: "accepted",
        acceptedAs: "present",
        changedBy: manager.id,
      });
      const own = await readOwnAttendance(db, ani, NEXT_NIGHT);
      if (own.kind !== "shown") throw new Error("It was refused.");
      expect(own.attendance.absent).toBe(0);
      const row = own.attendance.history.find((entry) => entry.day === DAY);
      expect(row).toMatchObject({
        status: "present",
        note: "Klarifikasi: Sakit",
      });
      expect(row?.clarification).toMatchObject({
        badge: "accepted",
        action: null,
      });
      const staff = await readDayAttendance(db, DAY, EVERYONE);
      const [counted] = Object.values(staff);
      expect(counted).toMatchObject({ present: 1, absent: 0 });
      expect(counted?.marked).toMatchObject([
        {
          studentId: ani.studentId,
          status: "present",
          note: "Klarifikasi: Sakit",
        },
      ]);
    });
  });

  it("accepts as leave: the resident is Izin, out of both percentages", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, ani, id } = await addRecords(db);
      await verify(db, bam, id, "pass");

      await decide(db, manager, id, "leave");

      const own = await readOwnAttendance(db, ani, NEXT_NIGHT);
      if (own.kind !== "shown") throw new Error("It was refused.");
      expect(own.attendance.present + own.attendance.absent).toBe(0);
      expect(
        own.attendance.history.find((entry) => entry.day === DAY)?.status,
      ).toBe("leave");
      const [counted] = Object.values(
        await readDayAttendance(db, DAY, EVERYONE),
      );
      expect(counted).toMatchObject({ present: 0, absent: 0 });
      expect(counted?.marked[0]?.status).toBe("leave");
    });
  });

  it("refuses a second decision of one already decided", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, id } = await addRecords(db);
      await verify(db, bam, id, "pass");
      await decide(db, manager, id, "present");

      expect(await decide(db, manager, id, "reject", "Salah.")).toEqual(
        DECIDED_FIRST,
      );
    });
  });

  it("marks the refusal of one decided first as out of date, so Tugas saya reads its list again", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager, id } = await addRecords(db);
      await verify(db, bam, id, "pass");
      await decide(db, manager, id, "leave");

      const late = await decide(db, manager, id, "present");

      expect(late).toMatchObject({ ok: false, stale: true });
      expect(await clarificationById(db, id)).toMatchObject({
        status: "accepted",
        acceptedAs: "leave",
      });
    });
  });

  it("is refused to every role but Pengelola Asrama, sent by hand as Tugas saya sends it", async () => {
    await inTestDatabase(async (db) => {
      const { bam, id } = await addRecords(db);
      await verify(db, bam, id, "pass");
      const others = ROLE_IDS.filter((role) => role !== "dorm_manager");

      for (const role of others) {
        const actor = await addTestActor(db, `Bukan Pengelola ${role}`, [role]);
        expect(await decide(db, actor, id, "present")).toEqual(
          DECIDE_NOT_ALLOWED,
        );
      }
      expect(await clarificationById(db, id)).toMatchObject({
        status: "verified",
      });
    });
  });
});
