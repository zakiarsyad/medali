// Sample Tahun akademik of this file: 2650 to 2651.
// Sample NIMs of this file: 9962000700 to 9962000799.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { detailVisibleTo } from "@/features/students/visible-students";
import { listScoredMembers } from "./group-scores";
import { addTestPeriod, type TestPeriod } from "./test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";
import { addTestScore } from "./test-scores";

const inTestDatabase = withTestDatabase();

interface Records {
  program: number;
  mentor: AccountForAccess;
  otherMentor: AccountForAccess;
  groupId: string;
  period: TestPeriod;
  /** Aktif members of the group, by name: Ani, then Budi. */
  ani: string;
  budi: string;
  onLeave: string;
  /** An Aktif member of the other mentor's group. */
  outsider: string;
}

async function addRecords(db: Database): Promise<Records> {
  const program = await addTestProgram(db, "UJINILAIKELOMPOK");
  const mentor = await addTestAccount(db, "Pengasuh Uji Nilai", ["mentor"]);
  const otherMentor = await addTestAccount(db, "Pengasuh Uji Nilai Lain", [
    "mentor",
  ]);
  const budi = await addTestStudent(db, program, {
    nim: "9962000702",
    name: "Budi Uji Nilai",
  });
  const ani = await addTestStudent(db, program, {
    nim: "9962000701",
    name: "Ani Uji Nilai",
  });
  const onLeave = await addTestStudent(db, program, {
    nim: "9962000703",
    name: "Cuti Uji Nilai",
    status: "on_leave",
  });
  const outsider = await addTestStudent(db, program, {
    nim: "9962000704",
    name: "Kelompok Lain Uji Nilai",
  });
  const groupId = await addTestGroup(db, program, {
    number: 1,
    memberIds: [budi, ani, onLeave],
    mentorId: mentor.id,
  });
  await addTestGroup(db, program, {
    number: 2,
    memberIds: [outsider],
    mentorId: otherMentor.id,
  });
  const period = await addTestPeriod(db, 2650);
  return {
    program,
    mentor,
    otherMentor,
    groupId,
    period,
    ani,
    budi,
    onLeave,
    outsider,
  };
}

describe("listScoredMembers", () => {
  it("lists the Aktif members of the group by name, each with the score kept for them in the period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const scoredAt = new Date("2650-10-01T03:00:00Z");
      await addTestScore(db, {
        studentId: records.budi,
        periodId: records.period.id,
        score: 82,
        scoredBy: records.mentor.id,
        scoredAt,
      });

      const members = await listScoredMembers(
        db,
        records.groupId,
        records.period.id,
        null,
      );

      expect(members).toEqual([
        {
          id: records.ani,
          name: "Ani Uji Nilai",
          nim: "9962000701",
          score: null,
          scoredAt: null,
          opensDetail: false,
        },
        {
          id: records.budi,
          name: "Budi Uji Nilai",
          nim: "9962000702",
          score: 82,
          scoredAt,
          opensDetail: false,
        },
      ]);
    });
  });

  it("leaves out a member on Cuti and the members of another group", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const members = await listScoredMembers(
        db,
        records.groupId,
        records.period.id,
        null,
      );
      const ids = members.map((member) => member.id);

      expect(ids).not.toContain(records.onLeave);
      expect(ids).not.toContain(records.outsider);
    });
  });

  it("shows no score of another period", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const earlier = await addTestPeriod(db, 2651);
      await addTestScore(db, {
        studentId: records.ani,
        periodId: earlier.id,
        score: 91,
        scoredBy: records.mentor.id,
      });

      const [ani] = await listScoredMembers(
        db,
        records.groupId,
        records.period.id,
        null,
      );

      expect(ani).toMatchObject({ id: records.ani, score: null });
    });
  });

  it("marks the members whose detail the account may open: for Pengasuh those of a group they hold", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { groupId, period } = records;

      const forHolder = await listScoredMembers(
        db,
        groupId,
        period.id,
        detailVisibleTo(records.mentor),
      );
      const forOther = await listScoredMembers(
        db,
        groupId,
        period.id,
        detailVisibleTo(records.otherMentor),
      );

      expect(forHolder.map((member) => member.opensDetail)).toEqual([
        true,
        true,
      ]);
      expect(forOther.map((member) => member.opensDetail)).toEqual([
        false,
        false,
      ]);
    });
  });

  it("marks every member for a role that opens every detail, and those of their program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { groupId, period, program } = records;
      const headOfUnit = await addTestAccount(db, "Kepala Unit Uji Nilai", [
        "head_of_unit",
      ]);
      const ownHead = await addTestAccount(
        db,
        "Kaprodi Uji Nilai",
        ["head_of_program"],
        program,
      );
      const otherProgram = await addTestProgram(db, "UJINILAIKELOMPOK-LAIN");
      const otherHead = await addTestAccount(
        db,
        "Kaprodi Uji Nilai Lain",
        ["head_of_program"],
        otherProgram,
      );

      async function opened(account: AccountForAccess): Promise<boolean[]> {
        const members = await listScoredMembers(
          db,
          groupId,
          period.id,
          detailVisibleTo(account),
        );
        return members.map((member) => member.opensDetail);
      }

      expect(await opened(headOfUnit)).toEqual([true, true]);
      expect(await opened(ownHead)).toEqual([true, true]);
      expect(await opened(otherHead)).toEqual([false, false]);
    });
  });
});
