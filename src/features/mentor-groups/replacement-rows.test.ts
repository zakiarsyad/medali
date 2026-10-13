import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestReplacement } from "@/mentoring/test-replacements";
import { LISTED_REPLACEMENTS, listReplacements } from "./replacement-rows";
import { addTestEvaluator, addTestHeldGroup } from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestMembersWithStatus,
  addTestMentor,
} from "./test-records";

const inTestDatabase = withTestDatabase();

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

/** A held group of a program of its own, a spare mentor, and Kepala Unit. */
async function addRecords(db: Database, program = "UJIRIWAYAT") {
  const held = await addTestHeldGroup(db, program, `Lama ${program}`);
  const newMentorId = await addTestMentor(db, { name: `Baru ${program}` });
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Riwayat");
  const replacement = {
    groupId: held.groupId,
    oldMentorId: held.mentorId,
    newMentorId,
    setBy: head.id,
  };
  return {
    held,
    head,
    replacement,
    limit: onlyPrograms([held.studyProgramId]),
  };
}

describe("listReplacements", () => {
  it("shows the date, the group and its Aktif students, both mentors, the old one's new status, the reason, the note, the letter and the status", async () => {
    await inTestDatabase(async (db) => {
      const { held, replacement, limit } = await addRecords(db);
      await addTestMembersWithStatus(
        db,
        { id: held.groupId, studyProgramId: held.studyProgramId },
        9977100001,
        ["active", "active", "on_leave"],
      );
      const id = await addTestReplacement(db, {
        ...replacement,
        startsOn: "2087-03-10",
        reason: "study_leave",
        oldMentorStatus: "inactive",
        letterNumber: "KEP-9/UJI/2087",
        note: "Tugas belajar dua tahun.",
        carriedOutAt: new Date("2087-03-10T02:00:00Z"),
      });

      expect(await listReplacements(db, limit)).toEqual([
        {
          id,
          startsOn: "2087-03-10",
          group: {
            id: held.groupId,
            studyProgramId: held.studyProgramId,
            cohortYear: 2026,
            entryPath: "regular",
            number: 1,
            programCode: "UJIRIWAYAT",
          },
          members: 2,
          oldMentorName: "Lama UJIRIWAYAT",
          oldMentorStatus: "inactive",
          newMentorName: "Baru UJIRIWAYAT",
          reason: "study_leave",
          note: "Tugas belajar dua tahun.",
          letterNumber: "KEP-9/UJI/2087",
          status: "in_force",
          cancelled: null,
        },
      ]);
    });
  });

  it("puts the latest start date first, and of one day the one set last", async () => {
    await inTestDatabase(async (db) => {
      const { replacement, limit } = await addRecords(db);
      const done = { carriedOutAt: new Date("2087-01-01T02:00:00Z") };
      const older = await addTestReplacement(db, {
        ...replacement,
        ...done,
        startsOn: "2087-03-10",
        setAt: new Date("2087-03-01T02:00:00Z"),
      });
      const setFirst = await addTestReplacement(db, {
        ...replacement,
        ...done,
        startsOn: "2087-05-20",
        setAt: new Date("2087-05-01T02:00:00Z"),
      });
      const setLast = await addTestReplacement(db, {
        ...replacement,
        ...done,
        startsOn: "2087-05-20",
        setAt: new Date("2087-05-02T02:00:00Z"),
      });

      const rows = await listReplacements(db, limit);

      expect(rows.map((row) => row.id)).toEqual([setLast, setFirst, older]);
    });
  });

  it("gives each its status: Terjadwal while it waits, Berlaku once carried out, Dibatalkan with who and when", async () => {
    await inTestDatabase(async (db) => {
      const { head, replacement, limit } = await addRecords(db);
      const cancelledAt = new Date("2087-02-02T03:00:00Z");
      await addTestReplacement(db, { ...replacement, startsOn: "2087-09-01" });
      await addTestReplacement(db, {
        ...replacement,
        startsOn: "2087-03-10",
        carriedOutAt: new Date("2087-03-10T02:00:00Z"),
      });
      await addTestReplacement(db, {
        ...replacement,
        startsOn: "2087-02-10",
        cancelledBy: head.id,
        cancelledAt,
      });

      const rows = await listReplacements(db, limit);

      expect(rows.map((row) => [row.status, row.cancelled])).toEqual([
        ["scheduled", null],
        ["in_force", null],
        ["cancelled", { by: "Kepala Riwayat", at: cancelledAt }],
      ]);
    });
  });

  it("shows a head of a study program only the replacements of the groups of that program", async () => {
    await inTestDatabase(async (db) => {
      const own = await addRecords(db);
      const other = await addRecords(db, "UJIRIWAYATLAIN");
      const ownId = await addTestReplacement(db, own.replacement);
      const otherId = await addTestReplacement(db, other.replacement);
      const everyone: RowLimit = { kind: "all" };

      const ofOwn = await listReplacements(db, own.limit);
      const ofNone = await listReplacements(db, onlyPrograms([]));
      const ofAll = await listReplacements(db, everyone);

      expect(ofOwn.map((row) => row.id)).toEqual([ownId]);
      expect(ofNone).toEqual([]);
      expect(ofAll.map((row) => row.id)).toEqual(
        expect.arrayContaining([ownId, otherId]),
      );
    });
  });

  it("leaves out the replacement of a group that is ended", async () => {
    await inTestDatabase(async (db) => {
      const { held, replacement, limit } = await addRecords(db);
      const ended = await addTestEndedGroup(db, held.studyProgramId, {
        number: 2,
      });
      await addTestReplacement(db, { ...replacement, groupId: ended });

      expect(await listReplacements(db, limit)).toEqual([]);
    });
  });

  it("shows the 20 with the latest start date and no more", async () => {
    await inTestDatabase(async (db) => {
      const { replacement, limit } = await addRecords(db);
      for (let day = 1; day <= LISTED_REPLACEMENTS + 1; day += 1) {
        await addTestReplacement(db, {
          ...replacement,
          startsOn: `2087-03-${String(day).padStart(2, "0")}`,
          carriedOutAt: new Date("2087-03-01T02:00:00Z"),
        });
      }

      const rows = await listReplacements(db, limit);

      expect(rows).toHaveLength(LISTED_REPLACEMENTS);
      expect(rows.at(-1)?.startsOn).toBe("2087-03-02");
    });
  });
});
