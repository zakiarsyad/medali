import { beforeAll, describe, expect, it } from "vitest";
import { rolesByAccount } from "@/auth/accounts";
import type { RoleId } from "@/auth/role-ids";
import { type Save, withOwnTestDatabase } from "@/db/test-database-at-once";
import type { Parsed } from "@/parsed";
import { changeRoles, removeAccount } from "./manage-accounts";
import type { ManagedRole } from "./managed-roles";
import { addTestManager, addTestStaffAccount, roleLogOf } from "./test-records";

/*
 * The log of role changes cannot be emptied, so no rows are removed after
 * a check: each check adds an account of its own, and the database is
 * dropped at the end.
 */
const own = withOwnTestDatabase("staff");

type AccountSave = Save<Parsed<RoleId[] | null>>;

const NOT_FOUND = { ok: false, error: "Akun tidak ditemukan." };

let head: string;

beforeAll(async () => {
  head = (await addTestManager(own.db)).id;
});

function addCounsellor(name: string): Promise<string> {
  return addTestStaffAccount(own.db, name, ["counsellor"]);
}

function save(accountId: string, roles: ManagedRole[]): AccountSave {
  return (db) =>
    changeRoles(
      db,
      { accountId, roles, studyProgramId: null, unit: null },
      head,
    );
}

function remove(accountId: string): AccountSave {
  return (db) => removeAccount(db, accountId, head);
}

async function savedRoles(accountId: string): Promise<RoleId[]> {
  const roles = await rolesByAccount(own.db, [accountId]);
  return roles.get(accountId) ?? [];
}

async function logLines(accountId: string) {
  const log = await roleLogOf(own.db, accountId);
  return log.map((line) => ({
    action: line.action,
    before: line.rolesBefore,
    after: line.rolesAfter,
  }));
}

describe("two changes to one staff account sent at the same moment", () => {
  it("ends with the roles of the save taken last, and a log that follows", async () => {
    const accountId = await addCounsellor("Serentak Uji Dua Simpan");

    const both = await own.atOnce(
      save(accountId, ["mentor"]),
      save(accountId, ["discipline_officer", "assessor"]),
    );

    expect(both.sooner).toEqual({ ok: true, value: ["mentor"] });
    expect(both.later).toEqual({
      ok: true,
      value: ["discipline_officer", "assessor"],
    });
    expect(await savedRoles(accountId)).toEqual([
      "discipline_officer",
      "assessor",
    ]);
    expect(await logLines(accountId)).toEqual([
      { action: "roles_changed", before: ["counsellor"], after: ["mentor"] },
      {
        action: "roles_changed",
        before: ["mentor"],
        after: ["discipline_officer", "assessor"],
      },
    ]);
  });

  it("refuses a save that comes after the removal", async () => {
    const accountId = await addCounsellor("Serentak Uji Hapus Simpan");

    const both = await own.atOnce(
      remove(accountId),
      save(accountId, ["mentor"]),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(NOT_FOUND);
    expect(await savedRoles(accountId)).toEqual(["counsellor"]);
    expect(await logLines(accountId)).toEqual([
      { action: "removed", before: ["counsellor"], after: [] },
    ]);
  });

  it("logs a removal that comes after a save with the roles that save gave", async () => {
    const accountId = await addCounsellor("Serentak Uji Simpan Hapus");

    const both = await own.atOnce(
      save(accountId, ["mentor"]),
      remove(accountId),
    );

    expect(both.later).toEqual({ ok: true, value: null });
    expect(await logLines(accountId)).toEqual([
      { action: "roles_changed", before: ["counsellor"], after: ["mentor"] },
      { action: "removed", before: ["mentor"], after: [] },
    ]);
  });

  it("lets a manager save another account while their own roles are being saved", async () => {
    const manager = await addTestStaffAccount(own.db, "Serentak Uji Kepala", [
      "head_of_unit",
      "mentor",
    ]);
    const accountId = await addCounsellor("Serentak Uji Staf Lain");
    const WAITING = "waiting";

    const saved = await own.db.transaction(async (tx) => {
      await save(manager, ["assessor"])(tx);
      return Promise.race([
        changeRoles(
          own.otherDb,
          { accountId, roles: ["mentor"], studyProgramId: null, unit: null },
          manager,
        ),
        new Promise((resolve) => setTimeout(resolve, 2000, WAITING)),
      ]);
    });

    expect(saved).toEqual({ ok: true, value: ["mentor"] });
  });

  it("removes the account once when Hapus is confirmed twice", async () => {
    const accountId = await addCounsellor("Serentak Uji Dua Hapus");

    const both = await own.atOnce(remove(accountId), remove(accountId));

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(NOT_FOUND);
    expect(await logLines(accountId)).toHaveLength(1);
  });
});
