// Sample Tahun akademik of this file: 5170 to 5171.
// Sample NIMs of this file: 9989630000 to 9989630099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, type students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
  replaceTestMentor,
} from "@/features/mentoring/test-records";
import { readStudentDetail } from "@/features/students/student-detail";
import type { MenteeDashboard } from "./mentee-recap";
import { menteeScopeOf } from "./mentee-scope";
import { loadMenteeDashboard } from "./mentee-view";

const inTestDatabase = withTestDatabase();

const ODD_5170 = { startYear: 5170, term: "odd" } as const;

/**
 * Two groups of one program: the first held by `mentor`, with three
 * Aktif students and one on Cuti, the second by `other`, with two Aktif
 * students. `spare` holds no group.
 */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "Prodi Uji Anak Asuh");
  const mentor = await addTestAccount(db, "Pengasuh Uji Anak Asuh", ["mentor"]);
  const other = await addTestAccount(db, "Pengasuh Uji Anak Asuh Lain", [
    "mentor",
  ]);
  const spare = await addTestAccount(db, "Pengasuh Uji Tanpa Kelompok", [
    "mentor",
  ]);
  const add = (nim: string, more: Partial<typeof students.$inferInsert> = {}) =>
    addTestStudent(db, programId, {
      nim: `99896300${nim}`,
      name: `Mahasiswa Uji Anak Asuh ${nim}`,
      ...more,
    });
  const ids = {
    s01: await add("01"),
    s02: await add("02"),
    s03: await add("03"),
    s04: await add("04", { status: "on_leave" }),
    s05: await add("05"),
    s06: await add("06"),
  };
  const groupId = await addTestGroup(db, programId, {
    number: 1,
    memberIds: [ids.s01, ids.s02, ids.s03, ids.s04],
    mentorId: mentor.id,
  });
  const otherGroupId = await addTestGroup(db, programId, {
    number: 2,
    memberIds: [ids.s05, ids.s06],
    mentorId: other.id,
  });
  return { mentor, other, spare, ids, groupId, otherGroupId };
}

async function load(
  db: Database,
  account: AccountForAccess,
): Promise<MenteeDashboard> {
  const scope = menteeScopeOf(account);
  if (scope === null)
    throw new Error("The account has no Dashboard anak asuh.");
  return loadMenteeDashboard(db, scope);
}

function shown(view: MenteeDashboard) {
  if (view.kind !== "shown") throw new Error("Dashboard anak asuh is empty.");
  return view;
}

describe("Dashboard anak asuh", () => {
  it("counts the Aktif anak asuh of the mentor's own group only", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addRecords(db);

      const view = shown(await load(db, mentor));

      expect(view.students).toBe(3);
      expect(view.groups.map((group) => group.number)).toEqual([1]);
    });
  });

  it("shows nothing but the message to a Pengasuh without a group", async () => {
    await inTestDatabase(async (db) => {
      const { spare } = await addRecords(db);

      expect(await load(db, spare)).toEqual({ kind: "no_group" });
    });
  });

  it("keeps a person who is also Kepala Unit to their own anak asuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addRecords(db);
      const both: AccountForAccess = {
        ...mentor,
        roles: ["mentor", "head_of_unit"],
      };

      const view = shown(await load(db, both));

      expect(view.students).toBe(3);
    });
  });

  it("leaves out on the next load a student who left the group, and a group handed to another Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, other, ids, groupId } = await addRecords(db);
      await db
        .delete(mentorGroupMembers)
        .where(eq(mentorGroupMembers.studentId, ids.s01));

      expect(shown(await load(db, mentor)).students).toBe(2);

      await replaceTestMentor(db, groupId, other.id, "5170-10-01");

      expect(await load(db, mentor)).toEqual({ kind: "no_group" });
      expect(shown(await load(db, other)).students).toBe(4);
    });
  });

  it("refuses a Pengasuh the detail of a student who is not their anak asuh", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addRecords(db);

      const own = await readStudentDetail(db, mentor, ids.s01, ODD_5170);
      const notOwn = await readStudentDetail(db, mentor, ids.s05, ODD_5170);

      expect(own.kind).toBe("found");
      expect(notOwn.kind).toBe("not_found");
    });
  });
});
