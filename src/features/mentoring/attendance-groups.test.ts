// Sample NIMs of this file: 9962000000 to 9962000099.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { listAttendanceGroups, mayFillInFor } from "./attendance-groups";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";
import { attendanceRowsFor, filledRowsFor } from "./visible-attendance";

const inTestDatabase = withTestDatabase();

interface Records {
  programA: number;
  programB: number;
  mentorA: AccountForAccess;
  mentorB: AccountForAccess;
  /** Held group A before mentor A took it. */
  earlier: AccountForAccess;
  groupA: string;
  groupB: string;
}

/** Group A of program A, whose mentor was replaced, and group B of program B. */
async function addRecords(db: Database): Promise<Records> {
  const programA = await addTestProgram(db, "UJIKELOMPOKHADIR-A");
  const programB = await addTestProgram(db, "UJIKELOMPOKHADIR-B");
  const mentorA = await addTestAccount(db, "Pengasuh Uji Hadir A", ["mentor"]);
  const mentorB = await addTestAccount(db, "Pengasuh Uji Hadir B", ["mentor"]);
  const earlier = await addTestAccount(db, "Pengasuh Uji Hadir Lama", [
    "mentor",
  ]);
  const member = await addTestStudent(db, programA, {
    nim: "9962000001",
    name: "Anak Asuh Uji Kelompok",
  });
  const groupA = await addTestGroup(db, programA, {
    number: 1,
    memberIds: [member],
    mentorId: mentorA.id,
    earlierMentorId: earlier.id,
  });
  const groupB = await addTestGroup(db, programB, {
    number: 1,
    memberIds: [],
    mentorId: mentorB.id,
  });
  return { programA, programB, mentorA, mentorB, earlier, groupA, groupB };
}

/** The ids of the test groups an account is given, in the order given. */
async function groupsOf(
  db: Database,
  account: AccountForAccess,
  records: Records,
): Promise<string[]> {
  const limit = attendanceRowsFor(account);
  if (limit === null) return [];
  const groups = await listAttendanceGroups(db, limit);
  const own = [records.groupA, records.groupB];
  return groups.map((group) => group.id).filter((id) => own.includes(id));
}

describe("listAttendanceGroups", () => {
  it.each(["head_of_unit", "director"] as const)(
    "gives %s every group",
    async (role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const account = await addTestAccount(db, "Akun Uji Hadir", [role]);

        const groups = await groupsOf(db, account, records);

        expect(groups.sort()).toEqual([records.groupA, records.groupB].sort());
      });
    },
  );

  it("keeps Ketua Program Studi to the groups of their program", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const head = await addTestAccount(
        db,
        "Kaprodi Uji Hadir",
        ["head_of_program"],
        records.programB,
      );

      expect(await groupsOf(db, head, records)).toEqual([records.groupB]);
    });
  });

  it("gives Ketua Program Studi without a program no group", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const head = await addTestAccount(db, "Kaprodi Uji Hadir", [
        "head_of_program",
      ]);

      expect(await groupsOf(db, head, records)).toEqual([]);
    });
  });

  it("keeps Pengasuh to the groups they hold today", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      expect(await groupsOf(db, records.mentorA, records)).toEqual([
        records.groupA,
      ]);
      expect(await groupsOf(db, records.mentorB, records)).toEqual([
        records.groupB,
      ]);
    });
  });

  it("gives a mentor who was replaced that group no more", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      expect(await groupsOf(db, records.earlier, records)).toEqual([]);
    });
  });

  it("gives no role without the right any group", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const readers = ["head_of_unit", "director", "head_of_program", "mentor"];
      const others = ROLE_IDS.filter((role) => !readers.includes(role));

      expect(others).toContain("upk_staff");
      expect(others).toContain("student");
      for (const role of others) {
        const account = await addTestAccount(db, `Akun Uji ${role}`, [role]);

        expect(await groupsOf(db, account, records)).toEqual([]);
      }
    });
  });

  it("names each group with its code parts and its mentor of today", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const limit = attendanceRowsFor(records.mentorA);
      if (limit === null) throw new Error("Pengasuh reads attendance.");

      const [group] = await listAttendanceGroups(db, limit);

      expect(group).toEqual({
        id: records.groupA,
        cohortYear: 2026,
        entryPath: "regular",
        number: 1,
        programCode: "UJIKELOMPOKHADIR-A",
        mentor: {
          id: records.mentorA.id,
          name: "Pengasuh Uji Hadir A",
          title: null,
        },
      });
    });
  });
});

describe("mayFillInFor", () => {
  const mentor: AccountForAccess = {
    id: "mentor-1",
    roles: ["mentor"],
    studyProgramId: null,
    studentId: null,
  };

  it("lets Pengasuh fill in for a group they hold today", () => {
    expect(mayFillInFor(filledRowsFor(mentor), "mentor-1")).toBe(true);
  });

  it("refuses Pengasuh a group another mentor holds, and one without a mentor", () => {
    expect(mayFillInFor(filledRowsFor(mentor), "mentor-2")).toBe(false);
    expect(mayFillInFor(filledRowsFor(mentor), null)).toBe(false);
  });

  it.each(["head_of_unit", "director", "head_of_program"] as const)(
    "refuses %s every group, their own included",
    (role) => {
      const reader = { ...mentor, roles: [role], studyProgramId: 3 };

      expect(mayFillInFor(filledRowsFor(reader), "mentor-1")).toBe(false);
    },
  );

  it("lets Pengasuh who is also Kepala Unit fill in only for the group they hold", () => {
    const both: AccountForAccess = {
      ...mentor,
      roles: ["mentor", "head_of_unit"],
    };

    expect(mayFillInFor(filledRowsFor(both), "mentor-1")).toBe(true);
    expect(mayFillInFor(filledRowsFor(both), "mentor-2")).toBe(false);
  });
});
