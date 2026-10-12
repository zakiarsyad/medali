import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  may,
  mayOpenPage,
  mayOpenTab,
  needsDormResident,
  tabsFor,
} from "@/auth/access";
import { accountsInRoleOrder, findActiveAccount } from "@/auth/accounts";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accounts, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { removeBamRoles } from "./change-bam-roles";
import { giveBamRoles } from "./give-bam-roles";
import { listBamStudents } from "./list-bam-students";
import {
  addTestManager,
  addTestProgram,
  addTestStudentAccount,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Henti BAM";
const RANI = { nim: "9912800501", name: "Rani Uji Henti" };

/** A student who was given BAM - BPHK on screen. */
async function addBamStudent(db: Database): Promise<string> {
  const manager = await addTestManager(db);
  const program = await addTestProgram(db, PROGRAM);
  const accountId = await addTestStudentAccount(db, program, RANI);
  await giveBamRoles(db, manager, { accountId, roles: ["bam_bphk"] });
  return accountId;
}

async function rolesAtNextRequest(
  db: Database,
  accountId: string,
): Promise<RoleId[]> {
  const account = await findActiveAccount(db, accountId);
  if (!account) throw new Error("The account is not active.");
  return account.roles;
}

/** What only a BAM role opens: nothing of it may be left to a student. */
function expectNoBamAccess(roles: RoleId[]): void {
  expect(roles).toEqual(["student"]);
  expect(may(roles, "view_dorm_rooms")).toBe(false);
  expect(mayOpenTab(roles, "dorm", "overview")).toBe(false);
  expect(mayOpenTab(roles, "dorm", "rooms")).toBe(false);
  expect(tabsFor(roles, "dorm")).toEqual(tabsFor(["student"], "dorm"));
  // Asrama is left only as the student's own page, for a dorm resident.
  expect(needsDormResident(roles, "dorm")).toBe(true);
}

describe("a student with a BAM role", () => {
  it("opens their own pages and the pages of the BAM role together", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBamStudent(db);

      const roles = await rolesAtNextRequest(db, accountId);

      expect(roles).toEqual(["student", "bam_bphk"]);
      expect(mayOpenPage(roles, "profile")).toBe(true);
      expect(mayOpenTab(roles, "dorm", "overview")).toBe(true);
      expect(may(roles, "view_dorm_rooms")).toBe(true);
      expect(needsDormResident(roles, "dorm")).toBe(false);
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "loses the BAM pages at once when they become %s, also by a hand-made request",
    async (status) => {
      await inTestDatabase(async (db) => {
        const accountId = await addBamStudent(db);

        await db
          .update(students)
          .set({ status })
          .where(eq(students.nim, RANI.nim));

        expectNoBamAccess(await rolesAtNextRequest(db, accountId));
      });
    },
  );

  it("is not offered with the BAM role in Ganti peran once on Cuti", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBamStudent(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.nim, RANI.nim));

      const offered = await accountsInRoleOrder(db);

      const own = offered.find((account) => account.id === accountId);
      expect(own?.roles).toEqual(["student"]);
    });
  });

  it("stays in the panel, marked as not active, until the roles are removed", async () => {
    await inTestDatabase(async (db) => {
      await addBamStudent(db);
      await db
        .update(students)
        .set({ status: "inactive" })
        .where(eq(students.nim, RANI.nim));

      const listed = await listBamStudents(db, 0);

      expect(listed.students).toMatchObject([
        { nim: RANI.nim, roles: ["bam_bphk"], isActive: false },
      ]);
    });
  });

  it("has no working account once removed, and stays in the panel as not active", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBamStudent(db);
      const at = new Date();

      await db
        .update(students)
        .set({ deletedAt: at })
        .where(eq(students.nim, RANI.nim));
      await db
        .update(accounts)
        .set({ deletedAt: at })
        .where(eq(accounts.id, accountId));

      expect(await findActiveAccount(db, accountId)).toBeNull();
      expect((await listBamStudents(db, 0)).students).toMatchObject([
        { nim: RANI.nim, roles: ["bam_bphk"], isActive: false },
      ]);
    });
  });

  it("gets the BAM pages back when they are Aktif again", async () => {
    await inTestDatabase(async (db) => {
      const accountId = await addBamStudent(db);
      const setStatus = (status: "on_leave" | "active") =>
        db.update(students).set({ status }).where(eq(students.nim, RANI.nim));
      await setStatus("on_leave");

      await setStatus("active");

      expect(await rolesAtNextRequest(db, accountId)).toEqual([
        "student",
        "bam_bphk",
      ]);
    });
  });
});

describe("a student whose BAM role was taken away", () => {
  it("has lost the BAM pages on the next page, also by a hand-made request", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const accountId = await addBamStudent(db);

      await removeBamRoles(db, manager, accountId);

      expectNoBamAccess(await rolesAtNextRequest(db, accountId));
    });
  });
});
