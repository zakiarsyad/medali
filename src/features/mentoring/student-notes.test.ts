// Sample NIMs of this file: 9961000300 to 9961000399.
import type { SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
// The rule that turns a row limit into the students it holds is the
// students area's own. The checks here need the real one, to confirm
// which notes each role is given.
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { openWriteAddress } from "./open-write-address";
import { listStudentNotes, STUDENT_NOTES_SHOWN } from "./student-notes";
import {
  addTestAccount,
  addTestGroup,
  addTestMembers,
  addTestNote,
  addTestProgram,
  addTestStudent,
  replaceTestMentor,
} from "./test-records";
import { noteRowsFor } from "./visible-notes";

const inTestDatabase = withTestDatabase();

const NO_NOTES = { notes: [], count: 0 };

interface Records {
  programId: number;
  otherProgramId: number;
  mentor: AccountForAccess;
  otherMentor: AccountForAccess;
  groupId: string;
  /** A mentee of the mentor, with two notes. */
  menteeId: string;
  /** A mentee of the other mentor, in another program, with one note. */
  otherId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const programId = await addTestProgram(db, "UJICATATANMHS-A");
  const otherProgramId = await addTestProgram(db, "UJICATATANMHS-B");
  const mentor = await addTestAccount(db, "Pengasuh Uji Profil", ["mentor"]);
  const otherMentor = await addTestAccount(db, "Pengasuh Uji Profil Lain", [
    "mentor",
  ]);
  const menteeId = await addTestStudent(db, programId, {
    nim: "9961000301",
    name: "Profil Uji Anak Asuh",
  });
  const otherId = await addTestStudent(db, otherProgramId, {
    nim: "9961000302",
    name: "Profil Uji Orang Lain",
  });
  const groupId = await addTestGroup(db, programId, {
    number: 1,
    memberIds: [menteeId],
    mentorId: mentor.id,
  });
  await addTestGroup(db, otherProgramId, {
    number: 1,
    memberIds: [otherId],
    mentorId: otherMentor.id,
  });
  await addTestNote(db, menteeId, mentor.id, {
    note: "Catatan pertama.",
    writtenAt: new Date("2026-10-01T03:00:00Z"),
  });
  await addTestNote(db, menteeId, mentor.id, {
    note: "Catatan kedua.",
    writtenAt: new Date("2026-10-02T03:00:00Z"),
  });
  await addTestNote(db, otherId, otherMentor.id, { note: "Catatan lain." });
  return {
    programId,
    otherProgramId,
    mentor,
    otherMentor,
    groupId,
    menteeId,
    otherId,
  };
}

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return {
    id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4f01",
    roles,
    studyProgramId,
    studentId: null,
  };
}

function visibleFor(reader: AccountForAccess): SQL {
  const limit = noteRowsFor(reader);
  if (limit === null) throw new Error("This account may not read notes.");
  return visibleTo(limit);
}

/** The texts of a student's notes as an account is given them. */
async function textsFor(
  db: Database,
  reader: AccountForAccess,
  studentId: string,
): Promise<string[]> {
  const found = await listStudentNotes(db, visibleFor(reader), studentId);
  return found.notes.map((note) => note.note);
}

