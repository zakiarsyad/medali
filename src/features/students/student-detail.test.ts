// Sample NIMs of this file: 9900001500 to 9900001599.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readStudentDetail } from "./student-detail";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const NOT_FOUND = { kind: "not_found" };
const NO_SUCH_ID = "00000000-0000-4000-8000-000000000000";

/** Roles that see every student on their own screens and open no detail. */
const WIDE_WITHOUT_DETAIL = [
  "upk_staff",
  "counsellor",
  "assessor",
  "discipline_officer",
  "dorm_manager",
] as const;

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: NO_SUCH_ID, roles, studyProgramId, studentId: null };
}

/** Two programs, with one student in each. */
async function addRows(db: Database) {
  const own = await addTestProgram(db, "Prodi Uji Detail Sendiri");
  const other = await addTestProgram(db, "Prodi Uji Detail Lain");
  const inOwn = await addTestStudent(db, own, {
    nim: "9900001501",
    name: "Detail Uji Ani",
    entryPath: "transfer",
    originAgency: "Direktorat Jenderal Pajak",
    cohortYear: 2025,
    className: "2-01",
    province: "Bali",
    isSeedling: true,
    status: "on_leave",
  });
  const inOther = await addTestStudent(db, other, {
    nim: "9900001502",
    name: "Detail Uji Budi",
  });
  return { own, other, inOwn, inOther };
}

describe("readStudentDetail", () => {
  it("gives Ketua Program Studi a student of their own program", async () => {
    await inTestDatabase(async (db) => {
      const { own, inOwn } = await addRows(db);

      const answer = await readStudentDetail(
        db,
        account(["head_of_program"], own),
        inOwn,
      );

      expect(answer).toEqual({
        kind: "found",
        student: {
          id: inOwn,
          nim: "9900001501",
          name: "Detail Uji Ani",
          status: "on_leave",
          isAffirmation: false,
          isSeedling: true,
          isInternational: false,
          isBlended: false,
          studyProgram: "Prodi Uji Detail Sendiri",
          entryPath: "transfer",
          originAgency: "Direktorat Jenderal Pajak",
          cohortYear: 2025,
          className: "2-01",
          province: "Bali",
          sex: "female",
          mentorGroup: null,
        },
      });
    });
  });

  it("gives the student's kelompok pengasuhan with its mentor", async () => {
    await inTestDatabase(async (db) => {
      const { own, inOwn } = await addRows(db);
      const mentor = await addTestActor(db, "Detail Uji Pengasuh", ["mentor"]);
      const groupId = await addTestMentorGroup(db, own, {
        number: 2,
        memberIds: [inOwn],
        mentorId: mentor.id,
      });

      const answer = await readStudentDetail(
        db,
        account(["head_of_program"], own),
        inOwn,
      );

      expect(answer).toMatchObject({
        kind: "found",
        student: {
          mentorGroup: {
            id: groupId,
            number: 2,
            mentor: { name: "Detail Uji Pengasuh", since: "2026-09-01" },
            earlierMentors: [],
          },
        },
      });
    });
  });

  it("answers Ketua Program Studi as for no student when it is of another program", async () => {
    await inTestDatabase(async (db) => {
      const { own, inOther } = await addRows(db);
      const asking = account(["head_of_program"], own);

      expect(await readStudentDetail(db, asking, inOther)).toEqual(NOT_FOUND);
      expect(await readStudentDetail(db, asking, NO_SUCH_ID)).toEqual(
        NOT_FOUND,
      );
    });
  });

  it.each(WIDE_WITHOUT_DETAIL)(
    "keeps Ketua Program Studi who is also %s to their own program",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { own, inOwn, inOther } = await addRows(db);
        const asking = account(["head_of_program", role], own);

        const first = await readStudentDetail(db, asking, inOwn);
        const second = await readStudentDetail(db, asking, inOther);

        expect(first.kind).toBe("found");
        expect(second).toEqual(NOT_FOUND);
      });
    },
  );

  it("answers a Ketua Program Studi without a program as for no student", async () => {
    await inTestDatabase(async (db) => {
      const { inOwn } = await addRows(db);

      const answer = await readStudentDetail(
        db,
        account(["head_of_program"]),
        inOwn,
      );

      expect(answer).toEqual(NOT_FOUND);
    });
  });

  it.each(["head_of_unit", "director"] as const)(
    "gives %s a student of any program",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { inOwn, inOther } = await addRows(db);

        const first = await readStudentDetail(db, account([role]), inOwn);
        const second = await readStudentDetail(db, account([role]), inOther);

        expect(first.kind).toBe("found");
        expect(second.kind).toBe("found");
      });
    },
  );

  it.each(["mentor", "upk_staff", "student", "dorm_manager"] as const)(
    "refuses %s, who has no right to a detail",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { own, inOwn } = await addRows(db);
        const asking = { ...account([role], own), studentId: inOwn };

        const answer = await readStudentDetail(db, asking, inOwn);

        expect(answer).toEqual({ kind: "refused" });
      });
    },
  );

  it("refuses a role without the right for a student who does not exist too", async () => {
    await inTestDatabase(async (db) => {
      const answer = await readStudentDetail(
        db,
        account(["mentor"]),
        NO_SUCH_ID,
      );

      expect(answer).toEqual({ kind: "refused" });
    });
  });

  it("answers for a removed student as for one who does not exist", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Detail Hapus");
      const removed = await addTestStudent(db, program, {
        nim: "9900001503",
        name: "Detail Uji Dihapus",
        deletedAt: new Date("2026-10-11T03:00:00Z"),
      });
      const asking = account(["head_of_unit"]);

      expect(await readStudentDetail(db, asking, removed)).toEqual(NOT_FOUND);
      expect(await readStudentDetail(db, asking, NO_SUCH_ID)).toEqual(
        NOT_FOUND,
      );
    });
  });

  it.each(["", "9900001501", "abc", "' or 1=1 --", `${NO_SUCH_ID}x`])(
    "answers for the id %j as for a student who does not exist",
    async (id) => {
      await inTestDatabase(async (db) => {
        await addRows(db);

        const answer = await readStudentDetail(
          db,
          account(["head_of_unit"]),
          id,
        );

        expect(answer).toEqual(NOT_FOUND);
      });
    },
  );
});
