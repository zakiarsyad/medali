import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  cohortAssignmentChanges,
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  cohortAssignments,
  mentorGroupMembers,
  mentorGroupPastMembers,
  mentorGroups,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const COHORT_YEAR = 2031;

async function addAccount(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Penetapan" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

async function addProgram(db: Database): Promise<number> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Penetapan", code: "UJIPT" })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return program.id;
}

async function addStudent(
  db: Database,
  studyProgramId: number,
): Promise<string> {
  const [student] = await db
    .insert(students)
    .values({
      nim: "9930310001",
      name: "Mahasiswi Uji Penetapan",
      studyProgramId,
      entryPath: "regular",
      sex: "female",
      cohortYear: COHORT_YEAR,
    })
    .returning();
  if (!student) throw new Error("The student was not added.");
  return student.id;
}

type NewAssignment = Partial<typeof cohortAssignments.$inferInsert>;

function addAssignment(
  db: Database,
  savedBy: string,
  more: NewAssignment = {},
) {
  return db
    .insert(cohortAssignments)
    .values({
      cohortYear: COHORT_YEAR,
      targetSize: 30,
      method: "balanced",
      savedAt: new Date(),
      savedBy,
      ...more,
    })
    .returning();
}

async function addAssignmentId(db: Database, savedBy: string): Promise<string> {
  const [assignment] = await addAssignment(db, savedBy);
  if (!assignment) throw new Error("The penetapan was not added.");
  return assignment.id;
}

async function addDraftGroup(
  db: Database,
  assignmentId: string,
  studyProgramId: number,
  number: number,
): Promise<string> {
  const [group] = await db
    .insert(cohortAssignmentGroups)
    .values({ assignmentId, studyProgramId, entryPath: "regular", number })
    .returning();
  if (!group) throw new Error("The draft group was not added.");
  return group.id;
}

async function addLogLine(db: Database): Promise<string> {
  const by = await addAccount(db);
  const assignmentId = await addAssignmentId(db, by);
  const [line] = await db
    .insert(cohortAssignmentChanges)
    .values({ assignmentId, changedBy: by, action: "draft_saved" })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

function addGroup(db: Database, studyProgramId: number, endedBy?: string) {
  return db
    .insert(mentorGroups)
    .values({
      studyProgramId,
      cohortYear: COHORT_YEAR,
      entryPath: "regular",
      number: 1,
      startsOn: "2031-09-01",
      endedAt: endedBy ? new Date() : null,
      endedBy: endedBy ?? null,
    })
    .returning();
}

describe("a penetapan", () => {
  it("starts as a draft at version 1, with no decree number and no day", async () => {
    await inTestDatabase(async (db) => {
      const [assignment] = await addAssignment(db, await addAccount(db));

      expect(assignment).toMatchObject({
        status: "draft",
        version: 1,
        decreeNumber: null,
        effectiveOn: null,
      });
    });
  });

  it("is refused a second time for one angkatan", async () => {
    await inTestDatabase(async (db) => {
      const by = await addAccount(db);
      await addAssignment(db, by);

      await expect(addAssignment(db, by)).rejects.toThrow();
    });
  });

  it("is refused a target size outside 25 to 35", async () => {
    await inTestDatabase(async (db) => {
      const by = await addAccount(db);

      await expect(addAssignment(db, by, { targetSize: 24 })).rejects.toThrow();
    });
  });

  it("is refused as fixed without a decree number or without its day", async () => {
    await inTestDatabase(async (db) => {
      const by = await addAccount(db);
      const fixed = { status: "fixed" } as const;

      await expect(
        db.transaction((tx) =>
          addAssignment(tx, by, { ...fixed, effectiveOn: "2031-09-01" }),
        ),
      ).rejects.toThrow();
      await expect(
        db.transaction((tx) =>
          addAssignment(tx, by, { ...fixed, decreeNumber: "KEP-1/UJI/2031" }),
        ),
      ).rejects.toThrow();
      const [whole] = await addAssignment(db, by, {
        ...fixed,
        decreeNumber: "KEP-1/UJI/2031",
        effectiveOn: "2031-09-01",
      });
      expect(whole?.status).toBe("fixed");
    });
  });
});

describe("the groups of a penetapan", () => {
  it("refuse a number used twice in one program studi and jalur", async () => {
    await inTestDatabase(async (db) => {
      const assignmentId = await addAssignmentId(db, await addAccount(db));
      const programId = await addProgram(db);
      await addDraftGroup(db, assignmentId, programId, 1);
      await addDraftGroup(db, assignmentId, programId, 2);

      await expect(
        addDraftGroup(db, assignmentId, programId, 2),
      ).rejects.toThrow();
    });
  });

  it("refuse a second group for one student", async () => {
    await inTestDatabase(async (db) => {
      const assignmentId = await addAssignmentId(db, await addAccount(db));
      const programId = await addProgram(db);
      const first = await addDraftGroup(db, assignmentId, programId, 1);
      const second = await addDraftGroup(db, assignmentId, programId, 2);
      const studentId = await addStudent(db, programId);
      await db
        .insert(cohortAssignmentMembers)
        .values({ studentId, groupId: first });

      const again = db
        .insert(cohortAssignmentMembers)
        .values({ studentId, groupId: second });
      await expect(again).rejects.toThrow();
    });
  });
});

describe("the log of a penetapan", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const change = db
        .update(cohortAssignmentChanges)
        .set({ action: "fixed" })
        .where(eq(cohortAssignmentChanges.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const removal = db
        .delete(cohortAssignmentChanges)
        .where(eq(cohortAssignmentChanges.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate cohort_assignment_changes`),
      ).rejects.toThrow();
    });
  });
});

describe("an ended mentor group", () => {
  it("is refused without who ended it, or without when", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addProgram(db);
      const by = await addAccount(db);
      const whenOnly = { endedAt: new Date(), endedBy: null };
      const whoOnly = { endedAt: null, endedBy: by };

      for (const half of [whenOnly, whoOnly]) {
        const [group] = await addGroup(db, programId);
        const ending = db.transaction((tx) =>
          tx
            .update(mentorGroups)
            .set(half)
            .where(eq(mentorGroups.id, group?.id ?? "")),
        );
        await expect(ending).rejects.toThrow();
        await db
          .delete(mentorGroups)
          .where(eq(mentorGroups.id, group?.id ?? ""));
      }
    });
  });

  it("leaves its number free for a new group, which no second one may take", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addProgram(db);
      const by = await addAccount(db);
      await addGroup(db, programId, by);
      await addGroup(db, programId, by);

      const [live] = await addGroup(db, programId);
      expect(live?.endedAt).toBe(null);
      await expect(addGroup(db, programId)).rejects.toThrow();
    });
  });

  it("keeps who its members were, each free for a new group", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addProgram(db);
      const by = await addAccount(db);
      const studentId = await addStudent(db, programId);
      const [ended] = await addGroup(db, programId, by);
      const [live] = await addGroup(db, programId);
      if (!ended || !live) throw new Error("The groups were not added.");

      await db
        .insert(mentorGroupPastMembers)
        .values({ groupId: ended.id, studentId });
      await db
        .insert(mentorGroupMembers)
        .values({ groupId: live.id, studentId });

      const again = db
        .insert(mentorGroupPastMembers)
        .values({ groupId: ended.id, studentId });
      await expect(again).rejects.toThrow();
    });
  });
});
