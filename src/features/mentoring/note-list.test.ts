import type { SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
// The rule that turns a row limit into the students it holds is the
// students area's own. The checks here need the real one, to confirm
// which notes each role is given.
import { visibleTo } from "@/features/students/visible-students";
import { listNotes, NOTES_PAGE_SIZE } from "./note-list";
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

const READERS: RoleId[] = [
  "head_of_unit",
  "director",
  "head_of_program",
  "mentor",
];
const OTHER_ROLES = ROLE_IDS.filter((role) => !READERS.includes(role));

interface Records {
  programA: number;
  programB: number;
  mentorA: AccountForAccess;
  mentorB: AccountForAccess;
  groupA: string;
  /** Two students of program A, in the group of mentor A. */
  first: string;
  second: string;
  /** A student of program B, in the group of mentor B. */
  third: string;
}

/** Three notes: the first student's is the oldest, the third's the newest. */
async function addRecords(db: Database): Promise<Records> {
  const programA = await addTestProgram(db, "UJIDAFTARCATATAN-A");
  const programB = await addTestProgram(db, "UJIDAFTARCATATAN-B");
  const mentorA = await addTestAccount(db, "Pengasuh Uji Daftar A", ["mentor"]);
  const mentorB = await addTestAccount(db, "Pengasuh Uji Daftar B", ["mentor"]);
  const first = await addTestStudent(db, programA, {
    nim: "9961000201",
    name: "Daftar Uji Pertama",
  });
  const second = await addTestStudent(db, programA, {
    nim: "9961000202",
    name: "Daftar Uji Kedua",
  });
  const third = await addTestStudent(db, programB, {
    nim: "9961000203",
    name: "Daftar Uji Ketiga",
  });
  const groupA = await addTestGroup(db, programA, {
    number: 1,
    memberIds: [first, second],
    mentorId: mentorA.id,
  });
  await addTestGroup(db, programB, {
    number: 1,
    memberIds: [third],
    mentorId: mentorB.id,
  });
  await addTestNote(db, first, mentorA.id, {
    kind: "individual_counselling",
    writtenAt: new Date("2026-10-01T03:00:00Z"),
  });
  await addTestNote(db, second, mentorA.id, {
    kind: "appreciation",
    followUp: "watch_two_weeks",
    writtenAt: new Date("2026-10-02T03:00:00Z"),
  });
  await addTestNote(db, third, mentorB.id, {
    kind: "appreciation",
    writtenAt: new Date("2026-10-03T03:00:00Z"),
  });
  return { programA, programB, mentorA, mentorB, groupA, first, second, third };
}

/** The students whose notes an account may read, as the screen asks for them. */
function visibleFor(account: AccountForAccess): SQL {
  const limit = noteRowsFor(account);
  if (limit === null) throw new Error("This account may not read notes.");
  return visibleTo(limit);
}

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return {
    id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4d01",
    roles,
    studyProgramId,
    studentId: null,
  };
}

/** The students of the notes an account is given, newest note first. */
async function studentsSeenBy(
  db: Database,
  reader: AccountForAccess,
): Promise<string[]> {
  const list = await listNotes(db, visibleFor(reader), null, 1);
  return list.notes.map((note) => note.studentName);
}

