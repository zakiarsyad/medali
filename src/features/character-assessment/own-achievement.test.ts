// Sample Tahun akademik of this file: 5400 to 5401.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPenaltyOf,
  addTestRecorder,
} from "@/discipline-penalties/test-penalties";
import { addTestStudent } from "@/dorms/test-records";
import { readOwnAchievement } from "./own-achievement";
import { readOwnScoreHistory } from "./score-history";
import {
  addTestActor,
  addTestAssessment,
  addTestPeriod,
  addTestStudents,
  SILVER_SCORES,
} from "./test-assessments";

// Sample NIMs of this file: 9989720000 to 9989720099.

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 5400/5401, which runs then. */
const TODAY = "5400-10-20";

const LOW_SCORES = { M: 60, E: 55, D: 70, A: 62, L: 64, I: 68 };

const NOTE = "Catatan penilai uji yang tidak untuk mahasiswa";

/**
 * Ani and Budi, angkatan 5399, each with an account of their own. Ani
 * has two assessments, the latest silver with a Catatan penilai; Budi
 * has one, low.
 */
async function addRecords(db: Database) {
  const periodId = await addTestPeriod(db, 5400);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Capaian Sendiri",
    5399,
    ["9989720001", "9989720002"],
  );
  const [ani, budi] = studentIds;
  if (!ani || !budi) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Capaian Sendiri", [
    "assessor",
  ]);
  await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId,
    enteredAt: new Date("5400-09-01T03:00:00Z"),
    scores: LOW_SCORES,
  });
  await addTestAssessment(db, penilai, {
    studentId: ani,
    periodId,
    enteredAt: new Date("5400-10-01T03:00:00Z"),
    scores: SILVER_SCORES,
    note: NOTE,
  });
  await addTestAssessment(db, penilai, {
    studentId: budi,
    periodId,
    enteredAt: new Date("5400-10-02T03:00:00Z"),
    scores: LOW_SCORES,
  });
  const aniAccount = await addTestActor(db, "Akun Uji Ani", ["student"], {
    studentId: ani,
  });
  const budiAccount = await addTestActor(db, "Akun Uji Budi", ["student"], {
    studentId: budi,
  });
  return { periodId, programId, ani, budi, penilai, aniAccount, budiAccount };
}

describe("readOwnAchievement", () => {
  it("gives the student's own latest assessment, the one before it and their semester, never with Input asesmen", async () => {
    await inTestDatabase(async (db) => {
      const { ani, aniAccount } = await addRecords(db);

      const shown = await readOwnAchievement(db, aniAccount, TODAY);

      expect(shown).toEqual({
        studentId: ani,
        semester: 3,
        latest: expect.objectContaining({
          enteredAt: new Date("5400-10-01T03:00:00Z"),
          scores: SILVER_SCORES,
        }),
        earlier: LOW_SCORES,
        mayAssess: false,
        limit: null,
        own: true,
      });
    });
  });

  it("only ever gives a student their own results, whichever other role they hold", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, aniAccount, budiAccount } = await addRecords(db);
      const alsoHead = {
        ...aniAccount,
        roles: ["student", "head_of_unit"] as RoleId[],
      };

      const forAni = await readOwnAchievement(db, aniAccount, TODAY);
      const forBudi = await readOwnAchievement(db, budiAccount, TODAY);
      const forHead = await readOwnAchievement(db, alsoHead, TODAY);

      expect(forAni?.studentId).toBe(ani);
      expect(forBudi?.studentId).toBe(budi);
      expect(forBudi?.latest?.scores).toEqual(LOW_SCORES);
      expect(forBudi?.earlier).toBeNull();
      expect(forHead?.studentId).toBe(ani);
    });
  });

  it("never sends the Catatan penilai", async () => {
    await inTestDatabase(async (db) => {
      const { aniAccount } = await addRecords(db);

      const shown = await readOwnAchievement(db, aniAccount, TODAY);

      expect(shown?.latest).not.toBeNull();
      expect(JSON.stringify(shown)).not.toContain(NOTE);
    });
  });

  it("refuses an account without the right, and one with no student record", async () => {
    await inTestDatabase(async (db) => {
      const { aniAccount } = await addRecords(db);
      const penilaiOfAni = { ...aniAccount, roles: ["assessor"] as RoleId[] };
      const noRecord = { ...aniAccount, studentId: null };

      expect(await readOwnAchievement(db, penilaiOfAni, TODAY)).toBeNull();
      expect(await readOwnAchievement(db, noRecord, TODAY)).toBeNull();
    });
  });

  it("says when the student was never assessed", async () => {
    await inTestDatabase(async (db) => {
      const { programId } = await addRecords(db);
      const citra = await addTestStudent(db, programId, {
        nim: "9989720003",
        name: "Mahasiswa Uji Capaian Sendiri Baru",
        cohortYear: 5399,
      });
      const account = await addTestActor(db, "Akun Uji Citra", ["student"], {
        studentId: citra,
      });

      const shown = await readOwnAchievement(db, account, TODAY);

      expect(shown).toMatchObject({
        latest: null,
        earlier: null,
        mayAssess: false,
      });
    });
  });

  it("gives no semester to a Cuti or Non Aktif student, with the latest result they had", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, programId, penilai } = await addRecords(db);
      for (const [place, status] of (
        ["on_leave", "inactive"] as const
      ).entries()) {
        const id = await addTestStudent(db, programId, {
          nim: `998972001${place}`,
          name: `Mahasiswa Uji Capaian Sendiri ${place}`,
          cohortYear: 5399,
          status,
        });
        await addTestAssessment(db, penilai, {
          studentId: id,
          periodId,
          enteredAt: new Date("5400-09-15T03:00:00Z"),
        });
        const account = await addTestActor(
          db,
          `Akun Uji ${place}`,
          ["student"],
          {
            studentId: id,
          },
        );

        const shown = await readOwnAchievement(db, account, TODAY);

        expect(shown?.semester).toBeNull();
        expect(shown?.latest?.scores).toEqual(SILVER_SCORES);
      }
    });
  });

  it("gives the scores held at 70 under a Ringan or Sedang penalty, with the scores as stored for the sentence", async () => {
    await inTestDatabase(async (db) => {
      const { ani, aniAccount } = await addRecords(db);
      const recorder = await addTestRecorder(db);
      await addTestPenaltyOf(db, ani, recorder, {
        category: "medium",
        level: 2,
      });

      const shown = await readOwnAchievement(db, aniAccount, TODAY);

      expect(shown?.latest).toMatchObject({
        scores: { M: 70, E: 70, D: 70, A: 70, L: 70, I: 70 },
        storedRerata: 80.3,
      });
      expect(shown?.limit).toEqual({ category: "medium", level: 2 });
      expect(shown?.stored).toEqual(SILVER_SCORES);
    });
  });

  it("gives no scores as stored without a limit", async () => {
    await inTestDatabase(async (db) => {
      const { aniAccount } = await addRecords(db);

      const shown = await readOwnAchievement(db, aniAccount, TODAY);

      expect(shown).not.toHaveProperty("stored");
    });
  });
});

