// Sample NIMs of this file: 9937810000 to 9937810099.
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { accounts, dormLeaves, students, studyPrograms } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  accountId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Izin Asrama" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Izin Asrama", code: "UJIIZINASR" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9937810001",
      name: "Penghuni Uji Tabel Izin",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return { accountId: account.id, studentId: student.id };
}

type LeaveRow = typeof dormLeaves.$inferInsert;

function addLeave(db: Database, of: Records, more: Partial<LeaveRow> = {}) {
  return db.insert(dormLeaves).values({
    id: crypto.randomUUID(),
    studentId: of.studentId,
    kind: "outing",
    startsAt: new Date("2026-10-20T02:00:00Z"),
    endsAt: new Date("2026-10-20T08:00:00Z"),
    purpose: "Membeli buku",
    destination: "Bintaro",
    contact: "0812",
    sentAt: new Date("2026-10-19T02:00:00Z"),
    ...more,
  });
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

describe("the table of dorm leave requests", () => {
  it("keeps a request that waits, with no decision and no note", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await addLeave(db, records);

      const [kept] = await db.select().from(dormLeaves);
      expect(kept?.status).toBe("submitted");
      expect(kept?.decisionNote).toBe("");
    });
  });

  it.each<[string, (records: Records) => Partial<LeaveRow>]>([
    [
      "an end that is not after the start",
      () => ({ endsAt: new Date("2026-10-20T02:00:00Z") }),
    ],
    ["Keperluan of fewer than 5 letters", () => ({ purpose: "Beli" })],
    ["Jenis keperluan on Izin pesiar", () => ({ specialReason: "sick" })],
    ["Izin khusus without Jenis keperluan", () => ({ kind: "special" })],
    ["Tujuan on ITMK", () => ({ kind: "skip_activities", contact: "" })],
    ["an approval without who decided", () => ({ status: "approved" })],
    [
      "a rejection without a note",
      (records) => ({
        status: "rejected",
        decidedBy: records.accountId,
        decidedAt: new Date(),
      }),
    ],
    ["a cancellation without when", () => ({ status: "cancelled" })],
    [
      "a decision on a request that waits",
      (records) => ({ decidedBy: records.accountId, decidedAt: new Date() }),
    ],
  ])("refuses %s", async (_name, more) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) => addLeave(tx, records, more(records))),
      ).rejects.toThrow();
    });
  });

  it("keeps a rejection with its note, and a cancellation with when", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await addLeave(db, records, {
        status: "rejected",
        decidedBy: records.accountId,
        decidedAt: new Date(),
        decisionNote: "Bertepatan dengan kerja bakti.",
      });
      await addLeave(db, records, {
        status: "cancelled",
        cancelledAt: new Date(),
      });

      expect(await db.select().from(dormLeaves)).toHaveLength(2);
    });
  });
});
