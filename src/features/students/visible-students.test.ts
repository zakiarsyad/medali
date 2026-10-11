import { describe, expect, it } from "vitest";
import { type AccountForAccess, mayOpenPage, rowLimitFor } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "./test-records";
import { visibleTo } from "./visible-students";

const inTestDatabase = withTestDatabase();

/** How the NIMs of these checks start, to tell them from other rows. */
const TEST_NIMS = "99000003";

const MAY_OPEN: RoleId[] = ["head_of_unit", "director", "head_of_program"];

function account(
  roles: RoleId[],
  more: Partial<AccountForAccess> = {},
): AccountForAccess {
  const id = "00000000-0000-4000-8000-000000000001";
  return { id, roles, studyProgramId: null, studentId: null, ...more };
}

interface TestRows {
  ownProgram: number;
  ownId: string;
}

/** Two programs with one student each, and one removed student. */
async function addTestRows(db: Database): Promise<TestRows> {
  const ownProgram = await addTestProgram(db, "Prodi Uji Sendiri");
  const otherProgram = await addTestProgram(db, "Prodi Uji Lain");
  const ownId = await addTestStudent(db, ownProgram, {
    nim: "9900000301",
    name: "Tampak Uji Sendiri",
  });
  await addTestStudent(db, otherProgram, {
    nim: "9900000302",
    name: "Tampak Uji Lain",
  });
  await addTestStudent(db, ownProgram, {
    nim: "9900000303",
    name: "Tampak Uji Dihapus",
    deletedAt: new Date("2026-10-11T03:00:00Z"),
  });
  return { ownProgram, ownId };
}

async function nimsSeenBy(
  db: Database,
  viewer: AccountForAccess,
): Promise<string[]> {
  const rows = await db
    .select({ nim: students.nim })
    .from(students)
    .where(visibleTo(rowLimitFor(viewer)));
  const nims = rows.map((row) => row.nim);
  return nims.filter((nim) => nim.startsWith(TEST_NIMS)).sort();
}

describe("the Mahasiswa page", () => {
  it.each(MAY_OPEN)("opens for %s", (role) => {
    expect(mayOpenPage([role], "students")).toBe(true);
  });

  it("is refused to every other role", () => {
    const others = ROLE_IDS.filter((role) => !MAY_OPEN.includes(role));
    expect(others.length).toBeGreaterThan(0);
    for (const role of others) {
      expect(mayOpenPage([role], "students")).toBe(false);
    }
  });
});

describe("visibleTo", () => {
  it.each(["head_of_unit", "director"] as const)(
    "shows %s every student that is not removed",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addTestRows(db);

        expect(await nimsSeenBy(db, account([role]))).toEqual([
          "9900000301",
          "9900000302",
        ]);
      });
    },
  );

  it("shows Ketua Program Studi only their own program studi", async () => {
    await inTestDatabase(async (db) => {
      const { ownProgram } = await addTestRows(db);
      const head = account(["head_of_program"], { studyProgramId: ownProgram });

      expect(await nimsSeenBy(db, head)).toEqual(["9900000301"]);
    });
  });

  it("shows nobody to Ketua Program Studi without a program studi", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect(await nimsSeenBy(db, account(["head_of_program"]))).toEqual([]);
    });
  });

  it("shows a student only themselves", async () => {
    await inTestDatabase(async (db) => {
      const { ownId } = await addTestRows(db);
      const student = account(["student"], { studentId: ownId });

      expect(await nimsSeenBy(db, student)).toEqual(["9900000301"]);
    });
  });

  it("shows nobody to Pengasuh while no mentees are kept", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect(await nimsSeenBy(db, account(["mentor"]))).toEqual([]);
    });
  });
});
