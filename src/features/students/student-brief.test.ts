// Sample NIMs of this file: 9900400400 to 9900400499.
import { describe, expect, it } from "vitest";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readDetailOrBrief } from "./student-brief";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

const NO_SUCH_ID = "00000000-0000-4000-8000-000000000000";

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: NO_SUCH_ID, roles, studyProgramId, studentId: null };
}

/** The detail opened from Penilaian SIKU, whose rows give the brief. */
function openFromSiku(db: Database, asking: AccountForAccess, id: string) {
  const sikuVisible = visibleTo(rowLimitForAction(asking, "view_siku"));
  return readDetailOrBrief(db, asking, id, null, sikuVisible);
}

async function addRows(db: Database) {
  const own = await addTestProgram(db, "Prodi Uji Ringkas Sendiri");
  const other = await addTestProgram(db, "Prodi Uji Ringkas Lain");
  const ani = await addTestStudent(db, own, {
    nim: "9900400401",
    name: "Ringkas Uji Ani",
    province: "Bali",
    className: "2-01",
  });
  const budi = await addTestStudent(db, other, {
    nim: "9900400402",
    name: "Ringkas Uji Budi",
    status: "on_leave",
  });
  return { own, other, ani, budi };
}

describe("readDetailOrBrief", () => {
  it("gives Penilai Mahasiswa only the name, NIM, program studi and status", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRows(db);

      const answer = await openFromSiku(db, account(["assessor"]), ani);

      expect(answer).toEqual({
        kind: "brief",
        student: {
          id: ani,
          name: "Ringkas Uji Ani",
          nim: "9900400401",
          studyProgram: "Prodi Uji Ringkas Sendiri",
          status: "active",
        },
      });
    });
  });

  it("gives Penilai Mahasiswa the brief of a student on Cuti too", async () => {
    await inTestDatabase(async (db) => {
      const { budi } = await addRows(db);

      const answer = await openFromSiku(db, account(["assessor"]), budi);

      expect(answer).toMatchObject({
        kind: "brief",
        student: { status: "on_leave" },
      });
    });
  });

  it("gives Kepala Unit the whole detail", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRows(db);

      const answer = await openFromSiku(db, account(["head_of_unit"]), ani);

      expect(answer).toMatchObject({
        kind: "found",
        student: { id: ani, province: "Bali", className: "2-01" },
      });
    });
  });

  it("finds no student of another program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const { own, budi } = await addRows(db);

      const answer = await openFromSiku(
        db,
        account(["head_of_program"], own),
        budi,
      );

      expect(answer).toEqual({ kind: "not_found" });
    });
  });

  it("gives the brief to a Ketua Program Studi who is also Penilai Mahasiswa, for a student of another program", async () => {
    await inTestDatabase(async (db) => {
      const { own, budi } = await addRows(db);

      const answer = await openFromSiku(
        db,
        account(["head_of_program", "assessor"], own),
        budi,
      );

      expect(answer.kind).toBe("brief");
    });
  });

  it("finds nothing for a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      expect(await openFromSiku(db, account(["assessor"]), "bukan-id")).toEqual(
        { kind: "not_found" },
      );
    });
  });
});
