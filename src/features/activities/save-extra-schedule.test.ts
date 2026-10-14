// Sample Tahun akademik of this file: 2800 to 2800.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { versionOf } from "@/db/row-version";
import {
  activityScheduleParticipants,
  activitySchedules,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addSchedule, SCHEDULE_ALREADY_SENT } from "./add-schedule";
import { changeSchedule } from "./change-schedule";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import {
  NO_PARTICIPANTS,
  type SentParticipants,
  TOO_FEW_COHORTS,
  UNKNOWN_PARTICIPANTS,
} from "./participant-input";
import { NO_ACTIVITY, type SentSchedule } from "./schedule-input";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestStudents,
  NEW_SCHEDULE_ID,
  SENT_SCHEDULE,
  type TestActor,
  type TestPeriods,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2800, the program
 * UJIJADWALTAMBAH, the classes JT-01 to JT-04 and the NIMs 9974620000 to
 * 9974620099.
 */

const inTestDatabase = withTestDatabase();

const UNKNOWN_ID = "7f6e5d4c-3b2a-4190-8f7e-6d5c4b3a2f1e";

interface Records {
  actor: TestActor;
  periods: TestPeriods;
  /** The key of each stored student, by NIM. */
  idsByNim: Map<string, string>;
  sent: SentSchedule;
}

/**
 * Two Aktif students of angkatan 2800 in JT-01 and JT-02, a Non aktif
 * one of angkatan 2799 alone in JT-03, and an Aktif one of angkatan 2801,
 * who was not a student yet in the periods of 2800, alone in JT-04.
 */
async function addStudents(db: Database): Promise<Map<string, string>> {
  const programId = await addTestProgram(db, "UJIJADWALTAMBAH");
  await addTestStudents(db, programId, [
    {
      nim: "9974620001",
      name: "Uji Jadwal Tambah Satu",
      cohortYear: 2800,
      className: "JT-01",
    },
    {
      nim: "9974620002",
      name: "Uji Jadwal Tambah Dua",
      cohortYear: 2800,
      className: "JT-02",
    },
    {
      nim: "9974620003",
      name: "Uji Jadwal Tambah Tiga",
      cohortYear: 2799,
      className: "JT-03",
      status: "inactive",
    },
    {
      nim: "9974620004",
      name: "Uji Jadwal Tambah Empat",
      cohortYear: 2801,
      className: "JT-04",
    },
  ]);
  const stored = await db
    .select({ id: students.id, nim: students.nim })
    .from(students)
    .where(eq(students.studyProgramId, programId));
  return new Map(stored.map(({ id, nim }) => [nim, id]));
}

function sentWith(
  activityId: string,
  participants: SentParticipants,
): SentSchedule {
  return {
    ...SENT_SCHEDULE,
    kind: "extra",
    activityId,
    startsOn: "2800-09-10",
    endsOn: "2800-09-11",
    participants,
  };
}

async function addRecords(
  db: Database,
  roles: RoleId[] = ["upk_staff"],
): Promise<Records> {
  const actor = await addTestActor(db, "Pegawai Uji Jadwal Tambah", roles);
  const activityId = await addTestActivity(db, actor.id, {
    semester: null,
    name: "Kegiatan tambahan uji",
  });
  const periods = await addTestPeriods(db, 2800);
  const idsByNim = await addStudents(db);
  const sent = sentWith(activityId, {
    mode: "classes",
    values: ["JT-01", "JT-02"],
  });
  return { actor, periods, idsByNim, sent };
}

function storedParticipants(db: Database) {
  return db
    .select({
      scheduleId: activityScheduleParticipants.scheduleId,
      studentId: activityScheduleParticipants.studentId,
      className: activityScheduleParticipants.className,
      cohortYear: activityScheduleParticipants.cohortYear,
    })
    .from(activityScheduleParticipants)
    .orderBy(
      asc(activityScheduleParticipants.className),
      asc(activityScheduleParticipants.cohortYear),
    );
}

function storedSchedules(db: Database) {
  return db.select().from(activitySchedules);
}

