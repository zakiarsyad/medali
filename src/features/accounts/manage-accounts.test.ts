import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accountsInRoleOrder, findActiveAccount } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { accounts, roleChanges } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addAccount,
  changeRoles,
  listManagedAccounts,
  removeAccount,
} from "./manage-accounts";
import {
  addTestProgram,
  addTestStaffAccount,
  addTestStudentAccount,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "Prodi Uji Daftar Staf";

async function addHead(db: Database): Promise<string> {
  return addTestStaffAccount(db, "Kepala Uji", ["head_of_unit"]);
}

function newAccount(email: string) {
  return {
    name: "Pengguna Uji",
    title: null,
    nip: null,
    email,
    roles: ["mentor" as const],
    studyProgramId: null,
    unit: null,
  };
}

async function logOf(db: Database, accountId: string) {
  return db
    .select()
    .from(roleChanges)
    .where(eq(roleChanges.accountId, accountId));
}

describe("addAccount", () => {
  it("adds the account with its roles and logs who added it", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const added = await addAccount(db, newAccount("uji1@contoh.ac.id"), head);
      if (!added.ok) throw new Error(added.error);

      const account = await findActiveAccount(db, added.value);
      expect(account?.roles).toEqual(["mentor"]);
      const [line] = await logOf(db, added.value);
      expect(line).toMatchObject({
        changedBy: head,
        action: "added",
        rolesBefore: [],
        rolesAfter: ["mentor"],
      });
    });
  });

  it("refuses an email another active account uses", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      await addAccount(db, newAccount("uji2@contoh.ac.id"), head);
      const again = await addAccount(db, newAccount("uji2@contoh.ac.id"), head);
      expect(again).toEqual({
        ok: false,
        error: "Email sudah dipakai akun lain.",
      });
    });
  });

  it("leaves nothing of the refused account behind", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      await addAccount(db, newAccount("uji2@contoh.ac.id"), head);

      await addAccount(db, newAccount("uji2@contoh.ac.id"), head);

      const kept = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.email, "uji2@contoh.ac.id"));
      expect(kept).toHaveLength(1);
    });
  });

  it("lets the email of a removed account be given again", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const first = await addAccount(db, newAccount("uji3@contoh.ac.id"), head);
      if (!first.ok) throw new Error(first.error);
      await removeAccount(db, first.value, head);

      const again = await addAccount(db, newAccount("uji3@contoh.ac.id"), head);

      expect(again.ok).toBe(true);
    });
  });
});

describe("changeRoles", () => {
  it("gives and takes roles, and logs who, when, before and after", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Staf Uji", [
        "mentor",
        "counsellor",
      ]);

      const changed = await changeRoles(
        db,
        {
          accountId: id,
          roles: ["mentor", "assessor"],
          studyProgramId: null,
          unit: null,
        },
        head,
      );

      expect(changed.ok).toBe(true);
      expect((await findActiveAccount(db, id))?.roles).toEqual([
        "mentor",
        "assessor",
      ]);
      const [line] = await logOf(db, id);
      expect(line).toMatchObject({
        changedBy: head,
        action: "roles_changed",
        rolesBefore: ["mentor", "counsellor"],
        rolesAfter: ["mentor", "assessor"],
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("keeps roles that are not managed in Pengguna dan peran", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Kepala Uji Dua", [
        "head_of_unit",
        "mentor",
      ]);

      await changeRoles(
        db,
        {
          accountId: id,
          roles: ["assessor"],
          studyProgramId: null,
          unit: null,
        },
        head,
      );

      expect((await findActiveAccount(db, id))?.roles).toEqual([
        "head_of_unit",
        "assessor",
      ]);
    });
  });

  it("writes no log line when the roles stay the same", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Staf Uji", ["mentor"]);
      await changeRoles(
        db,
        {
          accountId: id,
          roles: ["mentor"],
          studyProgramId: null,
          unit: "Unit Baru",
        },
        head,
      );
      expect(await logOf(db, id)).toEqual([]);
    });
  });

  it("times each log line when it is written, so lines of one moment keep their order", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Staf Uji", ["mentor"]);
      const change = { accountId: id, studyProgramId: null, unit: null };

      await changeRoles(db, { ...change, roles: ["assessor"] }, head);
      await removeAccount(db, id, head);

      // Compared in the database: it keeps a finer time than a Date holds.
      const [times] = await db
        .select({
          removedLater: sql<boolean>`max(${roleChanges.changedAt}) filter (where ${roleChanges.action} = 'removed') > max(${roleChanges.changedAt}) filter (where ${roleChanges.action} = 'roles_changed')`,
        })
        .from(roleChanges)
        .where(eq(roleChanges.accountId, id));
      expect(times?.removedLater).toBe(true);
    });
  });

  it("refuses a removed account", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Staf Uji", ["mentor"]);
      await removeAccount(db, id, head);
      const changed = await changeRoles(
        db,
        {
          accountId: id,
          roles: ["assessor"],
          studyProgramId: null,
          unit: null,
        },
        head,
      );
      expect(changed).toEqual({ ok: false, error: "Akun tidak ditemukan." });
    });
  });
});