describe("listStudentNotes", () => {
  it.each(["head_of_unit", "director"] as const)(
    "gives %s the notes of any student, newest first, with their count and writer",
    (role) => {
      return inTestDatabase(async (db) => {
        const { menteeId, otherId } = await addRecords(db);
        const visible = visibleFor(account([role]));

        const own = await listStudentNotes(db, visible, menteeId);
        const other = await listStudentNotes(db, visible, otherId);

        expect(own.count).toBe(2);
        expect(own.notes.map((note) => note.note)).toEqual([
          "Catatan kedua.",
          "Catatan pertama.",
        ]);
        expect(own.notes[0]?.writer.name).toBe("Pengasuh Uji Profil");
        expect(other.count).toBe(1);
      });
    },
  );

  it("gives Ketua Program Studi the notes of a student of their program, and none of another program", async () => {
    await inTestDatabase(async (db) => {
      const { programId, menteeId, otherId } = await addRecords(db);
      const head = account(["head_of_program"], programId);

      expect(await textsFor(db, head, menteeId)).toHaveLength(2);
      expect(await listStudentNotes(db, visibleFor(head), otherId)).toEqual(
        NO_NOTES,
      );
    });
  });

  it("gives Pengasuh the notes of an own mentee, and none of another mentor's", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, menteeId, otherId } = await addRecords(db);

      expect(await textsFor(db, mentor, menteeId)).toHaveLength(2);
      expect(await listStudentNotes(db, visibleFor(mentor), otherId)).toEqual(
        NO_NOTES,
      );
    });
  });

  it("gives the new mentor the old notes under the earlier mentor's name, and the earlier mentor none", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, otherMentor, groupId, menteeId } = await addRecords(db);

      await replaceTestMentor(db, groupId, otherMentor.id, "2026-10-12");

      const found = await listStudentNotes(
        db,
        visibleFor(otherMentor),
        menteeId,
      );
      expect(found.notes.map((note) => note.writer.name)).toEqual([
        "Pengasuh Uji Profil",
        "Pengasuh Uji Profil",
      ]);
      expect(await listStudentNotes(db, visibleFor(mentor), menteeId)).toEqual(
        NO_NOTES,
      );
    });
  });

  it("keeps Pengasuh who is also Pegawai UPK to the notes of their own mentees", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, menteeId, otherId } = await addRecords(db);
      const both = { ...mentor, roles: ["mentor", "upk_staff"] as RoleId[] };

      expect(await textsFor(db, both, menteeId)).toHaveLength(2);
      expect(await textsFor(db, both, otherId)).toEqual([]);
    });
  });

  it.each(["", "abc", "9961000301", "' or 1=1 --"])(
    "gives no note for what is no id of a student (%j)",
    (studentId) => {
      return inTestDatabase(async (db) => {
        await addRecords(db);
        const visible = visibleFor(account(["head_of_unit"]));

        expect(await listStudentNotes(db, visible, studentId)).toEqual(
          NO_NOTES,
        );
      });
    },
  );

  it("shows the newest 20 notes of a student and counts them all", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, menteeId } = await addRecords(db);
      for (let place = 0; place < STUDENT_NOTES_SHOWN; place++) {
        await addTestNote(db, menteeId, mentor.id, {
          writtenAt: new Date(Date.UTC(2026, 9, 3, 0, place)),
        });
      }

      const found = await listStudentNotes(db, visibleFor(mentor), menteeId);

      expect(found.count).toBe(22);
      expect(found.notes).toHaveLength(20);
      expect(found.notes.map((note) => note.note)).not.toContain(
        "Catatan pertama.",
      );
    });
  });
});

describe("who gets the notes of a student", () => {
  const readers: RoleId[] = [
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
  ];
  const others = ROLE_IDS.filter((role) => !readers.includes(role));

  it.each(others)("gives %s no notes: there is no limit to read by", (role) => {
    expect(noteRowsFor(account([role], 1))).toBeNull();
  });

  it("gives a mix of roles that read no notes none either", () => {
    expect(noteRowsFor(account(["upk_staff", "counsellor"]))).toBeNull();
    expect(noteRowsFor(account(others))).toBeNull();
  });
});

describe("openWriteAddress", () => {
  it("gives Pengasuh the form with the student chosen, for an own Aktif mentee", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, menteeId } = await addRecords(db);

      expect(await openWriteAddress(db, mentor, menteeId)).toBe(
        `/pengasuhan/catatan?tulis=${menteeId}`,
      );
    });
  });

  it("gives Pengasuh none for a student of another mentor, or for what is no id", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, otherId } = await addRecords(db);

      expect(await openWriteAddress(db, mentor, otherId)).toBeNull();
      expect(await openWriteAddress(db, mentor, "abc")).toBeNull();
    });
  });

  it("gives Pengasuh none for a mentee who is not Aktif", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, programId, groupId } = await addRecords(db);
      const onLeave = await addTestStudent(db, programId, {
        nim: "9961000303",
        name: "Profil Uji Cuti",
        status: "on_leave",
      });
      await addTestMembers(db, groupId, [onLeave]);

      expect(await openWriteAddress(db, mentor, onLeave)).toBeNull();
    });
  });

  it.each([
    "head_of_unit",
    "director",
    "head_of_program",
    "upk_staff",
  ] as const)("gives %s none: only Pengasuh writes", (role) => {
    return inTestDatabase(async (db) => {
      const { programId, menteeId } = await addRecords(db);

      expect(
        await openWriteAddress(db, account([role], programId), menteeId),
      ).toBeNull();
    });
  });
});
