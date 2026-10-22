// Sample Tahun akademik of this file: 4479 to 4479.
// Sample NIMs of this file: 9987709000 to 9987709099.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { StudentCoachingPanel } from "./student-coaching-panel";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  addCoachingStatus,
  INTENSIVE,
  NOT_LISTED,
} from "./test-coaching";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const opened = vi.hoisted(() => ({ db: null as Database | null }));

vi.mock("@/db/database", () => ({ database: () => opened.db }));

const inTestDatabase = withTestDatabase();

const ASSESSED_AT = new Date("4479-09-01T03:00:00Z");

interface Setting {
  kepala: AccountForAccess;
  /** Prodi A: 1 Intensif, 2 not listed, 3 never assessed. */
  inA: [string, string, string];
  /** Prodi B: 1 Intensif, 2 not listed. */
  inB: [string, string];
  programA: number;
}

async function setting(db: Database): Promise<Setting> {
  opened.db = db;
  const periodId = await addCoachingPeriod(db, 4479);
  const a = await addNoteStudents(
    db,
    "Prodi Uji Panel Pembinaan A",
    "Mahasiswa Uji Panel Pembinaan A",
    ["9987709001", "9987709002", "9987709003"],
  );
  const b = await addNoteStudents(
    db,
    "Prodi Uji Panel Pembinaan B",
    "Mahasiswa Uji Panel Pembinaan B",
    ["9987709011", "9987709012"],
  );
  const kepala = await addNoteActor(db, "Kepala Uji Panel Pembinaan", [
    "head_of_unit",
  ]);
  const [a1 = "", a2 = "", a3 = ""] = a.studentIds;
  const [b1 = "", b2 = ""] = b.studentIds;
  const assessed: Array<[string, typeof INTENSIVE]> = [
    [a1, INTENSIVE],
    [a2, NOT_LISTED],
    [b1, INTENSIVE],
    [b2, NOT_LISTED],
  ];
  for (const [studentId, scores] of assessed) {
    await addCoachingAssessment(
      db,
      studentId,
      kepala.id,
      periodId,
      scores,
      ASSESSED_AT,
    );
  }
  return { kepala, inA: [a1, a2, a3], inB: [b1, b2], programA: a.programId };
}

function reader(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(
    db,
    "Pembaca Uji Panel Pembinaan",
    roles,
    programId ?? null,
  );
}

/** What the panel sends to the screen: empty when it shows nothing. */
async function shown(
  account: AccountForAccess,
  studentId: string,
): Promise<string> {
  const panel = await StudentCoachingPanel({ account, studentId });
  if (panel === null) return "";
  return renderToStaticMarkup(panel);
}

describe("StudentCoachingPanel", () => {
  it("shows the panel of a listed student, with a Selesai status too", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA } = await setting(db);
      await addCoachingStatus(db, inA[0], kepala.id, "done", "Sudah membaik.");

      const box = await shown(kepala, inA[0]);

      expect(box).toContain("Pembinaan intensif");
      expect(box).toContain("Selesai");
      expect(box).toContain("Aspek terlemah: Mandiri. Sudah membaik.");
    });
  });

  it("sends nothing at all, not even an empty box, for a student above both limits or never assessed", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA } = await setting(db);

      expect(await shown(kepala, inA[1])).toBe("");
      expect(await shown(kepala, inA[2])).toBe("");
    });
  });

  it.each(["assessor", "counsellor", "discipline_officer"] as const)(
    "sends %s, who opens only the small detail, nothing of a listed student",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { inA } = await setting(db);

        expect(await shown(await reader(db, [role]), inA[0])).toBe("");
      });
    },
  );

  it("sends Ketua Program Studi the same nothing for a listed and a not listed student of another program", async () => {
    await inTestDatabase(async (db) => {
      const { inA, inB, programA } = await setting(db);
      const kaprodi = await reader(db, ["head_of_program"], programA);

      expect(await shown(kaprodi, inA[0])).toContain("Pembinaan intensif");
      expect(await shown(kaprodi, inB[0])).toBe("");
      expect(await shown(kaprodi, inB[1])).toBe("");
    });
  });
});
