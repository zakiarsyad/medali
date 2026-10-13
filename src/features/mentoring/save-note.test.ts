import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { listMentees } from "./mentees";
import { NOT_ALLOWED_TO_WRITE, NOT_OWN_MENTEE, saveNote } from "./save-note";
import {
  addTestAccount,
  addTestGroup,
  addTestMembers,
  addTestProgram,
  addTestStudent,
  replaceTestMentor,
  testNoteInput,
  testNotesOf,
} from "./test-records";
import { writtenRowsFor } from "./visible-notes";

const inTestDatabase = withTestDatabase();

const PROGRAM = "UJISIMPANCATATAN";
const OTHER_ROLES = ROLE_IDS.filter((role) => role !== "mentor");

interface Records {
  programId: number;
  mentor: AccountForAccess;
  otherMentor: AccountForAccess;
  /** An Aktif member of the group the mentor holds today. */
  menteeId: string;
  /** A member of that group who is on Cuti. */
  onLeaveId: string;
  /** A member of the group the other mentor holds. */
  otherMenteeId: string;
  groupId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const programId = await addTestProgram(db, PROGRAM);
  const mentor = await addTestAccount(db, "Pengasuh Uji Tulis", ["mentor"]);
  const otherMentor = await addTestAccount(db, "Pengasuh Uji Lain", ["mentor"]);
  const menteeId = await addTestStudent(db, programId, {
    nim: "9961000001",
    name: "Anak Asuh Uji",
  });
  const onLeaveId = await addTestStudent(db, programId, {
    nim: "9961000002",
    name: "Anak Asuh Uji Cuti",
    status: "on_leave",
  });
  const otherMenteeId = await addTestStudent(db, programId, {
    nim: "9961000003",
    name: "Anak Asuh Uji Orang Lain",
  });
  const groupId = await addTestGroup(db, programId, {
    number: 1,
    memberIds: [menteeId, onLeaveId],
    mentorId: mentor.id,
  });
  await addTestGroup(db, programId, {
    number: 2,
    memberIds: [otherMenteeId],
    mentorId: otherMentor.id,
  });
  return {
    programId,
    mentor,
    otherMentor,
    menteeId,
    onLeaveId,
    otherMenteeId,
    groupId,
  };
}