describe("adding a schedule of an extra activity", () => {
  it.each<RoleId>(["head_of_unit", "upk_staff"])(
    "lets %s add it with its classes, in the period of its first day",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { actor, periods, sent } = await addRecords(db, [role]);

        const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

        expect(added).toEqual({
          ok: true,
          value: {
            name: "Kegiatan tambahan uji",
            target: {
              kind: "chosen",
              choice: { kind: "classes", classNames: ["JT-01", "JT-02"] },
            },
          },
        });
        const [kept] = await storedSchedules(db);
        expect(kept?.academicPeriodId).toBe(periods.oddId);
        expect(await storedParticipants(db)).toEqual([
          {
            scheduleId: NEW_SCHEDULE_ID,
            studentId: null,
            className: "JT-01",
            cohortYear: null,
          },
          {
            scheduleId: NEW_SCHEDULE_ID,
            studentId: null,
            className: "JT-02",
            cohortYear: null,
          },
        ]);
      });
    },
  );

  it.each<RoleId>(["head_of_program", "mentor", "student", "director"])(
    "refuses %s, and keeps nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { actor, sent } = await addRecords(db, [role]);

        const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

        expect(added).toEqual(SCHEDULES_NOT_ALLOWED);
        expect(await storedSchedules(db)).toEqual([]);
        expect(await storedParticipants(db)).toEqual([]);
      });
    },
  );

  it("keeps the students picked one by one, and says how many", async () => {
    await inTestDatabase(async (db) => {
      const { actor, idsByNim, sent } = await addRecords(db);
      const picked = [
        idsByNim.get("9974620001") ?? "",
        idsByNim.get("9974620002") ?? "",
      ];

      const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        participants: { mode: "students", values: picked },
      });

      expect(added).toMatchObject({
        ok: true,
        value: { target: { choice: { kind: "students", chosen: 2 } } },
      });
      const kept = await storedParticipants(db);
      expect(kept.map((row) => row.studentId).sort()).toEqual(picked.sort());
    });
  });

  it("keeps one angkatan for Per angkatan and several for Lintas angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      const across = { mode: "cohorts", values: ["2799", "2800"] };

      await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        participants: across,
      });

      const kept = await storedParticipants(db);
      expect(kept.map((row) => row.cohortYear)).toEqual([2799, 2800]);
    });
  });

  it.each<[string, SentParticipants, { ok: false; error: string }]>([
    ["no participant", { mode: "classes", values: [] }, NO_PARTICIPANTS],
    [
      "Lintas angkatan with one angkatan",
      { mode: "cohorts", values: ["2800"] },
      TOO_FEW_COHORTS,
    ],
    [
      "a class with no Aktif student",
      { mode: "classes", values: ["JT-03"] },
      NO_PARTICIPANTS,
    ],
    [
      "a class whose only Aktif student was not a student yet in the period",
      { mode: "classes", values: ["JT-04"] },
      NO_PARTICIPANTS,
    ],
    [
      "a student who is not stored",
      { mode: "students", values: [UNKNOWN_ID] },
      UNKNOWN_PARTICIPANTS,
    ],
  ])("refuses %s, and keeps nothing", async (_case, participants, refusal) => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);

      const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        participants,
      });

      expect(added).toEqual(refusal);
      expect(await storedSchedules(db)).toEqual([]);
      expect(await storedParticipants(db)).toEqual([]);
    });
  });

  it("refuses a student picked one by one who is Non aktif, also beside an Aktif one", async () => {
    await inTestDatabase(async (db) => {
      const { actor, idsByNim, sent } = await addRecords(db);

      const added = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        participants: {
          mode: "students",
          values: ["9974620001", "9974620003"].map(
            (nim) => idsByNim.get(nim) ?? "",
          ),
        },
      });

      expect(added).toEqual(UNKNOWN_PARTICIPANTS);
      expect(await storedSchedules(db)).toEqual([]);
    });
  });

  it("refuses an extra activity sent from the PPKS tab, and a PPKS one from this tab", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      const ppks = await addTestActivity(db, actor.id, { semester: 3 });

      const fromPpks = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        kind: "ppks",
      });
      const ppksHere = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        activityId: ppks,
      });
      const noTab = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        kind: "lainnya",
      });

      expect(fromPpks).toEqual(NO_ACTIVITY);
      expect(ppksHere).toEqual(NO_ACTIVITY);
      expect(noTab).toEqual(NO_ACTIVITY);
      expect(await storedSchedules(db)).toEqual([]);
    });
  });
});

describe("a schedule of an extra activity sent a second time", () => {
  it("is kept once, with its participants once", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      const first = await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);

      const again = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        participants: { mode: "classes", values: ["JT-02", "JT-01"] },
      });

      expect(again).toEqual(first);
      expect(await storedSchedules(db)).toHaveLength(1);
      expect(await storedParticipants(db)).toHaveLength(2);
    });
  });

  it("is refused with other participants, and what was kept stays", async () => {
    await inTestDatabase(async (db) => {
      const { actor, sent } = await addRecords(db);
      await addSchedule(db, actor, NEW_SCHEDULE_ID, sent);
      const before = await storedParticipants(db);

      const again = await addSchedule(db, actor, NEW_SCHEDULE_ID, {
        ...sent,
        participants: { mode: "classes", values: ["JT-01"] },
      });

      expect(again).toEqual(SCHEDULE_ALREADY_SENT);
      expect(await storedParticipants(db)).toEqual(before);
    });
  });
});

