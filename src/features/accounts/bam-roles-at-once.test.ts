import { beforeAll, describe, expect, it } from "vitest";
import { rolesByAccount } from "@/auth/accounts";
import type { BamRole } from "@/auth/bam-roles";
import type { RoleId } from "@/auth/role-ids";
import { type Save, withOwnTestDatabase } from "@/db/test-database-at-once";
import type { Parsed } from "@/parsed";
import { changeBamRoles, removeBamRoles } from "./change-bam-roles";
import { giveBamRoles } from "./give-bam-roles";
import { listBamStudents } from "./list-bam-students";
import type { Manager } from "./save-bam-roles";
import {
  addTestManager,
  addTestProgram,
  addTestStudentAccount,
  roleLogOf,
} from "./test-records";

/*
 * The log of role changes cannot be emptied, so no rows are removed after
 * a check: each check adds a student of its own, and the database is
 * dropped at the end.
 */
const own = withOwnTestDatabase("bam");

type RoleSave = Save<Parsed<string>>;

let manager: Manager;
let program: number;

beforeAll(async () => {
  manager = await addTestManager(own.db);
  program = await addTestProgram(own.db, "Prodi Uji BAM Serentak");
});

function addStudent(nim: string, roles?: RoleId[]): Promise<string> {
  const name = `Serentak Uji ${nim}`;
  return addTestStudentAccount(own.db, program, { nim, name }, roles);
}

function give(accountId: string, roles: BamRole[]): RoleSave {
  return (db) => giveBamRoles(db, manager, { accountId, roles });
}

function change(accountId: string, roles: BamRole[]): RoleSave {
  return (db) => changeBamRoles(db, manager, { accountId, roles });
}

function remove(accountId: string): RoleSave {
  return (db) => removeBamRoles(db, manager, accountId);
}

async function savedRoles(accountId: string): Promise<RoleId[]> {
  const roles = await rolesByAccount(own.db, [accountId]);
  return roles.get(accountId) ?? [];
}

async function rowsOf(accountId: string): Promise<number> {
  const list = await listBamStudents(own.db, 0);
  return list.students.filter((row) => row.accountId === accountId).length;
}

describe("the same change to a student's BAM roles sent twice at the same moment", () => {
  it("adds a student once when 'Simpan peran' is pressed twice", async () => {
    const accountId = await addStudent("9912860001");
    const save = give(accountId, ["bam_bphk", "bam_health"]);

    const both = await own.atOnce(save, save);

    expect(both.sooner.ok).toBe(true);
    expect(both.later.ok).toBe(true);
    expect(await rowsOf(accountId)).toBe(1);
    expect(await savedRoles(accountId)).toEqual([
      "student",
      "bam_bphk",
      "bam_health",
    ]);
    expect(await roleLogOf(own.db, accountId)).toHaveLength(1);
  });

  it("keeps both sets of roles when one student is added twice with other roles", async () => {
    const accountId = await addStudent("9912860002");

    const both = await own.atOnce(
      give(accountId, ["bam_bphk"]),
      give(accountId, ["bam_catering"]),
    );

    expect(both.later.ok).toBe(true);
    expect(await rowsOf(accountId)).toBe(1);
    expect(await savedRoles(accountId)).toEqual([
      "student",
      "bam_bphk",
      "bam_catering",
    ]);
    const log = await roleLogOf(own.db, accountId);
    expect(log.map((line) => line.rolesBefore)).toEqual([
      ["student"],
      ["student", "bam_bphk"],
    ]);
  });

  it("changes the roles once when 'Simpan peran' of Edit peran is pressed twice", async () => {
    const accountId = await addStudent("9912860003", ["student", "bam_bphk"]);
    const save = change(accountId, ["bam_health"]);

    const both = await own.atOnce(save, save);

    expect(both.later.ok).toBe(true);
    expect(await rowsOf(accountId)).toBe(1);
    expect(await savedRoles(accountId)).toEqual(["student", "bam_health"]);
    expect(await roleLogOf(own.db, accountId)).toHaveLength(1);
  });

  it("takes the roles away once when Hapus is confirmed twice", async () => {
    const accountId = await addStudent("9912860004", ["student", "bam_bphk"]);

    const both = await own.atOnce(remove(accountId), remove(accountId));

    expect(both.later.ok).toBe(true);
    expect(await rowsOf(accountId)).toBe(0);
    expect(await savedRoles(accountId)).toEqual(["student"]);
    expect(await roleLogOf(own.db, accountId)).toHaveLength(1);
  });
});
