// Sample NIMs of this file: 9962001300 to 9962001399.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { carryOutReplacement } from "@/mentoring/carry-out-replacement";
import { carryOutDueReplacements } from "@/mentoring/due-replacements";
import { addTestReplacement } from "@/mentoring/test-replacements";
import { NOT_SAVED_YET } from "./attendance-input";
import { listMentees } from "./mentees";
import { GROUP_NOT_HELD, saveAttendance } from "./save-attendance";
import { NOT_OWN_MENTEE, saveNote } from "./save-note";
import { SCORED_GROUP_NOT_HELD, saveScores } from "./save-scores";
import { addTestPeriod, type TestPeriod } from "./test-meetings";
import {
  addTestAccount,
  addTestGroup,
  addTestProgram,
  addTestStudent,
  testNoteInput,
} from "./test-records";
import { writtenRowsFor } from "./visible-notes";

const inTestDatabase = withTestDatabase();

interface Records {
  oldMentor: AccountForAccess;
  newMentor: AccountForAccess;
  groupId: string;
  period: TestPeriod;
  /** The two Aktif members of the group. */
  ani: string;
  budi: string;
}

async function addRecords(db: Database): Promise<Records> {
  const program = await addTestProgram(db, "UJIGANTIBARIS");
  const oldMentor = await addTestAccount(db, "Pengasuh Uji Diganti", [
    "mentor",
  ]);
  const newMentor = await addTestAccount(db, "Pengasuh Uji Pengganti", [
    "mentor",
  ]);
  const ani = await addTestStudent(db, program, {
    nim: "9962001301",
    name: "Ani Uji Ganti Baris",
  });
  const budi = await addTestStudent(db, program, {
    nim: "9962001302",
    name: "Budi Uji Ganti Baris",
  });
  const groupId = await addTestGroup(db, program, {
    number: 1,
    memberIds: [ani, budi],
    mentorId: oldMentor.id,
  });
  const period = await addTestPeriod(db, 2088);
  return { oldMentor, newMentor, groupId, period, ani, budi };
}

/** The students an account may write a note for: its mentees of today. */
async function menteeIdsOf(
  db: Database,
  account: AccountForAccess,
): Promise<string[]> {
  const limit = writtenRowsFor(account);
  if (limit === null) return [];
  const mentees = await listMentees(db, limit);
  return mentees.map((mentee) => mentee.id);
}

/** One meeting and one score: each check saves a round of its own. */
interface Round {
  meeting: number;
  heldOn: string;
  scored: string;
}

/** What each save answers an account, for the group of these checks. */
async function savesBy(
  db: Database,
  records: Records,
  account: AccountForAccess,
  round: Round,
) {
  const { groupId, period, ani, budi } = records;
  const note = await saveNote(db, account, testNoteInput(ani));
  const attendance = await saveAttendance(
    db,
    account,
    {
      groupId,
      number: round.meeting,
      heldOn: round.heldOn,
      topic: "Uji penggantian pengasuh",
      version: NOT_SAVED_YET,
      marks: { [ani]: "present", [budi]: "present" },
    },
    period.day,
  );
  const scores = await saveScores(
    db,
    account,
    {
      groupId,
      scores: { [round.scored]: 80 },
      basedOn: { [round.scored]: null },
    },
    period.day,
  );
  return { note, attendance, scores };
}

const SAVED = {
  note: { ok: true },
  attendance: { ok: true },
  scores: { ok: true },
};

const REFUSED = {
  note: NOT_OWN_MENTEE,
  attendance: GROUP_NOT_HELD,
  scores: SCORED_GROUP_NOT_HELD,
};

/** Confirms the old mentor reads and saves, and the new mentor neither. */
async function expectOldMentorHolds(db: Database, records: Records) {
  const { oldMentor, newMentor, ani, budi } = records;
  const round = { meeting: 1, heldOn: "2088-09-10", scored: ani };

  expect(await menteeIdsOf(db, oldMentor)).toEqual([ani, budi]);
  expect(await menteeIdsOf(db, newMentor)).toEqual([]);
  expect(await savesBy(db, records, newMentor, round)).toEqual(REFUSED);
  expect(await savesBy(db, records, oldMentor, round)).toMatchObject(SAVED);
}

/** Confirms it is the other way round once the replacement is carried out. */
async function expectNewMentorHolds(db: Database, records: Records) {
  const { oldMentor, newMentor, ani, budi } = records;
  const round = { meeting: 2, heldOn: "2088-09-17", scored: budi };

  expect(await menteeIdsOf(db, newMentor)).toEqual([ani, budi]);
  expect(await menteeIdsOf(db, oldMentor)).toEqual([]);
  expect(await savesBy(db, records, oldMentor, round)).toEqual(REFUSED);
  expect(await savesBy(db, records, newMentor, round)).toMatchObject(SAVED);
}

describe("the students of a group whose mentor is replaced", () => {
  it("go from the old mentor to the new one when a replacement for today is carried out", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const replacement = {
        groupId: records.groupId,
        oldMentorId: records.oldMentor.id,
        newMentorId: records.newMentor.id,
        startsOn: records.period.day,
        reason: "own_request",
      } as const;
      const id = await addTestReplacement(db, replacement);
      await expectOldMentorHolds(db, records);

      const done = await carryOutReplacement(db, { ...replacement, id });

      expect(done).toBe(true);
      await expectNewMentorHolds(db, records);
    });
  });

  it("stay with the old mentor while a replacement waits, and go to the new one once its start date has come", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestReplacement(db, {
        groupId: records.groupId,
        oldMentorId: records.oldMentor.id,
        newMentorId: records.newMentor.id,
        startsOn: records.period.day,
      });

      await carryOutDueReplacements(db, "2088-10-12");
      await expectOldMentorHolds(db, records);
      await carryOutDueReplacements(db, records.period.day);

      await expectNewMentorHolds(db, records);
    });
  });
});
