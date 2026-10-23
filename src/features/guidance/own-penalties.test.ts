// Sample NIMs of this file: 9989740000 to 9989740099.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { changePenaltyStatus } from "./follow-up-discipline-penalty";
import { readOwnPenalties } from "./student-penalties";
import { addTestPenalty, penaltyAt } from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

/** The account of a student, with these roles. */
function studentAccount(
  studentId: string,
  roles: RoleId[] = ["student"],
): AccountForAccess {
  return { id: crypto.randomUUID(), roles, studyProgramId: null, studentId };
}

/** Ani with two penalties, Budi with one, and the officer who saved them. */
async function setting(db: Database) {
  const { studentIds } = await addNoteStudents(
    db,
    "Prodi Uji Hukuman Sendiri",
    "Mahasiswa Uji Hukuman Sendiri",
    ["9989740001", "9989740002"],
  );
  const [ani = "", budi = ""] = studentIds;
  const officer = await addNoteActor(db, "Pembina Uji Hukuman Sendiri", [
    "discipline_officer",
  ]);
  const older = await addTestPenalty(db, ani, officer.id, "2026-09-01");
  const newer = await addTestPenalty(db, ani, officer.id, "2026-10-01", {
    category: "medium",
    description: "Membawa barang terlarang ke asrama",
  });
  await addTestPenalty(db, budi, officer.id, "2026-09-15");
  return { ani, budi, officer, older, newer };
}

describe("readOwnPenalties", () => {
  it("gives a student their own penalties, the newest first, with only the fields shown", async () => {
    await inTestDatabase(async (db) => {
      const { ani, older, newer } = await setting(db);

      const own = await readOwnPenalties(db, studentAccount(ani));

      expect(own?.map((penalty) => penalty.id)).toEqual([newer, older]);
      expect(Object.keys(own?.[0] ?? {}).sort()).toEqual([
        "category",
        "day",
        "description",
        "hasSocialWork",
        "id",
        "level",
        "status",
      ]);
      expect(own?.[0]).toMatchObject({
        category: "medium",
        description: "Membawa barang terlarang ke asrama",
        hasSocialWork: true,
      });
    });
  });

  it("only ever gives a student their own, whichever other role they hold", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi } = await setting(db);
      const both = studentAccount(budi, ["student", "head_of_unit"]);

      const own = await readOwnPenalties(db, both);

      expect(own).toHaveLength(1);
      expect(await readOwnPenalties(db, studentAccount(ani))).toHaveLength(2);
    });
  });

  it("gives none to a student without a penalty, and nothing to an account without the right", async () => {
    await inTestDatabase(async (db) => {
      const { ani, officer } = await setting(db);
      const { studentIds } = await addNoteStudents(
        db,
        "Prodi Uji Hukuman Sendiri Kosong",
        "Mahasiswa Uji Hukuman Sendiri Kosong",
        ["9989740011"],
      );

      expect(
        await readOwnPenalties(db, studentAccount(studentIds[0] ?? "")),
      ).toEqual([]);
      expect(await readOwnPenalties(db, { ...officer, studentId: ani })).toBe(
        null,
      );
    });
  });

  it("shows the new status once staff change it in Daftar pelanggaran", async () => {
    await inTestDatabase(async (db) => {
      const { ani, officer, newer } = await setting(db);
      const version = (await penaltyAt(db, newer))?.version ?? 0;

      await changePenaltyStatus(db, officer, newer, version, "serving");
      const own = await readOwnPenalties(db, studentAccount(ani));

      expect(own?.[0]?.status).toBe("serving");
    });
  });

  it("refuses a hand-made change of a student's own penalty, keeping it as it was", async () => {
    await inTestDatabase(async (db) => {
      const { ani, newer } = await setting(db);
      const version = (await penaltyAt(db, newer))?.version ?? 0;

      const answer = await changePenaltyStatus(
        db,
        studentAccount(ani),
        newer,
        version,
        "served",
      );

      expect(answer.ok).toBe(false);
      expect((await penaltyAt(db, newer))?.status).toBe("imposed");
    });
  });
});

describe("Riwayat pelanggaran disiplin on Profil saya", () => {
  const PANEL = readFileSync(
    "src/features/guidance/own-penalties-panel.tsx",
    "utf8",
  );
  const PAGE = readFileSync("src/app/(app)/saya/page.tsx", "utf8");

  it("has no Catat pelanggaran", () => {
    expect(PANEL).toContain("recordAddress={null}");
  });

  it("stands under the score cards, before Riwayat per semester, for the student of the account", () => {
    const order = [
      "<ProfileSikuPanel",
      "<OwnPenaltiesPanel account={account} />",
      "<OwnScoreHistoryPanel ",
    ].map((panel) => PAGE.indexOf(panel));

    expect(order[0]).toBeGreaterThan(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
