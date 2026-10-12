import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestGroupMembers,
  addTestLiveGroup,
  addTestProgram,
  addTestStudents,
  onlyProgram,
} from "./test-records";
import { EVERY_ROW } from "./visible-assignments";
import { readWaitingStudents } from "./waiting-students";

const inTestDatabase = withTestDatabase();

const YEAR = 2043;
const OF_YEAR = { cohortYear: YEAR };

describe("readWaitingStudents", () => {
  it("gives the Aktif students of the angkatan who are in no group, by NIM", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJITUNGGU");
      const [first, second] = await addTestStudents(
        db,
        program,
        2,
        9943000001,
        OF_YEAR,
      );

      const waiting = await readWaitingStudents(db, EVERY_ROW, YEAR);

      expect(waiting.map((student) => student.id)).toEqual([first, second]);
      expect(waiting[0]).toMatchObject({
        nim: "9943000001",
        programName: "UJITUNGGU",
        studyProgramId: program,
        entryPath: "regular",
      });
    });
  });

  it("leaves out a student on Cuti, a Non aktif one, a removed one and one of another angkatan", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJITUNGGU");
      const remover = await addTestStudents(db, program, 1, 9943000101, {
        cohortYear: 2040,
      });
      await addTestStudents(db, program, 1, 9943000102, {
        ...OF_YEAR,
        status: "on_leave",
      });
      await addTestStudents(db, program, 1, 9943000103, {
        ...OF_YEAR,
        status: "inactive",
      });
      await addTestStudents(db, program, 1, 9943000104, {
        ...OF_YEAR,
        deletedAt: new Date(),
      });

      const waiting = await readWaitingStudents(db, EVERY_ROW, YEAR);

      expect(remover).toHaveLength(1);
      expect(waiting).toEqual([]);
    });
  });

  it("leaves out a student of a group in force, and keeps one whose group is ended", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJITUNGGU");
      const [placed, freed] = await addTestStudents(
        db,
        program,
        2,
        9943000201,
        OF_YEAR,
      );
      const live = await addTestLiveGroup(db, program, { cohortYear: YEAR });
      const ended = await addTestLiveGroup(db, program, {
        cohortYear: YEAR,
        number: 2,
        isEnded: true,
      });
      await addTestGroupMembers(db, live, [placed ?? ""]);
      await addTestGroupMembers(db, ended, [freed ?? ""]);

      const waiting = await readWaitingStudents(db, EVERY_ROW, YEAR);

      expect(waiting.map((student) => student.id)).toEqual([freed]);
    });
  });

  it("gives a head of a study program the students of that program only", async () => {
    await inTestDatabase(async (db) => {
      const own = await addTestProgram(db, "UJITUNGGU");
      const other = await addTestProgram(db, "UJITUNGGU2");
      const mine = await addTestStudents(db, own, 2, 9943000301, OF_YEAR);
      await addTestStudents(db, other, 3, 9943000311, OF_YEAR);

      const seen = await readWaitingStudents(db, onlyProgram(own), YEAR);
      const none = await readWaitingStudents(
        db,
        { kind: "some", studyProgramIds: [], menteesOf: [], studentIds: [] },
        YEAR,
      );

      expect(seen.map((student) => student.id)).toEqual(mine);
      expect(none).toEqual([]);
    });
  });
});
