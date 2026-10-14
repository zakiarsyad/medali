// Sample Tahun akademik of this file: 2905 to 2905.
// Sample NIMs of this file: 9964000600 to 9964000699.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { sikuAdjustmentChanges, sikuAdjustments } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelSikuEntry } from "./cancel-entry";
import {
  ALREADY_CANCELLED,
  ENTRY_NOT_FOUND,
  NOT_ALLOWED_TO_ADJUST,
} from "./siku-messages";
import { readTotalsOf } from "./siku-totals";
import {
  addTestActor,
  addTestEntry,
  addTestStudents,
  addTestYear,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2905);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Batal SIKU",
    2905,
    ["9964000601", "9964000602"],
  );
  const penilai = await addTestActor(db, "Penilai Uji Batal", ["assessor"]);
  const id = await addTestEntry(db, penilai, {
    kind: "loss",
    reason: "discipline_penalty",
    points: 5,
    day: "2905-10-12",
    periodId: periods.odd,
    studentIds,
  });
  return { id, studentIds, penilai };
}

function entryById(db: Database, id: string) {
  return db.select().from(sikuAdjustments).where(eq(sikuAdjustments.id, id));
}

describe("cancelSikuEntry", () => {
  it("takes the entry out of every SIKU, marks it with who and when, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const { id, studentIds } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Batal", [
        "head_of_unit",
      ]);

      const cancelled = await cancelSikuEntry(db, kepala, id);

      expect(cancelled).toEqual({ ok: true, value: null });
      const [entry] = await entryById(db, id);
      expect(entry?.cancelledBy).toBe(kepala.id);
      expect(entry?.cancelledAt).toBeInstanceOf(Date);
      const totals = await readTotalsOf(db, studentIds);
      for (const studentId of studentIds) {
        expect(totals.get(studentId)).toEqual({ gains: 0, losses: 0 });
      }
      const lines = await db
        .select()
        .from(sikuAdjustmentChanges)
        .where(eq(sikuAdjustmentChanges.adjustmentId, id));
      expect(lines).toMatchObject([
        { changedBy: kepala.id, action: "cancelled" },
      ]);
    });
  });

  it("refuses an entry cancelled before, adding no log line", async () => {
    await inTestDatabase(async (db) => {
      const { id, penilai } = await addRecords(db);
      await cancelSikuEntry(db, penilai, id);

      const again = await cancelSikuEntry(db, penilai, id);

      expect(again).toEqual(ALREADY_CANCELLED);
      const lines = await db
        .select()
        .from(sikuAdjustmentChanges)
        .where(eq(sikuAdjustmentChanges.adjustmentId, id));
      expect(lines).toHaveLength(1);
    });
  });

  it.each<RoleId>(["mentor", "director", "head_of_program", "student"])(
    "refuses %s, who may not cancel SIKU entries, keeping the entry",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { id } = await addRecords(db);
        const other = await addTestActor(db, `Akun Uji Batal ${role}`, [role]);

        expect(await cancelSikuEntry(db, other, id)).toEqual(
          NOT_ALLOWED_TO_ADJUST,
        );
        const [entry] = await entryById(db, id);
        expect(entry?.cancelledAt).toBeNull();
      });
    },
  );

  it("refuses an entry that is not there, and a key that is not one", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);

      expect(await cancelSikuEntry(db, penilai, crypto.randomUUID())).toEqual(
        ENTRY_NOT_FOUND,
      );
      expect(await cancelSikuEntry(db, penilai, "bukan-kunci")).toEqual(
        ENTRY_NOT_FOUND,
      );
    });
  });
});
