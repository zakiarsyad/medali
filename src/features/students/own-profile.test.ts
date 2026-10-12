// Sample NIMs of this file: 9900002200 to 9900002299.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readOwnProfile } from "./own-profile";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const REFUSED = { kind: "refused" };
const NO_SUCH_ID = "00000000-0000-4000-8000-000000000000";

function account(roles: RoleId[], studentId: string | null): AccountForAccess {
  return { id: NO_SUCH_ID, roles, studyProgramId: null, studentId };
}

/** Two students of one program. */
async function addRows(db: Database) {
  const program = await addTestProgram(db, "Prodi Uji Profil");
  const own = await addTestStudent(db, program, {
    nim: "9900002201",
    name: "Profil Uji Ani",
    entryPath: "transfer",
    originAgency: "Direktorat Jenderal Pajak",
    cohortYear: 2025,
    className: "2-01",
    province: "Bali",
    isSeedling: true,
    status: "on_leave",
  });
  const other = await addTestStudent(db, program, {
    nim: "9900002202",
    name: "Profil Uji Budi",
  });
  return { program, own, other };
}

describe("readOwnProfile", () => {
  it("gives a student their own record, and nothing of their kelompok pengasuhan or dorm", async () => {
    await inTestDatabase(async (db) => {
      const { program, own } = await addRows(db);
      const mentor = await addTestActor(db, "Profil Uji Pengasuh", ["mentor"]);
      await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [own],
        mentorId: mentor.id,
      });

      const answer = await readOwnProfile(db, account(["student"], own));

      expect(answer).toStrictEqual({
        kind: "found",
        student: {
          id: own,
          nim: "9900002201",
          name: "Profil Uji Ani",
          status: "on_leave",
          isAffirmation: false,
          isSeedling: true,
          isInternational: false,
          isBlended: false,
          studyProgram: "Prodi Uji Profil",
          entryPath: "transfer",
          originAgency: "Direktorat Jenderal Pajak",
          cohortYear: 2025,
          className: "2-01",
          province: "Bali",
          sex: "female",
        },
      });
    });
  });

  it("gives each of two students their own record and never the other's", async () => {
    await inTestDatabase(async (db) => {
      const { own, other } = await addRows(db);

      const first = await readOwnProfile(db, account(["student"], own));
      const second = await readOwnProfile(db, account(["student"], other));

      expect(first).toMatchObject({ student: { id: own } });
      expect(second).toMatchObject({ student: { id: other } });
    });
  });

  it("gives a student who also holds a BAM role their own record", async () => {
    await inTestDatabase(async (db) => {
      const { own } = await addRows(db);
      const asking = account(["student", "bam_bphk"], own);

      const answer = await readOwnProfile(db, asking);

      expect(answer).toMatchObject({ kind: "found", student: { id: own } });
    });
  });

  it.each(["head_of_unit", "head_of_program", "dorm_manager"] as const)(
    "refuses %s, even with a student record on the account",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { own } = await addRows(db);

        const answer = await readOwnProfile(db, account([role], own));

        expect(answer).toEqual(REFUSED);
      });
    },
  );

  it("refuses a Mahasiswa account that has no student record", async () => {
    await inTestDatabase(async (db) => {
      await addRows(db);

      const answer = await readOwnProfile(db, account(["student"], null));

      expect(answer).toEqual(REFUSED);
    });
  });

  it("refuses a student whose record was removed", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Profil Hapus");
      const removed = await addTestStudent(db, program, {
        nim: "9900002203",
        name: "Profil Uji Dihapus",
        deletedAt: new Date("2026-10-11T03:00:00Z"),
      });

      const answer = await readOwnProfile(db, account(["student"], removed));

      expect(answer).toEqual(REFUSED);
    });
  });
});