describe("both character cards of Profil saya", () => {
  it("read a student assessed many times in each semester, under a limit, well within a second", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, penilai, aniAccount } = await addRecords(db);
      const recorder = await addTestRecorder(db);
      await addTestPenaltyOf(db, ani, recorder, {
        category: "light",
        level: 1,
      });
      const periodIds = [periodId, await addTestPeriod(db, 5401)];
      for (const [place, each] of periodIds.entries()) {
        for (let day = 1; day <= 25; day += 1) {
          await addTestAssessment(db, penilai, {
            studentId: ani,
            periodId: each,
            enteredAt: new Date(Date.UTC(5400 + place, 7, day, 3)),
          });
        }
      }
      const started = performance.now();

      const [card, history] = await Promise.all([
        readOwnAchievement(db, aniAccount, TODAY),
        readOwnScoreHistory(db, aniAccount),
      ]);

      expect(performance.now() - started).toBeLessThan(1000);
      expect(card?.stored).toBeDefined();
      expect(history?.map((point) => point.semester)).toEqual([3, 5]);
    });
  });
});

describe("Profil saya", () => {
  const PAGE = readFileSync("src/app/(app)/saya/page.tsx", "utf8");

  it("asks nothing of the request: the student is the one of the account", () => {
    expect(PAGE).toContain("export default async function OwnProfilePage()");
    expect(PAGE).not.toMatch(/params/i);
    expect(PAGE).toContain("<OwnAchievementPanel account={account} />");
    expect(PAGE).toContain("<OwnScoreHistoryPanel account={account} />");
  });

  it("puts Nilai karakter and Transparansi nilai SIKU between Capaian karakter and Riwayat per semester", () => {
    const order = [
      "<OwnAchievementPanel ",
      "<OwnGradePanel account={account} />",
      "<ProfileSikuPanel",
      "<OwnScoreHistoryPanel ",
    ].map((panel) => PAGE.indexOf(panel));

    expect(order[0]).toBeGreaterThan(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("shows Transparansi nilai SIKU only to an Aktif student", () => {
    expect(PAGE).toContain(
      'const isActive = answer.student.status === "active";',
    );
    expect(PAGE).toContain("{isActive && (");
  });

  it("puts Kesehatan jasmani then Kesehatan mental after Riwayat per semester, for every student whatever their status", () => {
    const history = PAGE.indexOf("<OwnScoreHistoryPanel ");
    const fitness = PAGE.indexOf("<OwnFitnessPanel account={account} />");
    const mental = PAGE.indexOf("<OwnMentalPanel account={account} />");

    expect(history).toBeGreaterThan(-1);
    expect(fitness).toBeGreaterThan(history);
    expect(mental).toBeGreaterThan(fitness);
    const activeOnlyStart = PAGE.lastIndexOf("{isActive && (", fitness);
    const activeOnlyEnd = PAGE.indexOf(")}", activeOnlyStart);
    expect(activeOnlyEnd).toBeLessThan(fitness);
  });

  it("puts Riwayat per semester under the card", () => {
    const card = PAGE.indexOf("<OwnAchievementPanel ");

    expect(card).toBeGreaterThan(-1);
    expect(PAGE.indexOf("<OwnScoreHistoryPanel ")).toBeGreaterThan(card);
  });
});
