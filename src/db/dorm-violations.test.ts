// Sample Tahun akademik of this file: 3150 to 3150.
// Sample NIMs of this file: 9982010000 to 9982010099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  dormViolationAppeals,
  dormViolationChanges,
  dormViolations,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// 21:00 on campus on 12 October 3150, the day of the violations below.
const ANNOUNCED = new Date("3150-10-12T14:00:00Z");
const ENTERED = new Date("3150-10-12T12:00:00Z");

interface Records {
  accountId: string;
  studentId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Pelanggaran" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel Pelanggaran", code: "UJITABELPEL" })
    .returning();
  await db.insert(academicPeriods).values({
    startYear: 3150,
    term: "odd",
    startsOn: "3150-08-01",
    endsOn: "3151-01-31",
  });
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9982010001",
      name: "Mahasiswa Uji Tabel Pelanggaran",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 3150,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return { accountId: account.id, studentId: student.id };
}

function addViolation(
  db: Database,
  of: Records,
  more: Partial<typeof dormViolations.$inferInsert> = {},
) {
  return db
    .insert(dormViolations)
    .values({
      batchId: crypto.randomUUID(),
      studentId: of.studentId,
      dorm: "dana_rakca",
      day: "3150-10-12",
      reason: "Terlambat apel pagi",
      punishment: "warning",
      announcedAt: ANNOUNCED,
      enteredBy: of.accountId,
      enteredAt: ENTERED,
      ...more,
    })
    .returning();
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [violation] = await addViolation(db, records);
  if (!violation) throw new Error("The violation was not added.");
  const [line] = await db
    .insert(dormViolationChanges)
    .values({
      violationId: violation.id,
      changedBy: records.accountId,
      action: "entered",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: violation.id };
}

describe("a dorm violation", () => {
  it("is refused a reason under 3 or over 200 letters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const reason of ["ab", "a".repeat(201)]) {
        await expect(
          inOwnStep(db, (tx) => addViolation(tx, records, { reason })),
        ).rejects.toThrow();
      }
      await expect(
        addViolation(db, records, { reason: "abc" }),
      ).resolves.toHaveLength(1);
    });
  });

  it("says what Hukuman lainnya is, and holds no such words for another punishment", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, { punishment: "other" }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, { otherPunishment: "Menyapu aula" }),
        ),
      ).rejects.toThrow();
      await expect(
        addViolation(db, records, {
          punishment: "other",
          otherPunishment: "Menyapu aula",
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is refused an announcement on a campus day before the violation", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      // 23:59 on campus on 11 October 3150.
      const dayBefore = new Date("3150-10-11T16:59:00Z");

      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, {
            announcedAt: dayBefore,
            enteredAt: dayBefore,
            day: "3150-10-12",
          }),
        ),
      ).rejects.toThrow();
      // 00:00 on campus on 12 October 3150.
      const sameDay = new Date("3150-10-11T17:00:00Z");
      await expect(
        addViolation(db, records, { announcedAt: sameDay, enteredAt: sameDay }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is refused a violation day after the day it was recorded", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        inOwnStep(db, (tx) => addViolation(tx, records, { day: "3150-10-13" })),
      ).rejects.toThrow();
    });
  });

  it("is cancelled only with who and when together, and only before its announcement", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const before = new Date(ANNOUNCED.getTime() - 1000);

      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, { cancelledAt: before }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, {
            cancelledAt: ANNOUNCED,
            cancelledBy: records.accountId,
          }),
        ),
      ).rejects.toThrow();
      await expect(
        addViolation(db, records, {
          cancelledAt: before,
          cancelledBy: records.accountId,
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormViolations)
        .where(eq(dormViolations.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });
});

