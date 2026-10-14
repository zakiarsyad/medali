// Sample NIMs of this file: 9937880000 to 9937880099.
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  dormLeaves,
  dormReturnReports,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  accountId: string;
  leaveId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Lapor Kembali" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Lapor Kembali", code: "UJILAPORKB" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9937880001",
      name: "Penghuni Uji Tabel Lapor",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  const leaveId = crypto.randomUUID();
  await db.insert(dormLeaves).values({
    id: leaveId,
    studentId: student.id,
    kind: "outing",
    startsAt: new Date("2026-10-20T02:00:00Z"),
    endsAt: new Date("2026-10-20T08:00:00Z"),
    purpose: "Membeli buku",
    destination: "Bintaro",
    contact: "0812",
    sentAt: new Date("2026-10-19T02:00:00Z"),
    status: "approved",
    decidedBy: account.id,
    decidedAt: new Date("2026-10-19T03:00:00Z"),
  });
  return { accountId: account.id, leaveId };
}

type ReportRow = typeof dormReturnReports.$inferInsert;

function addReport(db: Database, of: Records, more: Partial<ReportRow> = {}) {
  return db.insert(dormReturnReports).values({
    id: crypto.randomUUID(),
    leaveId: of.leaveId,
    sentAt: new Date("2026-10-20T07:50:00Z"),
    ...more,
  });
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

describe("the table of reports of a return from dorm leave", () => {
  it("keeps a report that waits for BAM, with no decision", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await addReport(db, records);

      const [kept] = await db.select().from(dormReturnReports);
      expect(kept?.status).toBe("waiting");
      expect(kept?.verifyNote).toBe("");
      expect(kept?.photoKey).toBeNull();
    });
  });

  it.each<[string, (records: Records) => Partial<ReportRow>]>([
    ["a verification without who verified", () => ({ status: "verified" })],
    [
      "a report that waits with a verification",
      (records) => ({ verifiedBy: records.accountId, verifiedAt: new Date() }),
    ],
    [
      "a validation without who validated",
      (records) => ({
        status: "validated",
        verifiedBy: records.accountId,
        verifiedAt: new Date(),
      }),
    ],
    [
      "a validation of a report that only BAM verified",
      (records) => ({
        status: "verified",
        verifiedBy: records.accountId,
        verifiedAt: new Date(),
        validatedBy: records.accountId,
        validatedAt: new Date(),
      }),
    ],
    [
      "a rejection without a note",
      (records) => ({
        status: "rejected",
        verifiedBy: records.accountId,
        verifiedAt: new Date(),
      }),
    ],
    [
      "a note longer than 500 letters",
      (records) => ({
        status: "verified",
        verifiedBy: records.accountId,
        verifiedAt: new Date(),
        verifyNote: "a".repeat(501),
      }),
    ],
  ])("refuses %s", async (_name, more) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) => addReport(tx, records, more(records))),
      ).rejects.toThrow();
    });
  });

  it("keeps one report of a leave that is not rejected, and any number that are", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const rejected = {
        status: "rejected",
        verifiedBy: records.accountId,
        verifiedAt: new Date(),
        verifyNote: "Foto tidak menunjukkan asrama.",
      } as const;

      await addReport(db, records, rejected);
      await addReport(db, records, rejected);
      await addReport(db, records);

      await expect(
        inOwnStep(db, (tx) => addReport(tx, records)),
      ).rejects.toThrow();
      expect(await db.select().from(dormReturnReports)).toHaveLength(3);
    });
  });

  it("keeps a validated report with both decisions", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await addReport(db, records, {
        status: "validated",
        verifiedBy: records.accountId,
        verifiedAt: new Date(),
        validatedBy: records.accountId,
        validatedAt: new Date(),
      });

      const [kept] = await db.select().from(dormReturnReports);
      expect(kept?.status).toBe("validated");
    });
  });
});
