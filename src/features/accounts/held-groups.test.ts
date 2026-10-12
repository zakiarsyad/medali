import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rolesByAccount } from "@/auth/accounts";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { accountRoles, accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  holdsGroupToday,
  REMOVAL_REFUSED_FOR_GROUP,
  ROLE_REFUSED_FOR_GROUP,
  takesMentorRole,
} from "./held-groups";
import { changeRoles, removeAccount } from "./manage-accounts";
import type { ManagedRole } from "./managed-roles";
import {
  addTestGroupHeldBy,
  addTestManager,
  addTestProgram,
  roleLogOf,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Pengasuh Berkelompok";
const REPLACED_ON = "2026-10-01";

async function addStaff(db: Database, roles: RoleId[]): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Pengasuh Uji", unit: "Unit Uji" })
    .returning({ id: accounts.id });
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return account.id;
}

/** A mentor with a group: held today, or only before when `endsOn` is given. */
async function addMentorWithGroup(
  db: Database,
  roles: RoleId[] = ["mentor"],
  endsOn: string | null = null,
) {
  const manager = await addTestManager(db);
  const mentorId = await addStaff(db, roles);
  const program = await addTestProgram(db, PROGRAM);
  await addTestGroupHeldBy(db, program, mentorId, endsOn);
  return { by: manager.id, mentorId };
}

async function rolesOf(db: Database, accountId: string): Promise<RoleId[]> {
  const roles = await rolesByAccount(db, [accountId]);
  return roles.get(accountId) ?? [];
}

async function storedAccount(db: Database, accountId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));
  return account;
}

function rolesChange(accountId: string, roles: ManagedRole[]) {
  return { accountId, roles, studyProgramId: null, unit: "Unit Lain" };
}

describe("takesMentorRole", () => {
  it("is true when Pengasuh is among the roles before and not after", () => {
    expect(takesMentorRole(["mentor", "assessor"], ["assessor"])).toBe(true);
  });

  it("is false when Pengasuh stays", () => {
    expect(takesMentorRole(["mentor"], ["mentor", "assessor"])).toBe(false);
  });

  it("is false when the account was no Pengasuh", () => {
    expect(takesMentorRole(["assessor"], ["counsellor"])).toBe(false);
    expect(takesMentorRole(["assessor"], ["mentor"])).toBe(false);
  });
});

describe("holdsGroupToday", () => {
  it("is true for the mentor of today of a group", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId } = await addMentorWithGroup(db);

      expect(await holdsGroupToday(db, mentorId)).toBe(true);
    });
  });

  it("is false for a mentor who held a group before only", async () => {
    await inTestDatabase(async (db) => {
      const { mentorId } = await addMentorWithGroup(
        db,
        ["mentor"],
        REPLACED_ON,
      );

      expect(await holdsGroupToday(db, mentorId)).toBe(false);
    });
  });

  it("is false for a mentor without a group, also while another holds one", async () => {
    await inTestDatabase(async (db) => {
      await addMentorWithGroup(db);
      const other = await addStaff(db, ["mentor"]);

      expect(await holdsGroupToday(db, other)).toBe(false);
    });
  });
});

describe("removeAccount on a mentor", () => {
  it("refuses one who holds a group today, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { by, mentorId } = await addMentorWithGroup(db);

      const removed = await removeAccount(db, mentorId, by);

      expect(removed).toEqual({ ok: false, error: REMOVAL_REFUSED_FOR_GROUP });
      expect((await storedAccount(db, mentorId))?.deletedAt).toBeNull();
      expect(await rolesOf(db, mentorId)).toEqual(["mentor"]);
      expect(await roleLogOf(db, mentorId)).toEqual([]);
    });
  });

  it("says to replace the mentor first", () => {
    expect(REMOVAL_REFUSED_FOR_GROUP).toContain("Ganti pengasuh");
    expect(ROLE_REFUSED_FOR_GROUP).toContain("Ganti pengasuh");
  });

  it("removes one who held a group before only", async () => {
    await inTestDatabase(async (db) => {
      const { by, mentorId } = await addMentorWithGroup(
        db,
        ["mentor"],
        REPLACED_ON,
      );

      expect(await removeAccount(db, mentorId, by)).toEqual({
        ok: true,
        value: null,
      });
      expect((await storedAccount(db, mentorId))?.deletedAt).not.toBeNull();
    });
  });

  it("removes one who never held a group", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestManager(db);
      const mentorId = await addStaff(db, ["mentor"]);

      const removed = await removeAccount(db, mentorId, manager.id);

      expect(removed.ok).toBe(true);
    });
  });
});

describe("changeRoles on a mentor", () => {
  it("refuses to take the Pengasuh role from one who holds a group today, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { by, mentorId } = await addMentorWithGroup(db);

      const changed = await changeRoles(
        db,
        rolesChange(mentorId, ["assessor"]),
        by,
      );

      expect(changed).toEqual({ ok: false, error: ROLE_REFUSED_FOR_GROUP });
      expect(await rolesOf(db, mentorId)).toEqual(["mentor"]);
      expect((await storedAccount(db, mentorId))?.unit).toBe("Unit Uji");
      expect(await roleLogOf(db, mentorId)).toEqual([]);
    });
  });

  it("gives and takes other roles while the Pengasuh role stays", async () => {
    await inTestDatabase(async (db) => {
      const { by, mentorId } = await addMentorWithGroup(db, [
        "mentor",
        "counsellor",
      ]);

      const changed = await changeRoles(
        db,
        rolesChange(mentorId, ["mentor", "assessor"]),
        by,
      );

      expect(changed).toEqual({ ok: true, value: ["mentor", "assessor"] });
      expect(await rolesOf(db, mentorId)).toEqual(["mentor", "assessor"]);
    });
  });

  it("takes the Pengasuh role from one who held a group before only", async () => {
    await inTestDatabase(async (db) => {
      const { by, mentorId } = await addMentorWithGroup(
        db,
        ["mentor"],
        REPLACED_ON,
      );

      const changed = await changeRoles(
        db,
        rolesChange(mentorId, ["assessor"]),
        by,
      );

      expect(changed).toEqual({ ok: true, value: ["assessor"] });
    });
  });
});
