import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { formAssignment } from "./form-assignment";
import { readAssignment } from "./stored-assignment";
import {
  addTestActor,
  addTestProgram,
  addTestStudents,
  onlyProgram,
} from "./test-records";
import { EVERY_ROW } from "./visible-assignments";

const inTestDatabase = withTestDatabase();

const YEAR = 2047;

/** A draft with one group of 3 students in each of two programs. */
async function addDraft(db: Database): Promise<{ own: number; other: number }> {
  const own = await addTestProgram(db, "UJISIMPAN");
  const other = await addTestProgram(db, "UJISIMPAN2");
  await addTestStudents(db, own, 3, 9947000001, {
    cohortYear: YEAR,
    province: "Jawa Barat",
    className: "1-01",
  });
  await addTestStudents(db, other, 3, 9947000101, { cohortYear: YEAR });
  const actor = await addTestActor(db, ["upk_staff"], "Pegawai Uji Simpan");
  const formed = await formAssignment(db, actor, {
    cohortYear: YEAR,
    targetSize: 30,
    method: "by_nim",
    version: 0,
  });
  if (!formed.ok) throw new Error(formed.error);
  return { own, other };
}

describe("readAssignment", () => {
  it("gives nothing for an angkatan without a penetapan", async () => {
    await inTestDatabase(async (db) => {
      expect(await readAssignment(db, EVERY_ROW, YEAR)).toBeNull();
    });
  });

  it("gives the draft with its groups by program, their members by name and its log", async () => {
    await inTestDatabase(async (db) => {
      await addDraft(db);

      const draft = await readAssignment(db, EVERY_ROW, YEAR);

      expect(draft).toMatchObject({
        cohortYear: YEAR,
        status: "draft",
        decreeNumber: null,
        effectiveOn: null,
        version: 1,
      });
      expect(draft?.groups.map((group) => group.programName)).toEqual([
        "UJISIMPAN",
        "UJISIMPAN2",
      ]);
      expect(draft?.groups[0]?.members).toEqual([
        {
          id: expect.any(String),
          nim: "9947000001",
          name: "Mahasiswa Uji 9947000001",
          sex: "female",
          province: "Jawa Barat",
          className: "1-01",
        },
        expect.objectContaining({ nim: "9947000002", sex: "male" }),
        expect.objectContaining({ nim: "9947000003" }),
      ]);
      expect(draft?.log).toEqual([
        {
          id: expect.any(String),
          at: expect.any(Date),
          action: "groups_formed",
          by: "Pegawai Uji Simpan",
        },
      ]);
    });
  });

  it("leaves the log unread for a caller that does not show it", async () => {
    await inTestDatabase(async (db) => {
      await addDraft(db);

      const draft = await readAssignment(db, EVERY_ROW, YEAR, false);

      expect(draft?.groups).toHaveLength(2);
      expect(draft?.log).toEqual([]);
    });
  });

  it("gives a head of a study program the groups and members of that program only", async () => {
    await inTestDatabase(async (db) => {
      const { own } = await addDraft(db);

      const draft = await readAssignment(db, onlyProgram(own), YEAR);

      expect(draft?.groups).toHaveLength(1);
      expect(draft?.groups[0]).toMatchObject({ studyProgramId: own });
      expect(draft?.groups[0]?.members).toHaveLength(3);
    });
  });
});