describe("changing a schedule of an extra activity", () => {
  async function addedVersion(
    db: Database,
    records: Records,
    sent: SentSchedule = records.sent,
  ) {
    await addSchedule(db, records.actor, NEW_SCHEDULE_ID, sent);
    const [kept] = await storedSchedules(db);
    if (!kept) throw new Error("The schedule was not added.");
    return versionOf(kept.changedAt);
  }

  it("replaces its participants with those sent", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const version = await addedVersion(db, records);

      const changed = await changeSchedule(
        db,
        records.actor,
        NEW_SCHEDULE_ID,
        version,
        { ...records.sent, participants: { mode: "cohort", values: ["2800"] } },
      );

      expect(changed).toMatchObject({
        ok: true,
        value: {
          target: { choice: { kind: "cohorts", cohortYears: [2800] } },
        },
      });
      expect(await storedParticipants(db)).toEqual([
        {
          scheduleId: NEW_SCHEDULE_ID,
          studentId: null,
          className: null,
          cohortYear: 2800,
        },
      ]);
    });
  });

  function byName(records: Records, nims: string[]): SentSchedule {
    const values = nims.map((nim) => records.idsByNim.get(nim) ?? "");
    return { ...records.sent, participants: { mode: "students", values } };
  }

  function removeStudent(db: Database, id: string | undefined) {
    return db
      .update(students)
      .set({ deletedAt: new Date() })
      .where(eq(students.id, id ?? ""));
  }

  it("saves again, unchanged, a student picked one by one who was removed since: they stay chosen", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const sent = byName(records, ["9974620001", "9974620002"]);
      const version = await addedVersion(db, records, sent);
      await removeStudent(db, records.idsByNim.get("9974620002"));

      const changed = await changeSchedule(
        db,
        records.actor,
        NEW_SCHEDULE_ID,
        version,
        sent,
      );

      expect(changed).toMatchObject({
        ok: true,
        value: { target: { choice: { kind: "students", chosen: 2 } } },
      });
      const kept = await storedParticipants(db);
      expect(kept.map(({ studentId }) => studentId).sort()).toEqual(
        [...sent.participants.values].sort(),
      );
    });
  });

  it("refuses a student newly picked one by one who is Non aktif or removed", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const version = await addedVersion(db, records);
      const before = await storedParticipants(db);
      await removeStudent(db, records.idsByNim.get("9974620002"));

      for (const nims of [
        ["9974620001", "9974620003"],
        ["9974620001", "9974620002"],
      ]) {
        const changed = await changeSchedule(
          db,
          records.actor,
          NEW_SCHEDULE_ID,
          version,
          byName(records, nims),
        );

        expect(changed).toEqual(UNKNOWN_PARTICIPANTS);
      }
      expect(await storedParticipants(db)).toEqual(before);
    });
  });

  it("keeps its participants when the change is refused", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const version = await addedVersion(db, records);
      const before = await storedParticipants(db);

      const changed = await changeSchedule(
        db,
        records.actor,
        NEW_SCHEDULE_ID,
        version,
        {
          ...records.sent,
          participants: { mode: "cohorts", values: ["2800"] },
        },
      );

      expect(changed).toEqual(TOO_FEW_COHORTS);
      expect(await storedParticipants(db)).toEqual(before);
    });
  });

  it("may not become a schedule of a PPKS activity", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const version = await addedVersion(db, records);
      const ppks = await addTestActivity(db, records.actor.id, { semester: 3 });

      const changed = await changeSchedule(
        db,
        records.actor,
        NEW_SCHEDULE_ID,
        version,
        { ...records.sent, kind: "ppks", activityId: ppks },
      );

      expect(changed).toEqual(NO_ACTIVITY);
    });
  });

  it.each<RoleId>(["head_of_program", "mentor", "student"])(
    "refuses %s, and keeps its participants",
    async (role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const version = await addedVersion(db, records);
        const before = await storedParticipants(db);
        const other = await addTestActor(db, "Bukan Pengelola Uji", [role]);

        const changed = await changeSchedule(
          db,
          other,
          NEW_SCHEDULE_ID,
          version,
          {
            ...records.sent,
            participants: { mode: "cohort", values: ["2800"] },
          },
        );

        expect(changed).toEqual(SCHEDULES_NOT_ALLOWED);
        expect(await storedParticipants(db)).toEqual(before);
      });
    },
  );
});
