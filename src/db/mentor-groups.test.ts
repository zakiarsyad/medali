import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const STARTS_ON = "2024-09-01";

async function addProgram(db: Database): Promise<number> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Tabel Kelompok", code: "UJIKP" })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return program.id;
}

async function addGroup(
  db: Database,
  studyProgramId: number,
  number = 1,
): Promise<string> {
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId,
      cohortYear: 2024,
      entryPath: "regular",
      number,
      startsOn: STARTS_ON,
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  return group.id;
}

async function addStudent(
  db: Database,
  studyProgramId: number,
): Promise<string> {
  const [student] = await db
    .insert(students)
    .values({
      nim: "9930240001",
      name: "Mahasiswi Uji Kelompok",
      studyProgramId,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2024,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return student.id;
}

async function addMentor(db: Database, name: string): Promise<string> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

describe("the study programs", () => {
  it("refuse a code that another one has", async () => {
    await inTestDatabase(async (db) => {
      await addProgram(db);

      const again = db
        .insert(studyPrograms)
        .values({ name: "Prodi Uji Tabel Kelompok Lain", code: "UJIKP" });
      await expect(again).rejects.toThrow();
    });
  });
});

describe("the mentor groups", () => {
  it("refuse a number used twice in one program studi, angkatan and jalur", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addProgram(db);
      await addGroup(db, programId, 1);
      await addGroup(db, programId, 2);

      await expect(addGroup(db, programId, 2)).rejects.toThrow();
    });
  });

  it("refuse a second group for one student", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addProgram(db);
      const first = await addGroup(db, programId, 1);
      const second = await addGroup(db, programId, 2);
      const studentId = await addStudent(db, programId);
      await db.insert(mentorGroupMembers).values({ studentId, groupId: first });

      const again = db
        .insert(mentorGroupMembers)
        .values({ studentId, groupId: second });
      await expect(again).rejects.toThrow();
    });
  });

  it("refuse to be erased while they have members", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addProgram(db);
      const groupId = await addGroup(db, programId);
      const studentId = await addStudent(db, programId);
      await db.insert(mentorGroupMembers).values({ studentId, groupId });

      await expect(db.delete(mentorGroups)).rejects.toThrow();
    });
  });
});

describe("the mentors of a group", () => {
  it("are one of today after any number of earlier ones", async () => {
    await inTestDatabase(async (db) => {
      const groupId = await addGroup(db, await addProgram(db));
      const earlier = await addMentor(db, "Pengasuh Uji Awal");
      const current = await addMentor(db, "Pengasuh Uji Kini");

      const added = await db
        .insert(mentorGroupMentors)
        .values([
          {
            groupId,
            mentorId: earlier,
            startsOn: STARTS_ON,
            endsOn: "2025-08-31",
            endReason: "Mutasi",
          },
          { groupId, mentorId: current, startsOn: "2025-09-01" },
        ])
        .returning();

      expect(added).toHaveLength(2);
    });
  });

  it("refuse a second mentor of today for one group", async () => {
    await inTestDatabase(async (db) => {
      const groupId = await addGroup(db, await addProgram(db));
      const first = await addMentor(db, "Pengasuh Uji Awal");
      const second = await addMentor(db, "Pengasuh Uji Kini");
      await db
        .insert(mentorGroupMentors)
        .values({ groupId, mentorId: first, startsOn: STARTS_ON });

      const again = db
        .insert(mentorGroupMentors)
        .values({ groupId, mentorId: second, startsOn: "2025-09-01" });
      await expect(again).rejects.toThrow();
    });
  });

  it("refuse a last day before the first day", async () => {
    await inTestDatabase(async (db) => {
      const groupId = await addGroup(db, await addProgram(db));
      const mentorId = await addMentor(db, "Pengasuh Uji Awal");

      const added = db.insert(mentorGroupMentors).values({
        groupId,
        mentorId,
        startsOn: STARTS_ON,
        endsOn: "2024-08-31",
      });
      await expect(added).rejects.toThrow();
    });
  });

  it("refuse a reason for the end while the mentor has not ended", async () => {
    await inTestDatabase(async (db) => {
      const groupId = await addGroup(db, await addProgram(db));
      const mentorId = await addMentor(db, "Pengasuh Uji Awal");

      const added = db.insert(mentorGroupMentors).values({
        groupId,
        mentorId,
        startsOn: STARTS_ON,
        endReason: "Mutasi",
      });
      await expect(added).rejects.toThrow();
    });
  });
});
