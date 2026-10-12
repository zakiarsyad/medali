import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, students, studyPrograms } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { findActiveAccount } from "./accounts";
import type { RoleId } from "./role-ids";

const inTestDatabase = withTestDatabase();

async function addAccount(
  db: Database,
  roles: RoleId[],
  deletedAt: Date | null = null,
): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji", deletedAt })
    .returning();
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return account.id;
}

describe("findActiveAccount", () => {
  it("finds an account with all its roles in role order", async () => {
    await inTestDatabase(async (db) => {
      const id = await addAccount(db, ["assessor", "mentor"]);
      const account = await findActiveAccount(db, id);
      expect(account?.roles).toEqual(["mentor", "assessor"]);
    });
  });

  it("carries no address, so no screen gets one from the signed-in account", async () => {
    await inTestDatabase(async (db) => {
      const email = "profil.uji@kampus.example";
      const [program] = await db
        .insert(studyPrograms)
        .values({ name: "Prodi Uji Profil" })
        .returning();
      const [student] = await db
        .insert(students)
        .values({
          nim: "9900000801",
          name: "Profil Uji",
          studyProgramId: program?.id ?? 0,
          entryPath: "regular",
          sex: "female",
          cohortYear: 2026,
        })
        .returning();
      const [added] = await db
        .insert(accounts)
        .values({ name: "Profil Uji", studentId: student?.id, email })
        .returning();
      await db
        .insert(accountRoles)
        .values({ accountId: added?.id ?? "", role: "student" });

      const account = await findActiveAccount(db, added?.id ?? "");

      expect(account?.studentId).toBe(student?.id);
      expect(account).not.toHaveProperty("email");
      expect(JSON.stringify(account)).not.toContain(email);
    });
  });

  it("does not find a removed account", async () => {
    await inTestDatabase(async (db) => {
      const id = await addAccount(db, ["mentor"], new Date());
      expect(await findActiveAccount(db, id)).toBeNull();
    });
  });

  it("does not find an id that is not an account id", async () => {
    await inTestDatabase(async (db) => {
      expect(await findActiveAccount(db, "not-an-id")).toBeNull();
    });
  });
});
