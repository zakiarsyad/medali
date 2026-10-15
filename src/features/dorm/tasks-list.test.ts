// Sample Tahun akademik of this file: 3310 to 3310.
// Sample NIMs of this file: 9986109000 to 9986109099.
// Room numbers of this file: NT101 to NT199.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import type { DormClarificationStatus } from "./clarification-ids";
import type { CountMarks } from "./count-ids";
import { TASKS_SHOWN } from "./tasks-card";
import { countDormTasks, readDormTasks } from "./tasks-list";
import { addTestActivity } from "./test-activities";
import { addTestClarification, addTestCount } from "./test-clarifications";
import { addTestDuty, judgedBy } from "./test-cleaning";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";
import { addApprovedLeave, addTestReport, campusAt } from "./test-returns";

const inTestDatabase = withTestDatabase();

// 17:00 on campus on 13 October 3310.
const NOW = campusAt("3310-10-13T17:00");

const WAITING = {
  status: "submitted",
  decidedBy: null,
  decidedAt: null,
} as const;

async function addRecords(db: Database, residentCount = 4) {
  const nims = Array.from(
    { length: residentCount },
    (_, place) => `99861090${String(place + 1).padStart(2, "0")}`,
  );
  const residents = await addTestResidents(db, 3310, "Prodi Uji Tugas", nims);
  const manager = await addTestActor(db, "Pengelola Uji Tugas", [
    "dorm_manager",
  ]);
  const bam = await addTestActor(db, "BAM Uji Tugas", ["bam_bphk"]);
  return { residents: residents.map((each) => each.studentId), manager, bam };
}

function idAt(ids: string[], place: number): string {
  const found = ids[place];
  if (found === undefined) throw new Error("There is no such resident.");
  return found;
}

/**
 * A clarification of an absence at one activity for each of the first
 * residents, as `each` says, with what its status needs done by `bamId`.
 */
async function addClarifications(
  db: Database,
  residents: string[],
  bamId: string,
  each: {
    status: DormClarificationStatus;
    sentAt?: Date;
    fileKey?: string;
  }[],
): Promise<string[]> {
  const activityId = await addTestActivity(db, bamId, {
    versions: [{ startsOn: "3310-10-01" }],
  });
  const marks: CountMarks = {};
  for (const studentId of residents) {
    marks[studentId] = { isAbsent: true, note: "" };
  }
  const countId = await addTestCount(db, {
    activityId,
    day: "3310-10-12",
    byId: bamId,
    marks,
  });
  const ids: string[] = [];
  for (const [place, clarification] of each.entries()) {
    ids.push(
      await addTestClarification(db, bamId, {
        countId,
        studentId: idAt(residents, place),
        ...clarification,
      }),
    );
  }
  return ids;
}

function accountOf(id: string, roles: RoleId[]) {
  return { id, roles, studyProgramId: null, studentId: null };
}