describe("the log of dorm violations", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(dormViolationChanges)
        .set({ action: "cancelled" })
        .where(eq(dormViolationChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(dormViolationChanges)
        .where(eq(dormViolationChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate dorm_violation_changes`),
      ).rejects.toThrow();
    });
  });
});

function addAppeal(
  db: Database,
  violationId: string,
  more: Partial<typeof dormViolationAppeals.$inferInsert> = {},
) {
  return db
    .insert(dormViolationAppeals)
    .values({
      violationId,
      reason: "Saya sedang izin resmi pada jam itu.",
      sentAt: ANNOUNCED,
      ...more,
    })
    .returning();
}

async function addAnnounced(db: Database): Promise<Records & { id: string }> {
  const records = await addRecords(db);
  const [violation] = await addViolation(db, records);
  if (!violation) throw new Error("The violation was not added.");
  return { ...records, id: violation.id };
}

describe("an appeal of a dorm violation", () => {
  it("is one per violation", async () => {
    await inTestDatabase(async (db) => {
      const violation = await addAnnounced(db);

      await expect(addAppeal(db, violation.id)).resolves.toHaveLength(1);
      await expect(addAppeal(db, violation.id)).rejects.toThrow();
    });
  });

  it("is refused a reason under 15 or over 500 letters", async () => {
    await inTestDatabase(async (db) => {
      const violation = await addAnnounced(db);

      for (const reason of ["a".repeat(14), "a".repeat(501)]) {
        await expect(
          inOwnStep(db, (tx) => addAppeal(tx, violation.id, { reason })),
        ).rejects.toThrow();
      }
      await expect(
        addAppeal(db, violation.id, { reason: "a".repeat(15) }),
      ).resolves.toHaveLength(1);
    });
  });

  it("names its proof whole or not at all", async () => {
    await inTestDatabase(async (db) => {
      const violation = await addAnnounced(db);

      await expect(
        inOwnStep(db, (tx) =>
          addAppeal(tx, violation.id, { fileName: "bukti.pdf" }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addAppeal(tx, violation.id, { fileKey: "dorm-violation-appeals/a" }),
        ),
      ).rejects.toThrow();
      await expect(
        addAppeal(db, violation.id, {
          fileName: "bukti.pdf",
          fileContentType: "application/pdf",
          fileSize: 1000,
        }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is decided only with who and when, and rejected only with a note", async () => {
    await inTestDatabase(async (db) => {
      const violation = await addAnnounced(db);
      const by = violation.accountId;
      const decided = { decidedBy: by, decidedAt: ANNOUNCED };

      await expect(
        inOwnStep(db, (tx) =>
          addAppeal(tx, violation.id, { status: "accepted" }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => addAppeal(tx, violation.id, decided)),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addAppeal(tx, violation.id, { ...decided, status: "rejected" }),
        ),
      ).rejects.toThrow();
      await expect(
        addAppeal(db, violation.id, {
          ...decided,
          status: "rejected",
          decisionNote: "Tidak ada izin tercatat.",
        }),
      ).resolves.toHaveLength(1);
    });
  });
});

/** A reduction four hours after the announcement, by `by`. */
function reducedBy(by: string) {
  return {
    reducedBy: by,
    reducedAt: new Date(ANNOUNCED.getTime() + 4 * 60 * 60 * 1000),
    reductionReason: "Terbukti sedang izin resmi.",
  };
}

describe("a reduction of a dorm violation", () => {
  it("keeps the reason, who and when together", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const whole = reducedBy(records.accountId);

      for (const part of [
        { reducedAt: whole.reducedAt },
        { reducedBy: whole.reducedBy, reducedAt: whole.reducedAt },
        { reductionReason: whole.reductionReason },
      ]) {
        await expect(
          inOwnStep(db, (tx) => addViolation(tx, records, part)),
        ).rejects.toThrow();
      }
      await expect(addViolation(db, records, whole)).resolves.toHaveLength(1);
    });
  });

  it("is refused a reason under 5 or over 500 letters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const whole = reducedBy(records.accountId);

      for (const reductionReason of ["a".repeat(4), "a".repeat(501)]) {
        await expect(
          inOwnStep(db, (tx) =>
            addViolation(tx, records, { ...whole, reductionReason }),
          ),
        ).rejects.toThrow();
      }
      await expect(
        addViolation(db, records, { ...whole, reductionReason: "a".repeat(5) }),
      ).resolves.toHaveLength(1);
    });
  });

  it("is refused before the announcement and on a cancelled violation", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const whole = reducedBy(records.accountId);
      const before = new Date(ANNOUNCED.getTime() - 1000);

      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, { ...whole, reducedAt: before }),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          addViolation(tx, records, {
            ...whole,
            cancelledAt: before,
            cancelledBy: records.accountId,
          }),
        ),
      ).rejects.toThrow();
    });
  });

  it("is undone by taking the mark away, and the violation stays", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [violation] = await addViolation(
        db,
        records,
        reducedBy(records.accountId),
      );
      if (!violation) throw new Error("The violation was not added.");

      const [undone] = await db
        .update(dormViolations)
        .set({ reducedBy: null, reducedAt: null, reductionReason: "" })
        .where(eq(dormViolations.id, violation.id))
        .returning();

      expect(undone).toMatchObject({ id: violation.id, reducedAt: null });
    });
  });
});
