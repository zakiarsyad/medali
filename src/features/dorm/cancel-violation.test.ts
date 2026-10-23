// Sample Tahun akademik of this file: 3154 to 3154.
// Sample NIMs of this file: 9982050000 to 9982050099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { cancelViolation } from "./cancel-violation";
import { OWN_RECORD } from "./own-record";
import { saveViolations } from "./save-violations";
import {
  addViolationActor,
  addViolationSetting,
  linesOf,
  sentList,
  sentRow,
  violationsUnder,
} from "./test-violations";
import {
  ALREADY_ANNOUNCED,
  ALREADY_CANCELLED,
  NOT_ALLOWED_TO_RECORD,
  VIOLATION_NOT_FOUND,
} from "./violation-messages";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 3154.
const MOMENT = new Date("3154-10-12T03:00:00Z");
// 21:00 on campus that day, when the list below is announced.
const ANNOUNCED = new Date("3154-10-12T14:00:00Z");

/** One violation waiting for 21:00, recorded by BAM - BPHK. */
async function waiting(db: Database) {
  const setting = await addViolationSetting(
    db,
    3154,
    "Prodi Uji Batal Pelanggaran",
    ["9982050001", "9982050002", "9982050003", "9982050004", "9982050005"],
  );
  const recorder = await addViolationActor(db, "BAM Uji Catat", ["bam_bphk"]);
  const key = crypto.randomUUID();
  const studentId = setting.residents[0] ?? "";
  const list = sentList("3154-10-12", [sentRow(studentId)]);
  const saved = await saveViolations(db, recorder, key, list, MOMENT);
  if (!saved.ok) throw new Error(saved.error);
  const [violation] = await violationsUnder(db, key);
  if (!violation) throw new Error("The violation was not kept.");
  return {
    id: violation.id,
    key,
    recorder,
    studentId,
    otherStudentId: setting.residents[1] ?? "",
  };
}

describe("cancelViolation", () => {
  it("marks a waiting violation cancelled by another BAM member, never erased, with a line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { id, key, recorder } = await waiting(db);
      const other = await addViolationActor(db, "BAM Uji Batal", [
        "bam_health",
      ]);

      expect(await cancelViolation(db, other, id, MOMENT)).toEqual({
        ok: true,
        value: null,
      });
      const [kept] = await violationsUnder(db, key);
      expect(kept?.cancelledBy).toBe(other.id);
      expect(kept?.cancelledAt).toEqual(MOMENT);
      const lines = await linesOf(db, id);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["entered", recorder.id],
        ["cancelled", other.id],
      ]);
    });
  });

  it("still cancels a moment before the announcement hour, and refuses from that hour on", async () => {
    await inTestDatabase(async (db) => {
      const first = await waiting(db);
      const justBefore = new Date(ANNOUNCED.getTime() - 1);

      expect(
        await cancelViolation(db, first.recorder, first.id, ANNOUNCED),
      ).toEqual(ALREADY_ANNOUNCED);
      expect((await violationsUnder(db, first.key))[0]?.cancelledAt).toBeNull();
      expect(await linesOf(db, first.id)).toHaveLength(1);
      expect(
        await cancelViolation(db, first.recorder, first.id, justBefore),
      ).toEqual({ ok: true, value: null });
    });
  });

  it.each(["bam_spiritual", "bam_bphk"] as const)(
    "refuses a resident who is also %s their own violation, also with its key in capitals, and keeps it waiting",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { id, key, studentId } = await waiting(db);
        const own = await addViolationActor(
          db,
          "Penghuni BAM Uji Batal",
          ["student", role],
          studentId,
        );

        for (const sent of [id, id.toUpperCase()]) {
          expect(await cancelViolation(db, own, sent, MOMENT)).toEqual(
            OWN_RECORD,
          );
        }
        expect((await violationsUnder(db, key))[0]?.cancelledAt).toBeNull();
        expect(await linesOf(db, id)).toHaveLength(1);
      });
    },
  );

  it("lets a resident who is BAM cancel the violation of another resident", async () => {
    await inTestDatabase(async (db) => {
      const { id, otherStudentId } = await waiting(db);
      const resident = await addViolationActor(
        db,
        "Penghuni BAM Uji Batal Lain",
        ["student", "bam_spiritual"],
        otherStudentId,
      );

      expect(await cancelViolation(db, resident, id, MOMENT)).toEqual({
        ok: true,
        value: null,
      });
    });
  });

  it("refuses a second cancel, and a violation that is not there", async () => {
    await inTestDatabase(async (db) => {
      const { id, recorder } = await waiting(db);
      await cancelViolation(db, recorder, id, MOMENT);

      expect(await cancelViolation(db, recorder, id, MOMENT)).toEqual(
        ALREADY_CANCELLED,
      );
      expect(
        await cancelViolation(db, recorder, crypto.randomUUID(), MOMENT),
      ).toEqual(VIOLATION_NOT_FOUND);
      expect(await cancelViolation(db, recorder, "x", MOMENT)).toEqual(
        VIOLATION_NOT_FOUND,
      );
      expect(await linesOf(db, id)).toHaveLength(2);
    });
  });

  it.each([
    "dorm_manager",
    "head_of_unit",
    "bam_household",
    "student",
  ] as const)("refuses a hand-made cancel of %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { id, key } = await waiting(db);
      const actor = await addViolationActor(db, "Bukan BAM Uji", [role]);

      expect(await cancelViolation(db, actor, id, MOMENT)).toEqual(
        NOT_ALLOWED_TO_RECORD,
      );
      expect((await violationsUnder(db, key))[0]?.cancelledAt).toBeNull();
    });
  });
});