describe("readDormTasks", () => {
  it("lists the leave requests that wait, the earliest start first, and marks a start that has passed", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager } = await addRecords(db);
      const later = await addApprovedLeave(
        db,
        idAt(residents, 0),
        manager.id,
        { startsAt: "3310-10-15T09:00", endsAt: "3310-10-15T16:00" },
        WAITING,
      );
      const passed = await addApprovedLeave(
        db,
        idAt(residents, 1),
        manager.id,
        { startsAt: "3310-10-13T09:00", endsAt: "3310-10-14T16:00" },
        WAITING,
      );
      await addApprovedLeave(db, idAt(residents, 2), manager.id, {
        startsAt: "3310-10-14T09:00",
        endsAt: "3310-10-14T16:00",
      });

      const tasks = await readDormTasks(
        db,
        accountOf(manager.id, manager.roles),
        NOW,
      );

      expect(tasks.leaves?.total).toBe(2);
      expect(tasks.leaves?.items.map((item) => item.id)).toEqual([
        passed,
        later,
      ]);
      expect(tasks.leaves?.items[0]).toMatchObject({
        nim: "9986109002",
        kind: "special",
        start: "13 Okt 3310, 09.00",
        end: "14 Okt 3310, 16.00",
        purpose: "Urusan keluarga: Urusan keluarga uji",
        destination: "Jakarta",
        startPassed: true,
      });
      expect(tasks.leaves?.items[1]?.startPassed).toBe(false);
    });
  });

  it("shows the 20 oldest of a long section, and counts them all", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager } = await addRecords(db);
      const ids: string[] = [];
      for (let day = 1; day <= TASKS_SHOWN + 2; day += 1) {
        const date = `3310-11-${String(day).padStart(2, "0")}`;
        ids.push(
          await addApprovedLeave(
            db,
            idAt(residents, 0),
            manager.id,
            { startsAt: `${date}T09:00`, endsAt: `${date}T16:00` },
            WAITING,
          ),
        );
      }

      const tasks = await readDormTasks(
        db,
        accountOf(manager.id, manager.roles),
        NOW,
      );

      expect(tasks.leaves?.total).toBe(TASKS_SHOWN + 2);
      expect(tasks.leaves?.items.map((item) => item.id)).toEqual(
        ids.slice(0, TASKS_SHOWN),
      );
    });
  });

  it("lists only the reports BAM verified, the earliest sent first, with how late and Catatan BAM", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager, bam } = await addRecords(db);
      const times = {
        startsAt: "3310-10-13T09:00",
        endsAt: "3310-10-13T16:00",
      };
      const leaves: string[] = [];
      for (let place = 0; place < 4; place += 1) {
        leaves.push(
          await addApprovedLeave(db, idAt(residents, place), manager.id, times),
        );
      }
      const checked = { verifiedBy: bam.id, verifiedAt: NOW };
      const late = await addTestReport(
        db,
        idAt(leaves, 0),
        "3310-10-13T16:20",
        { ...checked, status: "verified", verifyNote: "Foto jelas." },
      );
      const early = await addTestReport(
        db,
        idAt(leaves, 1),
        "3310-10-13T15:50",
        { ...checked, status: "verified", photoKey: null },
      );
      await addTestReport(db, idAt(leaves, 2), "3310-10-13T15:40");
      await addTestReport(db, idAt(leaves, 3), "3310-10-13T15:30", {
        ...checked,
        status: "rejected",
        verifyNote: "Foto buram.",
      });

      const tasks = await readDormTasks(
        db,
        accountOf(manager.id, manager.roles),
        NOW,
      );

      expect(tasks.returns?.total).toBe(2);
      expect(tasks.returns?.items).toEqual([
        expect.objectContaining({
          reportId: early,
          deadline: "13 Okt 3310, 16.00",
          reportedAt: "13 Okt 3310, 15.50",
          lateMinutes: 0,
          bamNote: "",
          hasPhoto: false,
        }),
        expect.objectContaining({
          reportId: late,
          lateMinutes: 20,
          bamNote: "Foto jelas.",
          hasPhoto: true,
        }),
      ]);
    });
  });

  it("counts the residents still out past their return time, and no one back, reported or out on time", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager } = await addRecords(db);
      const late = { startsAt: "3310-10-13T09:00", endsAt: "3310-10-13T16:00" };
      await addApprovedLeave(db, idAt(residents, 0), manager.id, late);
      const reported = await addApprovedLeave(
        db,
        idAt(residents, 1),
        manager.id,
        late,
      );
      await addTestReport(db, reported, "3310-10-13T16:30");
      await addApprovedLeave(db, idAt(residents, 2), manager.id, late, {
        status: "completed",
        returnedAt: campusAt("3310-10-13T16:40"),
      });
      await addApprovedLeave(db, idAt(residents, 3), manager.id, {
        startsAt: "3310-10-13T09:00",
        endsAt: "3310-10-13T20:00",
      });

      const tasks = await readDormTasks(
        db,
        accountOf(manager.id, manager.roles),
        NOW,
      );

      expect(tasks.outLate).toBe(1);
    });
  });

  it("lists only the clarifications BAM passed on, the earliest sent first, as their cards show them", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager, bam } = await addRecords(db);
      const ids = await addClarifications(db, residents, bam.id, [
        { status: "verified", sentAt: new Date("3310-10-13T05:00:00Z") },
        {
          status: "verified",
          sentAt: new Date("3310-10-13T03:00:00Z"),
          fileKey: "dorm-clarifications/uji-tugas.pdf",
        },
        { status: "submitted" },
        { status: "accepted" },
      ]);

      const tasks = await readDormTasks(
        db,
        accountOf(manager.id, manager.roles),
        NOW,
      );

      expect(tasks.clarifications?.total).toBe(2);
      expect(tasks.clarifications?.items.map((item) => item.id)).toEqual([
        idAt(ids, 1),
        idAt(ids, 0),
      ]);
      expect(tasks.clarifications?.items[0]).toMatchObject({
        nim: "9986109002",
        status: "verified",
        reason: "Sakit",
        explanation: "Demam dan beristirahat di kamar.",
        file: { name: "surat-keterangan.pdf" },
        verification: { result: "Diterima BAM" },
        decision: null,
      });
    });
  });

  it("lists the cleaning duties BAM assessed, of every dorm, the earliest date first, with the place, the room and who assessed", async () => {
    await inTestDatabase(async (db) => {
      const { bam, manager } = await addRecords(db);
      const later = await addTestDuty(
        db,
        { room: "NT101", place: "Lorong Uji Tugas NT101" },
        { ...judgedBy(bam.id, "not_met"), day: "3310-10-12" },
      );
      const ownRoom = await addTestDuty(
        db,
        { room: "NT102", place: "Lorong Uji Tugas NT102" },
        { ...judgedBy(bam.id, "met"), day: "3310-10-11", placeId: null },
      );
      await addTestDuty(
        db,
        { room: "NT103", place: "Lorong Uji Tugas NT103" },
        { day: "3310-10-10" },
      );

      const tasks = await readDormTasks(
        db,
        accountOf(manager.id, manager.roles),
        NOW,
      );

      expect(tasks.cleaning?.total).toBe(2);
      expect(tasks.cleaning?.items).toEqual([
        expect.objectContaining({
          id: ownRoom.id,
          day: "11 Okt 3310",
          place: "Kamar NT102 (kamar sendiri)",
          room: "Dana Rakca · Kamar NT102",
          result: "met",
          judgeNote: "",
        }),
        expect.objectContaining({
          id: later.id,
          place: "Lorong Uji Tugas NT101",
          result: "not_met",
          judgeNote: "Lantai belum dipel.",
          judgedByName: "BAM Uji Tugas",
        }),
      ]);
    });
  });

  it("gives BAM - BPHK and Kepala Unit no section, as they decide neither", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager, bam } = await addRecords(db);
      await addApprovedLeave(
        db,
        idAt(residents, 0),
        manager.id,
        { startsAt: "3310-10-15T09:00", endsAt: "3310-10-15T16:00" },
        WAITING,
      );

      const ofBam = await readDormTasks(db, accountOf(bam.id, bam.roles), NOW);
      const ofHead = await readDormTasks(
        db,
        accountOf(manager.id, ["head_of_unit"]),
        NOW,
      );

      for (const tasks of [ofBam, ofHead]) {
        expect(tasks.leaves).toBeNull();
        expect(tasks.returns).toBeNull();
        expect(tasks.clarifications).toBeNull();
        expect(tasks.cleaning).toBeNull();
      }
    });
  });
});

