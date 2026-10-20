// Sample NIMs of this file: 9944200000 to 9944200099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  addTestPenalty,
  NO_SOCIAL_WORK,
} from "@/features/guidance/test-discipline-penalties";
import {
  addNoteActor,
  addNoteStudents,
} from "@/features/guidance/test-violation-notes";
import type { Database } from "./connect";
import { disciplinePenalties, disciplinePenaltyChanges } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addNamed(db: Database, nim: string) {
  const officer = await addNoteActor(db, "Pembina Uji Tabel Hukuman", [
    "discipline_officer",
  ]);
  const { studentIds } = await addNoteStudents(
    db,
    `Prodi Uji Tabel Hukuman ${nim}`,
    "Mahasiswa Uji Tabel Hukuman",
    [nim],
  );
  const [studentId = ""] = studentIds;
  return { studentId, by: officer.id };
}

const DAY = "2026-10-12";

describe("a discipline penalty", () => {
  it("is kept for a Berat jenjang kedua as Ditetapkan, with no kerja sosial", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9944200001");

      const id = await addTestPenalty(db, studentId, by, DAY, {
        category: "heavy",
        level: 2,
        status: "set",
        decisionNumber: "KEP-01/UJI/2026",
        ...NO_SOCIAL_WORK,
      });

      const [kept] = await db
        .select()
        .from(disciplinePenalties)
        .where(eq(disciplinePenalties.id, id));
      expect(kept?.status).toBe("set");
      expect(kept?.socialWorkForms).toEqual([]);
    });
  });

  it.each([
    ["a Jenjang 4", { level: 4 }],
    ["an Uraian under 5 letters", { description: "Tela" }],
    ["an Uraian over 1000 characters", { description: "a".repeat(1001) }],
    [
      "a Nomor keputusan over 100 characters",
      { decisionNumber: "a".repeat(101) },
    ],
    ["Ditetapkan for a Ringan penalty", { status: "set" as const }],
    [
      "Dijatuhkan for a penalty that ends the status",
      { category: "heavy" as const, level: 3, ...NO_SOCIAL_WORK },
    ],
    [
      "kerja sosial for a penalty that ends the status",
      { category: "heavy" as const, level: 3, status: "set" as const },
    ],
    ["kerja sosial with no Bentuk", { socialWorkForms: [] }],
    ["kerja sosial with no Lokasi", { socialWorkPlace: null }],
    ["kerja sosial with no last day", { socialWorkEndsOn: null }],
    ["kerja sosial before the Tanggal", { socialWorkStartsOn: "2026-10-11" }],
    [
      "kerja sosial that ends before it starts",
      { socialWorkEndsOn: "2026-10-11" },
    ],
    ["lainnya with no text", { socialWorkForms: ["other" as const] }],
    ["a text of lainnya without lainnya", { socialWorkOther: "Menyapu" }],
    [
      "a save before its Tanggal",
      { savedAt: new Date("2026-10-11T10:00:00+07:00") },
    ],
  ])("refuses %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9944200002");

      const kept = inOwnStep(db, (tx) =>
        addTestPenalty(tx, studentId, by, DAY, more),
      );

      await expect(kept).rejects.toThrow();
    });
  });

  it("is never deleted", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9944200003");
      const id = await addTestPenalty(db, studentId, by, DAY);

      const deleted = inOwnStep(db, (tx) =>
        tx.delete(disciplinePenalties).where(eq(disciplinePenalties.id, id)),
      );
      await expect(deleted).rejects.toThrow();
      const emptied = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate discipline_penalties cascade`),
      );
      await expect(emptied).rejects.toThrow();
    });
  });
});

describe("the log of discipline penalties", () => {
  it("refuses to change, delete or empty a line", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, by } = await addNamed(db, "9944200004");
      const id = await addTestPenalty(db, studentId, by, DAY);

      const changed = inOwnStep(db, (tx) =>
        tx
          .update(disciplinePenaltyChanges)
          .set({ changedAt: new Date() })
          .where(eq(disciplinePenaltyChanges.penaltyId, id)),
      );
      await expect(changed).rejects.toThrow();
      const deleted = inOwnStep(db, (tx) =>
        tx
          .delete(disciplinePenaltyChanges)
          .where(eq(disciplinePenaltyChanges.penaltyId, id)),
      );
      await expect(deleted).rejects.toThrow();
      const emptied = inOwnStep(db, (tx) =>
        tx.execute(sql`truncate discipline_penalty_changes`),
      );
      await expect(emptied).rejects.toThrow();
    });
  });
});
