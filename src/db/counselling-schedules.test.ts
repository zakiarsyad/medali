// Sample NIMs of this file: 9986306000 to 9986306099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  counsellingScheduleChanges,
  counsellingSchedules,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

interface Records {
  studentId: string;
  accountId: string;
}

async function addRecords(db: Database): Promise<Records> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Jadwal Konseling" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: "Prodi Uji Jadwal Konseling", code: "UJIJADWALKONS" })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const [student] = await db
    .insert(students)
    .values({
      nim: "9986306001",
      name: "Mahasiswa Uji Jadwal Konseling",
      studyProgramId: program.id,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
    })
    .returning();
  if (!student) throw new Error("The records were not added.");
  return { studentId: student.id, accountId: account.id };
}

function addSchedule(
  db: Database,
  of: Records,
  values: Partial<typeof counsellingSchedules.$inferInsert> = {},
) {
  const now = new Date();
  return db
    .insert(counsellingSchedules)
    .values({
      studentId: of.studentId,
      kind: "voluntary",
      status: "submitted",
      topic: "academic",
      day: "2026-10-21",
      hour: "08:30",
      way: "in_person",
      createdAt: now,
      changedBy: of.accountId,
      changedAt: now,
      ...values,
    })
    .returning();
}

async function addLogLine(db: Database): Promise<{ id: string; of: string }> {
  const records = await addRecords(db);
  const [schedule] = await addSchedule(db, records);
  if (!schedule) throw new Error("The schedule was not added.");
  const [line] = await db
    .insert(counsellingScheduleChanges)
    .values({
      scheduleId: schedule.id,
      changedBy: records.accountId,
      changedAt: schedule.changedAt,
      step: "register",
      statusAfter: "submitted",
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return { id: line.id, of: schedule.id };
}

describe("a counselling schedule", () => {
  it("keeps the topic, the time, the way and the story", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [kept] = await addSchedule(db, records, {
        topic: "family",
        hour: "14:30",
        way: "online",
        story: "Cerita uji.",
      });

      expect(kept).toMatchObject({
        topic: "family",
        day: "2026-10-21",
        hour: "14:30",
        way: "online",
        story: "Cerita uji.",
      });
    });
  });

  it("is refused a second active voluntary request of one student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSchedule(db, records);

      await expect(addSchedule(db, records)).rejects.toThrow();
    });
  });

  it("is refused an hour that is not one of the four", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        db.execute(sql`
          insert into counselling_schedules
            (student_id, kind, status, topic, day, hour, way, created_at, changed_by, changed_at)
          values (${records.studentId}, 'voluntary', 'submitted', 'academic',
            '2026-10-21', '09:00', 'in_person', now(), ${records.accountId}, now())`),
      ).rejects.toThrow();
    });
  });

  it("is refused a time proposed or approved without a Konselor", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSchedule(db, records, { status: "scheduled" }),
      ).rejects.toThrow();
    });
  });

  it.each(["done", "missed"] as const)(
    "is refused %s without a Konselor",
    async (status) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        await expect(addSchedule(db, records, { status })).rejects.toThrow();
      });
    },
  );

  it("keeps a request cancelled before any Konselor took it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const [kept] = await addSchedule(db, records, { status: "cancelled" });

      expect(kept?.status).toBe("cancelled");
    });
  });

  it.each(["done", "missed", "cancelled"] as const)(
    "lets a student whose request is %s have a new active one",
    async (status) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        await addSchedule(db, records, {
          status,
          counsellorId: records.accountId,
        });

        const [added] = await addSchedule(db, records);

        expect(added?.status).toBe("submitted");
      });
    },
  );

  it("is refused a story longer than 1000 characters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSchedule(db, records, { story: "a".repeat(1001) }),
      ).rejects.toThrow();
    });
  });

  it("cannot be deleted once it has a log line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(counsellingSchedules)
        .where(eq(counsellingSchedules.id, line.of));
      await expect(removal).rejects.toThrow();
    });
  });

  it("cannot be emptied, not even together with its log", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate counselling_schedules cascade`),
      ).rejects.toThrow();
    });
  });
});

/** An assignment waiting for its time: no topic, no time, with its Dasar. */
const WAITING_ASSIGNMENT = {
  kind: "assigned",
  status: "awaiting",
  topic: null,
  day: null,
  hour: null,
  way: null,
  basis: "Pelanggaran disiplin sedang jenjang pertama",
  senderMessage: "Pesan uji pengirim.",
} as const;

describe("a counselling assignment", () => {
  it.each(["assigned", "called"] as const)(
    "keeps a %s one waiting with no time, its Dasar and the sender's message",
    async (kind) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        const [kept] = await addSchedule(db, records, {
          ...WAITING_ASSIGNMENT,
          kind,
        });

        expect(kept).toMatchObject({
          kind,
          status: "awaiting",
          topic: null,
          day: null,
          basis: WAITING_ASSIGNMENT.basis,
          senderMessage: WAITING_ASSIGNMENT.senderMessage,
        });
      });
    },
  );

  it("can stand beside an active voluntary request of the same student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSchedule(db, records);

      const [added] = await addSchedule(db, records, WAITING_ASSIGNMENT);

      expect(added?.status).toBe("awaiting");
    });
  });

  it("is refused without a Dasar", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSchedule(db, records, { ...WAITING_ASSIGNMENT, basis: null }),
      ).rejects.toThrow();
    });
  });

  it("is refused with a topic picked by a student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSchedule(db, records, { ...WAITING_ASSIGNMENT, topic: "family" }),
      ).rejects.toThrow();
    });
  });

  it.each(["submitted", "proposed", "cancelled"] as const)(
    "is refused the status %s, which belongs to a voluntary request",
    async (status) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        await expect(
          addSchedule(db, records, {
            ...WAITING_ASSIGNMENT,
            status,
            day: "2026-10-21",
            hour: "08:30",
            way: "in_person",
            counsellorId: records.accountId,
          }),
        ).rejects.toThrow();
      });
    },
  );

  it("is refused Dijadwalkan without a time", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSchedule(db, records, {
          ...WAITING_ASSIGNMENT,
          status: "scheduled",
          counsellorId: records.accountId,
        }),
      ).rejects.toThrow();
    });
  });

  it("is refused a Dasar longer than 500 characters", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(
        addSchedule(db, records, {
          ...WAITING_ASSIGNMENT,
          basis: "a".repeat(501),
        }),
      ).rejects.toThrow();
    });
  });
});

describe("a voluntary counselling request", () => {
  it.each(["awaiting", "reschedule_asked"] as const)(
    "is refused the status %s, which belongs to an assignment",
    async (status) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);

        await expect(
          addSchedule(db, records, {
            status,
            counsellorId: records.accountId,
          }),
        ).rejects.toThrow();
      });
    },
  );

  it.each([
    ["no topic", { topic: null }],
    ["no time", { day: null }],
    ["a Dasar", { basis: "Dasar uji" }],
    ["a sender's message", { senderMessage: "Pesan uji" }],
  ] as const)("is refused with %s", async (_, values) => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await expect(addSchedule(db, records, values)).rejects.toThrow();
    });
  });
});

describe("the log of counselling schedules", () => {
  it("keeps who, when, the step, and the status before and after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const [schedule] = await addSchedule(db, records);
      if (!schedule) throw new Error("The schedule was not added.");

      const [line] = await db
        .insert(counsellingScheduleChanges)
        .values({
          scheduleId: schedule.id,
          changedBy: records.accountId,
          changedAt: new Date(),
          step: "propose",
          statusBefore: "submitted",
          statusAfter: "proposed",
        })
        .returning();

      expect(line).toMatchObject({
        changedBy: records.accountId,
        step: "propose",
        statusBefore: "submitted",
        statusAfter: "proposed",
      });
      expect(line?.changedAt).toBeInstanceOf(Date);
    });
  });

  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const change = db
        .update(counsellingScheduleChanges)
        .set({ statusAfter: "scheduled" })
        .where(eq(counsellingScheduleChanges.id, line.id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const line = await addLogLine(db);
      const removal = db
        .delete(counsellingScheduleChanges)
        .where(eq(counsellingScheduleChanges.id, line.id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate counselling_schedule_changes`),
      ).rejects.toThrow();
    });
  });
});