describe("countDormTasks", () => {
  it("counts the waiting requests and verified reports for Pengelola Asrama, and nothing for a role that decides neither", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager, bam } = await addRecords(db);
      await addApprovedLeave(
        db,
        idAt(residents, 0),
        manager.id,
        { startsAt: "3310-10-15T09:00", endsAt: "3310-10-15T16:00" },
        WAITING,
      );
      const times = {
        startsAt: "3310-10-13T09:00",
        endsAt: "3310-10-13T16:00",
      };
      const verified = await addApprovedLeave(
        db,
        idAt(residents, 1),
        manager.id,
        times,
      );
      await addTestReport(db, verified, "3310-10-13T15:50", {
        status: "verified",
        verifiedBy: bam.id,
        verifiedAt: NOW,
      });
      const forBam = await addApprovedLeave(
        db,
        idAt(residents, 2),
        manager.id,
        times,
      );
      await addTestReport(db, forBam, "3310-10-13T15:50");
      await addApprovedLeave(db, idAt(residents, 3), manager.id, times);

      expect(
        await countDormTasks(db, accountOf(manager.id, manager.roles), NOW),
      ).toBe(2);
      expect(await countDormTasks(db, accountOf(bam.id, bam.roles), NOW)).toBe(
        0,
      );
      expect(
        await countDormTasks(db, accountOf(manager.id, ["head_of_unit"]), NOW),
      ).toBe(0);
    });
  });

  it("counts the clarifications BAM passed on and the cleaning duties BAM assessed, and none of those that still wait for BAM", async () => {
    await inTestDatabase(async (db) => {
      const { residents, manager, bam } = await addRecords(db);
      await addClarifications(db, residents, bam.id, [
        { status: "verified" },
        { status: "submitted" },
      ]);
      await addTestDuty(
        db,
        { room: "NT111", place: "Lorong Uji Tugas NT111" },
        judgedBy(bam.id, "met"),
      );
      await addTestDuty(
        db,
        { room: "NT112", place: "Lorong Uji Tugas NT112" },
        {},
      );

      expect(
        await countDormTasks(db, accountOf(manager.id, manager.roles), NOW),
      ).toBe(2);
      expect(await countDormTasks(db, accountOf(bam.id, bam.roles), NOW)).toBe(
        0,
      );
    });
  });
});
