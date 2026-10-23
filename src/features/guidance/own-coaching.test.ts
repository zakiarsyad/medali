// Sample Tahun akademik of this file: 5420 to 5420.
// Sample NIMs of this file: 9989750000 to 9989750099.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { changeCoachingStatus } from "./change-coaching-status";
import { readOwnCoaching } from "./student-coaching";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  addCoachingStatus,
  coachingStatusAt,
  INTENSIVE,
  MODERATE,
  NOT_LISTED,
} from "./test-coaching";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

const ENTERED_AT = new Date("5420-09-01T03:00:00Z");

function studentAccount(
  studentId: string,
  roles: RoleId[] = ["student"],
): AccountForAccess {
  return { id: crypto.randomUUID(), roles, studyProgramId: null, studentId };
}

/** Ani Intensif, Budi Sedang, Citra not listed. */
async function setting(db: Database) {
  const periodId = await addCoachingPeriod(db, 5420);
  const { studentIds } = await addNoteStudents(
    db,
    "Prodi Uji Pembinaan Sendiri",
    "Mahasiswa Uji Pembinaan Sendiri",
    ["9989750001", "9989750002", "9989750003"],
  );
  const [ani = "", budi = "", citra = ""] = studentIds;
  const kepala = await addNoteActor(db, "Kepala Uji Pembinaan Sendiri", [
    "head_of_unit",
  ]);
  const assessed: Array<[string, Scores]> = [
    [ani, INTENSIVE],
    [budi, MODERATE],
    [citra, NOT_LISTED],
  ];
  for (const [studentId, scores] of assessed) {
    await addCoachingAssessment(
      db,
      studentId,
      kepala.id,
      periodId,
      scores,
      ENTERED_AT,
    );
  }
  return { ani, budi, citra, kepala };
}

describe("readOwnCoaching", () => {
  it("gives a listed student their own level, weakest value, status and the staff note", async () => {
    await inTestDatabase(async (db) => {
      const { ani, kepala } = await setting(db);
      await addCoachingStatus(
        db,
        ani,
        kepala.id,
        "counselling",
        "Dijadwalkan konseling minggu depan.",
      );

      expect(await readOwnCoaching(db, studentAccount(ani))).toEqual({
        level: "intensive",
        weakest: "M",
        status: "counselling",
        note: "Dijadwalkan konseling minggu depan.",
      });
    });
  });

  it("only ever gives a student their own, whichever other role they hold", async () => {
    await inTestDatabase(async (db) => {
      const { budi } = await setting(db);
      const both = studentAccount(budi, ["student", "head_of_unit"]);

      expect(await readOwnCoaching(db, both)).toMatchObject({
        level: "moderate",
      });
    });
  });

  it("gives no card to a student who is not listed, or whose pembinaan is Selesai", async () => {
    await inTestDatabase(async (db) => {
      const { ani, citra, kepala } = await setting(db);
      await addCoachingStatus(db, ani, kepala.id, "done");

      expect(await readOwnCoaching(db, studentAccount(citra))).toBeNull();
      expect(await readOwnCoaching(db, studentAccount(ani))).toBeNull();
    });
  });

  it("gives nothing to an account without the right", async () => {
    await inTestDatabase(async (db) => {
      const { ani, kepala } = await setting(db);

      expect(
        await readOwnCoaching(db, { ...kepala, studentId: ani }),
      ).toBeNull();
    });
  });

  it("shows the new status once staff change it in Pembinaan karakter", async () => {
    await inTestDatabase(async (db) => {
      const { ani, kepala } = await setting(db);

      await changeCoachingStatus(db, kepala, ani, 0, "monitoring", "Dipantau.");

      expect(await readOwnCoaching(db, studentAccount(ani))).toMatchObject({
        status: "monitoring",
        note: "Dipantau.",
      });
    });
  });

  it("refuses a hand-made change of a student's own pembinaan, keeping it as it was", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setting(db);

      const answer = await changeCoachingStatus(
        db,
        studentAccount(ani),
        ani,
        0,
        "done",
        "",
      );

      expect(answer.ok).toBe(false);
      expect(await coachingStatusAt(db, ani)).toBeUndefined();
    });
  });
});

describe("Pembinaan (level) on Profil saya", () => {
  const PAGE = readFileSync("src/app/(app)/saya/page.tsx", "utf8");

  it("stands after Riwayat per semester, for the student of the account", () => {
    const history = PAGE.indexOf("<OwnScoreHistoryPanel ");

    expect(history).toBeGreaterThan(-1);
    expect(
      PAGE.indexOf("<OwnCoachingPanel account={account} />"),
    ).toBeGreaterThan(history);
  });
});