describe("removeAccount", () => {
  it("hides the account from the list and from Ganti peran, but keeps it", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Staf Dihapus Uji", ["mentor"]);

      const removed = await removeAccount(db, id, head);

      expect(removed.ok).toBe(true);
      const listed = await listManagedAccounts(db, {
        query: "Dihapus Uji",
        role: null,
        page: 0,
      });
      expect(listed.accounts).toEqual([]);
      const switchable = await accountsInRoleOrder(db);
      expect(switchable.map((account) => account.id)).not.toContain(id);
      const [kept] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, id));
      expect(kept?.deletedBy).toBe(head);
      expect(kept?.deletedAt).toBeInstanceOf(Date);
      const [line] = await logOf(db, id);
      expect(line).toMatchObject({
        action: "removed",
        rolesBefore: ["mentor"],
        rolesAfter: [],
      });
    });
  });
});

describe("an unknown study program", () => {
  const UNKNOWN_PROGRAM = 2_000_000_000;
  const refusal = { ok: false, error: "Program studi tidak dikenal." };

  it("is refused when adding a head of program", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const added = await addAccount(
        db,
        {
          ...newAccount("uji3@contoh.ac.id"),
          roles: ["head_of_program"],
          studyProgramId: UNKNOWN_PROGRAM,
        },
        head,
      );
      expect(added).toEqual(refusal);
    });
  });

  it("is refused when changing roles", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Staf Uji", ["mentor"]);
      const changed = await changeRoles(
        db,
        {
          accountId: id,
          roles: ["head_of_program"],
          studyProgramId: UNKNOWN_PROGRAM,
          unit: null,
        },
        head,
      );
      expect(changed).toEqual(refusal);
    });
  });
});

describe("changeRoles on a Kepala Unit account", () => {
  it("may take away every managed role, keeping Kepala Unit", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Kepala Lain Uji", [
        "head_of_unit",
        "mentor",
      ]);

      const changed = await changeRoles(
        db,
        { accountId: id, roles: [], studyProgramId: null, unit: null },
        head,
      );

      expect(changed).toEqual({ ok: true, value: ["head_of_unit"] });
    });
  });

  it("refuses to leave an account with no role at all", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const id = await addTestStaffAccount(db, "Staf Uji", ["mentor"]);

      const changed = await changeRoles(
        db,
        { accountId: id, roles: [], studyProgramId: null, unit: null },
        head,
      );

      expect(changed).toEqual({
        ok: false,
        error: "Pilih minimal satu peran.",
      });
    });
  });
});

describe("a student's account in the staff list's changes", () => {
  it("is refused a staff role by Edit peran", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const program = await addTestProgram(db, PROGRAM);
      const id = await addTestStudentAccount(
        db,
        program,
        { nim: "9912800103", name: "Mahasiswa Uji Staf" },
        ["student", "bam_bphk"],
      );

      const changed = await changeRoles(
        db,
        { accountId: id, roles: ["mentor"], studyProgramId: null, unit: null },
        head,
      );

      expect(changed).toEqual({
        ok: false,
        error:
          "Akun ini tidak dikelola di sini, sehingga perannya tidak bisa diubah.",
      });
      expect((await findActiveAccount(db, id))?.roles).toEqual([
        "student",
        "bam_bphk",
      ]);
      expect(await logOf(db, id)).toEqual([]);
    });
  });

  it("is not removed by Hapus, even with only roles managed there", async () => {
    await inTestDatabase(async (db) => {
      const head = await addHead(db);
      const program = await addTestProgram(db, PROGRAM);
      const id = await addTestStudentAccount(
        db,
        program,
        { nim: "9912800104", name: "Mahasiswa Uji Hapus" },
        ["bam_bphk"],
      );

      const removed = await removeAccount(db, id, head);

      expect(removed).toEqual({
        ok: false,
        error: "Akun ini tidak dikelola di sini, sehingga tidak bisa dihapus.",
      });
      expect(await findActiveAccount(db, id)).not.toBeNull();
    });
  });
});