describe("listNotes", () => {
  it.each(["head_of_unit", "director"] as const)(
    "gives %s every note, the one saved last on top",
    (role) => {
      return inTestDatabase(async (db) => {
        const { first, second, third } = await addRecords(db);

        const list = await listNotes(db, visibleFor(account([role])), null, 1);

        const own = list.notes.filter((note) =>
          [first, second, third].includes(note.studentId),
        );
        expect(own.map((note) => note.studentName)).toEqual([
          "Daftar Uji Ketiga",
          "Daftar Uji Kedua",
          "Daftar Uji Pertama",
        ]);
      });
    },
  );

  it("gives each note its day, student, kind, values, text, follow-up and writer", async () => {
    await inTestDatabase(async (db) => {
      const { programA, second } = await addRecords(db);

      const list = await listNotes(
        db,
        visibleFor(account(["head_of_program"], programA)),
        null,
        1,
      );

      expect(list.notes[0]).toMatchObject({
        studentId: second,
        studentName: "Daftar Uji Kedua",
        happenedOn: "2026-10-10",
        kind: "appreciation",
        valueKeys: ["M", "A"],
        note: "Membahas jadwal belajar mingguan.",
        followUp: "watch_two_weeks",
        writer: { name: "Pengasuh Uji Daftar A", title: null },
      });
    });
  });

  it("gives Ketua Program Studi only the notes of students of their program, and their counts", async () => {
    await inTestDatabase(async (db) => {
      const { programA, programB } = await addRecords(db);
      const ofA = visibleFor(account(["head_of_program"], programA));
      const ofB = visibleFor(account(["head_of_program"], programB));

      const listA = await listNotes(db, ofA, null, 1);
      const listB = await listNotes(db, ofB, null, 1);

      expect(listA.notes.map((note) => note.studentName)).toEqual([
        "Daftar Uji Kedua",
        "Daftar Uji Pertama",
      ]);
      expect(listA.matching).toBe(2);
      expect(listA.counts).toMatchObject({
        individual_counselling: 1,
        appreciation: 1,
        parent_visit: 0,
      });
      expect(listB.notes.map((note) => note.studentName)).toEqual([
        "Daftar Uji Ketiga",
      ]);
    });
  });

  it("gives Ketua Program Studi without a program no note", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      expect(await studentsSeenBy(db, account(["head_of_program"]))).toEqual(
        [],
      );
    });
  });

  it("gives Pengasuh only the notes of students of the groups they hold today", async () => {
    await inTestDatabase(async (db) => {
      const { mentorA, mentorB } = await addRecords(db);
      const idle = await addTestAccount(db, "Pengasuh Uji Cadangan", [
        "mentor",
      ]);

      expect(await studentsSeenBy(db, mentorA)).toEqual([
        "Daftar Uji Kedua",
        "Daftar Uji Pertama",
      ]);
      expect(await studentsSeenBy(db, mentorB)).toEqual(["Daftar Uji Ketiga"]);
      expect(await studentsSeenBy(db, idle)).toEqual([]);
    });
  });

  it("lets the new mentor read the old notes under the earlier mentor's name, and the earlier mentor no more", async () => {
    await inTestDatabase(async (db) => {
      const { mentorA, mentorB, groupA } = await addRecords(db);

      await replaceTestMentor(db, groupA, mentorB.id, "2026-10-12");

      const list = await listNotes(db, visibleFor(mentorB), null, 1);
      expect(
        list.notes.map((note) => [note.studentName, note.writer.name]),
      ).toEqual([
        ["Daftar Uji Ketiga", "Pengasuh Uji Daftar B"],
        ["Daftar Uji Kedua", "Pengasuh Uji Daftar A"],
        ["Daftar Uji Pertama", "Pengasuh Uji Daftar A"],
      ]);
      expect(await studentsSeenBy(db, mentorA)).toEqual([]);
    });
  });

  it("joins the notes of Pengasuh who is also Ketua Program Studi: own mentees and own program", async () => {
    await inTestDatabase(async (db) => {
      const { mentorA, programB } = await addRecords(db);
      const both: AccountForAccess = {
        ...mentorA,
        roles: ["mentor", "head_of_program"],
        studyProgramId: programB,
      };

      expect(await studentsSeenBy(db, both)).toEqual([
        "Daftar Uji Ketiga",
        "Daftar Uji Kedua",
        "Daftar Uji Pertama",
      ]);
    });
  });

  it("keeps Pengasuh who is also Pegawai UPK or Konselor to the notes of their mentees", async () => {
    await inTestDatabase(async (db) => {
      const { mentorB } = await addRecords(db);
      for (const wide of ["upk_staff", "counsellor", "assessor"] as const) {
        const both = { ...mentorB, roles: ["mentor", wide] as RoleId[] };

        expect(await studentsSeenBy(db, both)).toEqual(["Daftar Uji Ketiga"]);
      }
    });
  });

  it("leaves out the notes of a student who was removed", async () => {
    await inTestDatabase(async (db) => {
      const { mentorA, programA, groupA } = await addRecords(db);
      const removed = await addTestStudent(db, programA, {
        nim: "9961000204",
        name: "Daftar Uji Dihapus",
        deletedAt: new Date(),
      });
      await addTestMembers(db, groupA, [removed]);
      await addTestNote(db, removed, mentorA.id);

      const seen = await studentsSeenBy(db, mentorA);

      expect(seen).not.toContain("Daftar Uji Dihapus");
      expect(seen).toHaveLength(2);
    });
  });

  it("says of each note whether the account may open the student's detail", async () => {
    await inTestDatabase(async (db) => {
      const { mentorA, programA } = await addRecords(db);
      const everyNote = visibleFor(account(["head_of_unit"]));
      const ownProgram = visibleTo({
        kind: "some",
        studyProgramIds: [programA],
        menteesOf: [],
        studentIds: [],
      });

      const linked = await listNotes(db, everyNote, null, 1, ownProgram);
      const plain = await listNotes(db, visibleFor(mentorA), null, 1, null);

      const opened = linked.notes
        .filter((note) => note.opensDetail)
        .map((note) => note.studentName);
      expect(opened).toEqual(["Daftar Uji Kedua", "Daftar Uji Pertama"]);
      expect(linked.notes.some((note) => !note.opensDetail)).toBe(true);
      expect(plain.notes.map((note) => note.opensDetail)).toEqual([
        false,
        false,
      ]);
    });
  });

  it("narrows the list to a kind, and keeps the count of every kind", async () => {
    await inTestDatabase(async (db) => {
      const { mentorA } = await addRecords(db);

      const list = await listNotes(
        db,
        visibleFor(mentorA),
        "individual_counselling",
        1,
      );

      expect(list.notes.map((note) => note.studentName)).toEqual([
        "Daftar Uji Pertama",
      ]);
      expect(list.matching).toBe(1);
      expect(list.counts).toEqual({
        individual_counselling: 1,
        group_mentoring: 0,
        appreciation: 1,
        attendance_monitoring: 0,
        discipline_guidance: 0,
        parent_visit: 0,
      });
    });
  });

  it("gives an empty list and zero counts when there is no note", async () => {
    await inTestDatabase(async (db) => {
      const idle = await addTestAccount(db, "Pengasuh Uji Kosong", ["mentor"]);

      const list = await listNotes(db, visibleFor(idle), null, 1);

      expect(list.notes).toEqual([]);
      expect(list.matching).toBe(0);
      expect(list.page).toBe(1);
      expect(Object.values(list.counts)).toEqual([0, 0, 0, 0, 0, 0]);
    });
  });

  it("shows 20 notes on a page, and the last page for a page that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { mentorB, third } = await addRecords(db);
      for (let place = 0; place < NOTES_PAGE_SIZE; place++) {
        await addTestNote(db, third, mentorB.id, {
          writtenAt: new Date(Date.UTC(2026, 9, 4, 0, place)),
        });
      }
      const visible = visibleFor(mentorB);

      const firstPage = await listNotes(db, visible, null, 1);
      const secondPage = await listNotes(db, visible, null, 2);
      const beyond = await listNotes(db, visible, null, 9);

      expect(NOTES_PAGE_SIZE).toBe(20);
      expect(firstPage.matching).toBe(21);
      expect(firstPage.notes).toHaveLength(20);
      expect(secondPage.notes).toHaveLength(1);
      expect(beyond.page).toBe(2);
      expect(beyond.notes).toHaveLength(1);
    });
  });
});

describe("noteRowsFor", () => {
  it.each(OTHER_ROLES)("gives %s no notes at all", (role) => {
    expect(noteRowsFor(account([role], 1))).toBeNull();
  });

  it("gives no notes to an account with no roles", () => {
    expect(noteRowsFor(account([]))).toBeNull();
  });

  it("keeps the count of other roles at 13, Pegawai UPK and Mahasiswa among them", () => {
    expect(OTHER_ROLES).toHaveLength(13);
    expect(OTHER_ROLES).toContain("upk_staff");
    expect(OTHER_ROLES).toContain("student");
  });
});
