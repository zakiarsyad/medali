// Sample Tahun akademik of this file: 2900 to 2900.
// Sample NIMs of this file: 9937890000 to 9937890099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { overlapsOwn, readApprovedLeaves } from "./leave-store";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";
import { addApprovedLeave, campusAt } from "./test-returns";

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const [ani] = await addTestResidents(db, 2900, "Prodi Uji Simpan Izin", [
    "9937890001",
  ]);
  if (!ani) throw new Error("The resident was not added.");
  const manager = await addTestActor(db, "Pengelola Uji Simpan Izin", [
    "dorm_manager",
  ]);
  return { studentId: ani.studentId, managerId: manager.id };
}

/** Leave from 09:00 to 16:00 on 13 October 2900, Selesai at a time on campus. */
async function addReturned(db: Database, returnedAt: string) {
  const { studentId, managerId } = await addRecords(db);
  await addApprovedLeave(
    db,
    studentId,
    managerId,
    { startsAt: "2900-10-13T09:00", endsAt: "2900-10-13T16:00" },
    { status: "completed", returnedAt: campusAt(returnedAt) },
  );
  return studentId;
}

function spanOf(start: string, end: string) {
  return { start: campusAt(start), end: campusAt(end) };
}

describe("readApprovedLeaves", () => {
  it("covers a late resident up to their return, past the end of their leave", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addReturned(db, "2900-10-13T18:20");

      const leaves = await readApprovedLeaves(
        db,
        spanOf("2900-10-13T17:00", "2900-10-13T18:00"),
      );

      expect(leaves).toEqual([
        {
          studentId,
          kind: "special",
          start: campusAt("2900-10-13T09:00"),
          end: campusAt("2900-10-13T18:20"),
        },
      ]);
    });
  });

  it("no longer covers a resident who came back early, from their return", async () => {
    await inTestDatabase(async (db) => {
      await addReturned(db, "2900-10-13T12:00");

      const after = await readApprovedLeaves(
        db,
        spanOf("2900-10-13T13:00", "2900-10-13T14:00"),
      );
      const before = await readApprovedLeaves(
        db,
        spanOf("2900-10-13T11:00", "2900-10-13T11:30"),
      );

      expect(after).toEqual([]);
      expect(before).toHaveLength(1);
    });
  });

  it("covers approved leave that has no return up to its end", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, managerId } = await addRecords(db);
      await addApprovedLeave(db, studentId, managerId, {
        startsAt: "2900-10-13T09:00",
        endsAt: "2900-10-13T16:00",
      });

      const during = await readApprovedLeaves(
        db,
        spanOf("2900-10-13T15:00", "2900-10-13T15:30"),
      );
      const after = await readApprovedLeaves(
        db,
        spanOf("2900-10-13T16:00", "2900-10-13T17:00"),
      );

      expect(during).toHaveLength(1);
      expect(after).toEqual([]);
    });
  });
});

describe("overlapsOwn", () => {
  it("holds the time of leave that is Selesai up to its return only", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addReturned(db, "2900-10-13T12:00");

      expect(
        await overlapsOwn(
          db,
          studentId,
          spanOf("2900-10-13T11:00", "2900-10-13T13:00"),
        ),
      ).toBe(true);
      expect(
        await overlapsOwn(
          db,
          studentId,
          spanOf("2900-10-13T13:00", "2900-10-13T15:00"),
        ),
      ).toBe(false);
    });
  });
});
