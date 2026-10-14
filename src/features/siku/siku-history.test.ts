// Sample Tahun akademik of this file: 2906 to 2906.
// Sample NIMs of this file: 9964000700 to 9964000799.
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readSeenStudents, readSikuHistory } from "./siku-history";
import {
  addTestActor,
  addTestEntry,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

const YEAR = 2906;

function seenBy(actor: TestActor) {
  const visible = visibleTo(rowLimitForAction(actor, "view_siku"));
  return and(visible, eq(students.cohortYear, YEAR)) ?? visible;
}

/**
 * Two programs. A gain for Ani and Budi of the first and Citra of the
 * second, a loss for Citra only, and a cancelled gain for Ani.
 */
async function addRecords(db: Database) {
  const periods = await addTestYear(db, YEAR);
  const first = await addTestStudents(db, "Prodi Uji Riwayat SIKU A", YEAR, [
    "9964000701",
    "9964000702",
  ]);
  const second = await addTestStudents(db, "Prodi Uji Riwayat SIKU B", YEAR, [
    "9964000703",
  ]);
  const [ani, budi] = first.studentIds;
  const [citra] = second.studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Riwayat", ["assessor"]);
  const gain = await addTestEntry(db, penilai, {
    kind: "gain",
    reason: "spiritual_activity",
    points: 2,
    day: `${YEAR}-10-10`,
    periodId: periods.odd,
    studentIds: [ani, budi, citra],
  });
  const loss = await addTestEntry(db, penilai, {
    kind: "loss",
    reason: "discipline_penalty",
    points: 5,
    day: `${YEAR}-10-12`,
    periodId: periods.odd,
    studentIds: [citra],
  });
  const cancelled = await addTestEntry(db, penilai, {
    kind: "gain",
    reason: "peer_mentoring",
    points: 3,
    day: `${YEAR}-10-13`,
    periodId: periods.odd,
    studentIds: [ani],
    cancelled: true,
  });
  const kaprodi = await addTestActor(
    db,
    "Kaprodi Uji Riwayat",
    ["head_of_program"],
    { studyProgramId: first.programId },
  );
  return { ids: { ani, budi, citra }, gain, loss, cancelled, penilai, kaprodi };
}

describe("readSikuHistory", () => {
  it("shows the entries in force, the latest first, with who entered them and how many students", async () => {
    await inTestDatabase(async (db) => {
      const { gain, loss, penilai } = await addRecords(db);

      const history = await readSikuHistory(db, seenBy(penilai), 1);

      expect(history.matching).toBe(2);
      expect(history.entries).toMatchObject([
        {
          id: loss,
          kind: "loss",
          reason: "discipline_penalty",
          points: 5,
          students: 1,
          enteredBy: "Penilai Uji Riwayat",
        },
        { id: gain, kind: "gain", students: 3 },
      ]);
    });
  });

  it("shows Ketua Program Studi only entries of their program, counting only its students", async () => {
    await inTestDatabase(async (db) => {
      const { gain, kaprodi } = await addRecords(db);

      const history = await readSikuHistory(db, seenBy(kaprodi), 1);

      expect(history.entries).toMatchObject([{ id: gain, students: 2 }]);
    });
  });

  it("shows the reason Hukuman disiplin mahasiswa to the roles that read the tab", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const direktur = await addTestActor(db, "Direktur Uji Riwayat", [
        "director",
      ]);

      for (const reader of [penilai, direktur]) {
        const history = await readSikuHistory(db, seenBy(reader), 1);
        expect(history.entries.map((entry) => entry.reason)).toContain(
          "discipline_penalty",
        );
      }
    });
  });
});

describe("readSeenStudents", () => {
  it("lists the students of an entry the account sees, by name and then NIM", async () => {
    await inTestDatabase(async (db) => {
      const { gain, penilai, kaprodi } = await addRecords(db);

      const all = await readSeenStudents(db, seenBy(penilai), gain, 1);
      const ofProgram = await readSeenStudents(db, seenBy(kaprodi), gain, 1);

      // The first student of each program has the same name.
      expect(all?.students.map((student) => student.nim)).toEqual([
        "9964000701",
        "9964000703",
        "9964000702",
      ]);
      expect(ofProgram?.students.map((student) => student.nim)).toEqual([
        "9964000701",
        "9964000702",
      ]);
    });
  });

  it("gives nothing for a cancelled entry, or one with nobody the account sees", async () => {
    await inTestDatabase(async (db) => {
      const { loss, cancelled, penilai, kaprodi } = await addRecords(db);

      expect(await readSeenStudents(db, seenBy(penilai), cancelled, 1)).toBe(
        null,
      );
      expect(await readSeenStudents(db, seenBy(kaprodi), loss, 1)).toBe(null);
    });
  });
});
