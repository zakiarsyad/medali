// Sample Tahun akademik of this file: 2903 to 2903.
// Sample NIMs of this file: 9964000300 to 9964000399.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { SentEntry } from "./entry-input";
import { saveSikuEntry } from "./save-entry";
import {
  ENTRY_ALREADY_SENT,
  NO_PERIOD,
  NOT_ACTIVE_STUDENTS,
  NOT_ALLOWED_TO_ADJUST,
} from "./siku-messages";
import { readTotalsOf } from "./siku-totals";
import { addTestActor, addTestStudents, addTestYear } from "./test-siku";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2903, in the odd period of 2903.
const MOMENT = new Date("2903-10-12T03:00:00Z");

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2903);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Simpan SIKU",
    2903,
    ["9964000301", "9964000302", "9964000303"],
  );
  const [ani, budi, citra] = studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Simpan", ["assessor"]);
  return { periods, ani, budi, citra, penilai };
}

function sentFor(studentIds: string[], more: Partial<SentEntry> = {}) {
  return {
    kind: "loss",
    reason: "unannounced_absence",
    points: "3",
    day: "2903-10-11",
    note: "Tidak hadir apel",
    basis: "",
    studentIds,
    ...more,
  };
}

function entryById(db: Database, id: string) {
  return db.select().from(sikuAdjustments).where(eq(sikuAdjustments.id, id));
}

describe("saveSikuEntry", () => {
  it("keeps a loss for every chosen student, with the period it was made in, who and as which role, and one log line", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const saved = await saveSikuEntry(
        db,
        penilai,
        id,
        sentFor([ani, budi]),
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { kind: "loss", points: 3, students: 2 },
      });
      const [entry] = await entryById(db, id);
      expect(entry).toMatchObject({
        kind: "loss",
        reason: "unannounced_absence",
        points: 3,
        day: "2903-10-11",
        note: "Tidak hadir apel",
        periodId: periods.odd,
        enteredBy: penilai.id,
        enteredAs: "assessor",
        cancelledAt: null,
      });
      const named = await db
        .select({ studentId: sikuAdjustmentStudents.studentId })
        .from(sikuAdjustmentStudents)
        .where(eq(sikuAdjustmentStudents.adjustmentId, id));
      expect(named.map((row) => row.studentId).sort()).toEqual(
        [ani, budi].sort(),
      );
      const lines = await db
        .select()
        .from(sikuAdjustmentChanges)
        .where(eq(sikuAdjustmentChanges.adjustmentId, id));
      expect(lines).toMatchObject([
        { changedBy: penilai.id, action: "entered" },
      ]);
      const totals = await readTotalsOf(db, [ani, budi]);
      expect(totals.get(ani)).toEqual({ gains: 0, losses: 3 });
    });
  });

  it("records the period of the day it is saved, also for a Tanggal in the period before", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      // 10:00 on campus on 2 March 2904, in the even period of 2903.
      const inEven = new Date("2904-03-02T03:00:00Z");

      await saveSikuEntry(db, penilai, id, sentFor([ani]), inEven);

      const [entry] = await entryById(db, id);
      expect(entry?.periodId).toBe(periods.even);
      expect(entry?.day).toBe("2903-10-11");
    });
  });

  it("keeps Kepala Unit as the role of an entry they make", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Simpan", [
        "head_of_unit",
      ]);
      const id = crypto.randomUUID();

      await saveSikuEntry(db, kepala, id, sentFor([ani]), MOMENT);

      const [entry] = await entryById(db, id);
      expect(entry?.enteredAs).toBe("head_of_unit");
    });
  });

  it.each<RoleId>(["mentor", "director", "head_of_program", "student"])(
    "refuses %s, who may not enter SIKU, with nothing kept",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { ani } = await addRecords(db);
        const other = await addTestActor(db, `Akun Uji Simpan ${role}`, [role]);
        const id = crypto.randomUUID();

        const saved = await saveSikuEntry(
          db,
          other,
          id,
          sentFor([ani]),
          MOMENT,
        );

        expect(saved).toEqual(NOT_ALLOWED_TO_ADJUST);
        expect(await entryById(db, id)).toEqual([]);
      });
    },
  );

  it("keeps an entry sent twice once, and answers the second the same", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);
      const id = crypto.randomUUID();

      const first = await saveSikuEntry(
        db,
        penilai,
        id,
        sentFor([ani]),
        MOMENT,
      );
      const second = await saveSikuEntry(
        db,
        penilai,
        id,
        sentFor([ani]),
        MOMENT,
      );

      expect(second).toEqual(first);
      expect(await entryById(db, id)).toHaveLength(1);
      expect((await readTotalsOf(db, [ani])).get(ani)?.losses).toBe(3);
    });
  });

  it("refuses a form sent again after it was changed, keeping the first", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, penilai } = await addRecords(db);
      const id = crypto.randomUUID();
      await saveSikuEntry(db, penilai, id, sentFor([ani]), MOMENT);

      const changed = await saveSikuEntry(
        db,
        penilai,
        id,
        sentFor([ani, budi]),
        MOMENT,
      );

      expect(changed).toEqual(ENTRY_ALREADY_SENT);
      expect((await readTotalsOf(db, [budi])).get(budi)?.losses).toBe(0);
    });
  });

  it("refuses a student who is not Aktif, with nothing kept", async () => {
    await inTestDatabase(async (db) => {
      const { ani, citra, penilai } = await addRecords(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, citra));
      const id = crypto.randomUUID();

      const saved = await saveSikuEntry(
        db,
        penilai,
        id,
        sentFor([ani, citra]),
        MOMENT,
      );

      expect(saved).toEqual(NOT_ACTIVE_STUDENTS);
      expect(await entryById(db, id)).toEqual([]);
    });
  });

  it("refuses while no period runs, and a key that is not one", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);
      const beforeEvery = new Date("2903-07-01T03:00:00Z");

      expect(
        await saveSikuEntry(
          db,
          penilai,
          crypto.randomUUID(),
          sentFor([ani], { day: "2903-06-30" }),
          beforeEvery,
        ),
      ).toEqual(NO_PERIOD);
      expect(
        await saveSikuEntry(db, penilai, "bukan-kunci", sentFor([ani]), MOMENT),
      ).toEqual(ENTRY_ALREADY_SENT);
    });
  });

  it("refuses what the form rules refuse, such as points outside 1 to 30", async () => {
    await inTestDatabase(async (db) => {
      const { ani, penilai } = await addRecords(db);

      expect(
        await saveSikuEntry(
          db,
          penilai,
          crypto.randomUUID(),
          sentFor([ani], { points: "31" }),
          MOMENT,
        ),
      ).toEqual({ ok: false, error: "Poin 1–30." });
    });
  });
});
