import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignments,
  mentorGroups,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type CheckedGroup,
  checkGroupFits,
  GROUP_DOES_NOT_FIT,
  GROUP_NOT_AVAILABLE,
  holdFittingGroup,
  parseGroupChoice,
  type StudentCohort,
} from "./fitting-group";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const FITS = { ok: true, value: null };
const GROUP_ID = "00000000-0000-4000-8000-000000000026";

const STUDENT: StudentCohort = {
  cohortYear: 2026,
  studyProgramId: 3,
  entryPath: "regular",
};

const GROUP: CheckedGroup = { ...STUDENT, endedAt: null };

describe("parseGroupChoice", () => {
  it("reads the empty choice as no group", () => {
    expect(parseGroupChoice("")).toEqual({ ok: true, value: null });
  });

  it("takes an id", () => {
    expect(parseGroupChoice(GROUP_ID)).toEqual({ ok: true, value: GROUP_ID });
  });

  it("refuses what has not the shape of an id", () => {
    expect(parseGroupChoice("KP 26-D3PJK-01")).toEqual(GROUP_NOT_AVAILABLE);
    expect(parseGroupChoice("1 or 1=1")).toEqual(GROUP_NOT_AVAILABLE);
  });
});

describe("checkGroupFits", () => {
  it("takes a group in force of the student's angkatan, program studi and jalur", () => {
    expect(checkGroupFits(GROUP, STUDENT)).toEqual(FITS);
  });

  it("refuses a group that is not there", () => {
    expect(checkGroupFits(undefined, STUDENT)).toEqual(GROUP_NOT_AVAILABLE);
  });

  it("refuses an ended group", () => {
    const ended = { ...GROUP, endedAt: new Date("2026-10-01T00:00:00Z") };

    expect(checkGroupFits(ended, STUDENT)).toEqual(GROUP_NOT_AVAILABLE);
  });

  it.each([
    ["angkatan", { cohortYear: 2025 }],
    ["program studi", { studyProgramId: 4 }],
    ["jalur", { entryPath: "transfer" as const }],
  ])("refuses a group of another %s", (_name, other) => {
    const group = { ...GROUP, ...other };

    expect(checkGroupFits(group, STUDENT)).toEqual(GROUP_DOES_NOT_FIT);
  });
});

/** A program studi with one group in force, and the student it would take. */
async function addGroup(db: Database, tag: string) {
  const program = await addTestProgram(db, `Prodi Cocok ${tag}`);
  const mentor = await addTestActor(db, `Pengasuh ${tag}`, ["mentor"]);
  const groupId = await addTestMentorGroup(db, program, {
    number: 1,
    memberIds: [],
    mentorId: mentor.id,
  });
  const student: StudentCohort = { ...STUDENT, studyProgramId: program };
  return { program, mentor, groupId, student };
}

describe("holdFittingGroup", () => {
  it("asks nothing when no group is chosen", async () => {
    await inTestDatabase(async (db) => {
      expect(await holdFittingGroup(db, null, STUDENT)).toEqual(FITS);
    });
  });

  it("takes a group in force that fits the student", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, student } = await addGroup(db, "Berlaku");

      expect(await holdFittingGroup(db, groupId, student)).toEqual(FITS);
    });
  });

  it("refuses a group of another angkatan, program studi or jalur", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, student } = await addGroup(db, "Lain");
      const otherProgram = await addTestProgram(db, "Prodi Cocok Kedua");
      const others: StudentCohort[] = [
        { ...student, cohortYear: 2025 },
        { ...student, studyProgramId: otherProgram },
        { ...student, entryPath: "transfer" },
      ];

      for (const other of others) {
        const held = await holdFittingGroup(db, groupId, other);
        expect(held).toEqual(GROUP_DOES_NOT_FIT);
      }
    });
  });

  it("refuses a group whose penetapan was cancelled", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, mentor, student } = await addGroup(db, "Batal");
      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: mentor.id })
        .where(eq(mentorGroups.id, groupId));

      const held = await holdFittingGroup(db, groupId, student);

      expect(held).toEqual(GROUP_NOT_AVAILABLE);
    });
  });

  it("refuses a group that is still a draft of a penetapan", async () => {
    await inTestDatabase(async (db) => {
      const { program, mentor, student } = await addGroup(db, "Draf");
      const [draft] = await db
        .insert(cohortAssignments)
        .values({
          cohortYear: 2026,
          targetSize: 30,
          method: "by_nim",
          savedAt: new Date(),
          savedBy: mentor.id,
        })
        .returning({ id: cohortAssignments.id });
      if (!draft) throw new Error("The draft was not added.");
      const [draftGroup] = await db
        .insert(cohortAssignmentGroups)
        .values({
          assignmentId: draft.id,
          studyProgramId: program,
          entryPath: "regular",
          number: 2,
        })
        .returning({ id: cohortAssignmentGroups.id });
      if (!draftGroup) throw new Error("The draft group was not added.");

      const held = await holdFittingGroup(db, draftGroup.id, student);

      expect(held).toEqual(GROUP_NOT_AVAILABLE);
    });
  });
});