describe("removeAccount refuses", () => {
  it.each([
    ["a Kepala Unit account", ["head_of_unit", "mentor"]],
    ["a student account", ["student", "bam_bphk"]],
  ] as const)(
    "%s, whose roles are not all managed here",
    async (_kind, roles) => {
      await inTestDatabase(async (db) => {
        const head = await addHead(db);
        const id = await addTestStaffAccount(db, "Tidak Dikelola Uji", [
          ...roles,
        ]);

        const removed = await removeAccount(db, id, head);

        expect(removed).toEqual({
          ok: false,
          error:
            "Akun ini tidak dikelola di sini, sehingga tidak bisa dihapus.",
        });
        expect(await findActiveAccount(db, id)).not.toBeNull();
      });
    },
  );

  it("the manager's own account", async () => {
    await inTestDatabase(async (db) => {
      const id = await addTestStaffAccount(db, "Pengelola Uji", ["mentor"]);

      const removed = await removeAccount(db, id, id);

      expect(removed).toEqual({
        ok: false,
        error: "Akun Anda sendiri tidak bisa dihapus.",
      });
      expect(await findActiveAccount(db, id)).not.toBeNull();
    });
  });
});

describe("listManagedAccounts", () => {
  it("lists every staff account, Kepala Unit included, with its roles", async () => {
    await inTestDatabase(async (db) => {
      await addTestStaffAccount(db, "Daftar Uji Satu", ["mentor", "assessor"]);
      await addTestStaffAccount(db, "Daftar Uji Kepala", ["head_of_unit"]);

      const listed = await listManagedAccounts(db, {
        query: "daftar uji",
        role: null,
        page: 0,
      });

      expect(listed.total).toBe(2);
      expect(listed.accounts.map((account) => account.roles)).toEqual([
        ["head_of_unit"],
        ["mentor", "assessor"],
      ]);
    });
  });

  it("leaves every student's account out, also one with a BAM role", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, PROGRAM);
      await addTestStudentAccount(db, program, {
        nim: "9912800101",
        name: "Daftar Uji Mahasiswa",
      });
      await addTestStudentAccount(
        db,
        program,
        { nim: "9912800102", name: "Daftar Uji BAM" },
        ["student", "bam_bphk"],
      );
      await addTestStaffAccount(db, "Daftar Uji Staf BAM", ["bam_bphk"]);

      const listed = await listManagedAccounts(db, {
        query: "daftar uji",
        role: null,
        page: 0,
      });

      expect(listed.accounts.map((account) => account.name)).toEqual([
        "Daftar Uji Staf BAM",
      ]);
    });
  });

  it("filters by role", async () => {
    await inTestDatabase(async (db) => {
      await addTestStaffAccount(db, "Saring Uji Satu", ["mentor"]);
      await addTestStaffAccount(db, "Saring Uji Dua", ["assessor"]);

      const listed = await listManagedAccounts(db, {
        query: "saring uji",
        role: "assessor",
        page: 0,
      });

      expect(listed.accounts.map((account) => account.name)).toEqual([
        "Saring Uji Dua",
      ]);
    });
  });

  it("shows the last page of the search and the filter when asked for one past the end", async () => {
    await inTestDatabase(async (db) => {
      for (let index = 1; index <= 27; index += 1) {
        const number = String(index).padStart(2, "0");
        await addTestStaffAccount(db, `Halaman Uji ${number}`, ["mentor"]);
      }
      await addTestStaffAccount(db, "Halaman Uji Penilai", ["assessor"]);

      const searched = await listManagedAccounts(db, {
        query: "halaman uji",
        role: null,
        page: 98,
      });
      const filtered = await listManagedAccounts(db, {
        query: "halaman uji",
        role: "assessor",
        page: 98,
      });

      expect(searched.page).toBe(1);
      expect(searched.total).toBe(28);
      expect(searched.accounts.map((account) => account.name)).toEqual([
        "Halaman Uji 26",
        "Halaman Uji 27",
        "Halaman Uji Penilai",
      ]);
      expect(filtered.page).toBe(0);
      expect(filtered.accounts.map((account) => account.name)).toEqual([
        "Halaman Uji Penilai",
      ]);
    });
  });

  it("shows no account when nothing matches, whatever page was asked for", async () => {
    await inTestDatabase(async (db) => {
      const listed = await listManagedAccounts(db, {
        query: "tidak ada yang cocok",
        role: null,
        page: 98,
      });

      expect(listed).toEqual({ accounts: [], total: 0, page: 0 });
    });
  });
});