describe("saveNote", () => {
  it("keeps the note of Pengasuh for their own mentee, with the signed-in account as its writer", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, menteeId } = await addRecords(db);
      const input = testNoteInput(menteeId, {
        kind: "discipline_guidance",
        happenedOn: "2026-10-09",
        valueKeys: ["D", "I"],
        note: "Terlambat apel pagi.",
        followUp: "watch_two_weeks",
      });

      const saved = await saveNote(db, mentor, input);

      expect(saved).toEqual({
        ok: true,
        value: { studentName: "Anak Asuh Uji" },
      });
      const stored = await testNotesOf(db, menteeId);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ ...input, writtenBy: mentor.id });
      expect(stored[0]?.writtenAt).toBeInstanceOf(Date);
    });
  });

  it("refuses Pengasuh a note for a student of another mentor's group", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, otherMenteeId } = await addRecords(db);

      const saved = await saveNote(db, mentor, testNoteInput(otherMenteeId));

      expect(saved).toEqual(NOT_OWN_MENTEE);
      expect(await testNotesOf(db, otherMenteeId)).toEqual([]);
    });
  });

  it("refuses a note for a student who is in no group", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, programId } = await addRecords(db);
      const loneId = await addTestStudent(db, programId, {
        nim: "9961000004",
        name: "Mahasiswa Uji Tanpa Kelompok",
      });

      const saved = await saveNote(db, mentor, testNoteInput(loneId));

      expect(saved).toEqual(NOT_OWN_MENTEE);
      expect(await testNotesOf(db, loneId)).toEqual([]);
    });
  });

  it("refuses a note for a student who does not exist with the same answer", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addRecords(db);
      const nobody = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4c99";

      expect(await saveNote(db, mentor, testNoteInput(nobody))).toEqual(
        NOT_OWN_MENTEE,
      );
    });
  });

  it("refuses a note for a mentee who is not Aktif, or was removed", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, programId, groupId, onLeaveId } = await addRecords(db);
      const removedId = await addTestStudent(db, programId, {
        nim: "9961000005",
        name: "Anak Asuh Uji Dihapus",
        deletedAt: new Date(),
      });
      const inactiveId = await addTestStudent(db, programId, {
        nim: "9961000006",
        name: "Anak Asuh Uji Non Aktif",
        status: "inactive",
      });
      await addTestMembers(db, groupId, [removedId, inactiveId]);

      for (const studentId of [onLeaveId, removedId, inactiveId]) {
        const saved = await saveNote(db, mentor, testNoteInput(studentId));

        expect(saved).toEqual(NOT_OWN_MENTEE);
        expect(await testNotesOf(db, studentId)).toEqual([]);
      }
    });
  });

  it("refuses the earlier mentor once the group has another, and lets the new one write", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, otherMentor, menteeId, groupId } = await addRecords(db);
      await replaceTestMentor(db, groupId, otherMentor.id, "2026-10-12");

      const byEarlier = await saveNote(db, mentor, testNoteInput(menteeId));
      const byNew = await saveNote(db, otherMentor, testNoteInput(menteeId));

      expect(byEarlier).toEqual(NOT_OWN_MENTEE);
      expect(byNew).toMatchObject({ ok: true });
      const stored = await testNotesOf(db, menteeId);
      expect(stored.map((note) => note.writtenBy)).toEqual([otherMentor.id]);
    });
  });

  it("keeps the earlier mentor as the writer of an old note after a replacement", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, otherMentor, menteeId, groupId } = await addRecords(db);
      await saveNote(db, mentor, testNoteInput(menteeId));

      await replaceTestMentor(db, groupId, otherMentor.id, "2026-10-12");

      const stored = await testNotesOf(db, menteeId);
      expect(stored.map((note) => note.writtenBy)).toEqual([mentor.id]);
    });
  });

  it.each(OTHER_ROLES)(
    "refuses %s to write a note, for any student",
    (role) => {
      return inTestDatabase(async (db) => {
        const { programId, menteeId } = await addRecords(db);
        const account = await addTestAccount(
          db,
          "Akun Uji Bukan Pengasuh",
          [role],
          programId,
        );

        const saved = await saveNote(db, account, testNoteInput(menteeId));

        expect(saved).toEqual(NOT_ALLOWED_TO_WRITE);
        expect(await testNotesOf(db, menteeId)).toEqual([]);
      });
    },
  );

  it("lets Pengasuh who is also Kepala Unit write only for their own mentees", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, menteeId, otherMenteeId } = await addRecords(db);
      const both = { ...mentor, roles: ["mentor", "head_of_unit"] as const };

      const own = await saveNote(db, both, testNoteInput(menteeId));
      const foreign = await saveNote(db, both, testNoteInput(otherMenteeId));

      expect(own).toMatchObject({ ok: true });
      expect(foreign).toEqual(NOT_OWN_MENTEE);
    });
  });
});

describe("listMentees", () => {
  it("offers Pengasuh the Aktif members of the groups they hold today, by name", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, menteeId, programId, groupId } = await addRecords(db);
      const secondId = await addTestStudent(db, programId, {
        nim: "9961000007",
        name: "Aaa Anak Asuh Uji Kedua",
      });
      await addTestMembers(db, groupId, [secondId]);
      const limit = writtenRowsFor(mentor);
      if (limit === null) throw new Error("Pengasuh may write notes.");

      const mentees = await listMentees(db, limit);

      expect(mentees).toEqual([
        { id: secondId, name: "Aaa Anak Asuh Uji Kedua", nim: "9961000007" },
        { id: menteeId, name: "Anak Asuh Uji", nim: "9961000001" },
      ]);
    });
  });

  it("offers a Pengasuh without a group nobody", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const idle = await addTestAccount(db, "Pengasuh Uji Cadangan", [
        "mentor",
      ]);
      const limit = writtenRowsFor(idle);
      if (limit === null) throw new Error("Pengasuh may write notes.");

      expect(await listMentees(db, limit)).toEqual([]);
    });
  });

  it("gives an account that is not Pengasuh no list at all", () => {
    for (const role of OTHER_ROLES) {
      const account = {
        id: "a",
        roles: [role],
        studyProgramId: 1,
        studentId: null,
      };

      expect(writtenRowsFor(account)).toBeNull();
    }
  });
});
