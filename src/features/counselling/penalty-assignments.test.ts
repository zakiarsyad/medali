// Sample NIMs of this file: 9986684000 to 9986684099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  counsellingScheduleChanges,
  counsellingSchedules,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestPenalty } from "@/features/guidance/test-discipline-penalties";
import {
  ALREADY_ASSIGNED,
  ASSIGN_NOT_ALLOWED_WORDS,
  assignedTo,
  MESSAGE_TOO_LONG,
  PENALTY_NOT_FOUND,
} from "./penalty-assignment-words";
import {
  assignFromPenalty,
  readPenaltyAssignments,
} from "./penalty-assignments";
import { addTestActor, addTestPeople } from "./test-consents";

const inTestDatabase = withTestDatabase();

/** Senin 19 Oktober 2026, 10:00 on campus. */
const NOW = new Date("2026-10-19T03:00:00Z");

/**
 * A Pembina Disiplin Mahasiswa and a student with a Sedang jenjang kedua
 * penalty recorded by them.
 */
async function addRecords(db: Database) {
  const people = await addTestPeople(db, "Prodi Uji Tugaskan Konseling", [
    "9986684001",
  ]);
  const [punished] = people.studentIds;
  if (!punished) throw new Error("Student missing.");
  const pembina = await addTestActor(db, "Pembina Uji Tugaskan", [
    "discipline_officer",
  ]);
  const penaltyId = await addTestPenalty(
    db,
    punished,
    pembina.id,
    "2026-10-15",
    {
      category: "medium",
      level: 2,
      description: "Uraian rahasia pelanggaran uji.",
    },
  );
  return { punished, pembina, penaltyId };
}

function schedulesOf(db: Database) {
  return db.select().from(counsellingSchedules);
}

function linesOf(db: Database, scheduleId: string) {
  return db
    .select()
    .from(counsellingScheduleChanges)
    .where(eq(counsellingScheduleChanges.scheduleId, scheduleId));
}

describe("Tugaskan konseling from a discipline penalty", () => {
  it("makes a Penugasan of the penalty's student, Menunggu jadwal, with its Kategori and Jenjang as Dasar and the message, never the Uraian", async () => {
    await inTestDatabase(async (db) => {
      const { punished, pembina, penaltyId } = await addRecords(db);

      const outcome = await assignFromPenalty(
        db,
        pembina,
        penaltyId,
        "  Mohon pendampingan.  ",
        NOW,
      );

      expect(outcome).toEqual({
        kind: "kept",
        done: assignedTo("Mahasiswa Uji Konseling 1"),
      });
      const [assignment, ...more] = await schedulesOf(db);
      expect(more).toEqual([]);
      expect(assignment).toMatchObject({
        studentId: punished,
        penaltyId,
        kind: "assigned",
        status: "awaiting",
        topic: null,
        day: null,
        hour: null,
        basis: "Pelanggaran disiplin sedang jenjang kedua",
        senderMessage: "Mohon pendampingan.",
        changedBy: pembina.id,
        createdAt: NOW,
      });
      expect(JSON.stringify(assignment)).not.toContain("Uraian rahasia");
    });
  });

  it("puts a line in the schedule's log: who, when, Menugaskan konseling wajib", async () => {
    await inTestDatabase(async (db) => {
      const { pembina, penaltyId } = await addRecords(db);

      await assignFromPenalty(db, pembina, penaltyId, "", NOW);

      const [assignment] = await schedulesOf(db);
      expect(await linesOf(db, assignment?.id ?? "")).toEqual([
        expect.objectContaining({
          changedBy: pembina.id,
          changedAt: NOW,
          step: "assign",
          statusBefore: null,
          statusAfter: "awaiting",
        }),
      ]);
    });
  });

  it("keeps no message when none was typed", async () => {
    await inTestDatabase(async (db) => {
      const { pembina, penaltyId } = await addRecords(db);

      await assignFromPenalty(db, pembina, penaltyId, "   ", NOW);

      const [assignment] = await schedulesOf(db);
      expect(assignment?.senderMessage).toBeNull();
    });
  });

  it.each<RoleId>([
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
    "counsellor",
    "assessor",
    "student",
  ])("refuses %s, keeping nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { penaltyId } = await addRecords(db);
      const other = await addTestActor(db, "Bukan Pembina Uji", [role]);

      const outcome = await assignFromPenalty(db, other, penaltyId, "", NOW);

      expect(outcome).toEqual({
        kind: "refused",
        error: ASSIGN_NOT_ALLOWED_WORDS,
      });
      expect(await schedulesOf(db)).toEqual([]);
    });
  });

  it("refuses a penalty that is none, or of a student removed, outside every row, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { punished, pembina, penaltyId } = await addRecords(db);
      const none = crypto.randomUUID();

      const unknown = await assignFromPenalty(db, pembina, none, "", NOW);
      const notAKey = await assignFromPenalty(db, pembina, "bukan-id", "", NOW);
      await db
        .update(students)
        .set({ deletedAt: NOW, deletedBy: pembina.id })
        .where(eq(students.id, punished));
      const removed = await assignFromPenalty(db, pembina, penaltyId, "", NOW);

      const refused = { kind: "refused", error: PENALTY_NOT_FOUND };
      expect(unknown).toEqual(refused);
      expect(notAKey).toEqual(refused);
      expect(removed).toEqual(refused);
      expect(await schedulesOf(db)).toEqual([]);
    });
  });

  it("refuses a second for the same penalty with Sudah ditugaskan., whatever the first's status", async () => {
    await inTestDatabase(async (db) => {
      const { pembina, penaltyId } = await addRecords(db);
      const pembinaLain = await addTestActor(db, "Pembina Uji Lain", [
        "discipline_officer",
      ]);
      await assignFromPenalty(db, pembina, penaltyId, "", NOW);

      const again = await assignFromPenalty(db, pembina, penaltyId, "", NOW);
      await moveTo(db, penaltyId, {
        status: "done",
        day: "2026-10-21",
        hour: "10:00",
        way: "in_person",
        counsellorId: pembina.id,
      });
      const afterDone = await assignFromPenalty(
        db,
        pembinaLain,
        penaltyId,
        "",
        NOW,
      );

      const refused = { kind: "refused", error: ALREADY_ASSIGNED };
      expect(again).toEqual(refused);
      expect(afterDone).toEqual(refused);
      expect(await schedulesOf(db)).toHaveLength(1);
    });
  });

  it("refuses a message longer than 500 characters, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { pembina, penaltyId } = await addRecords(db);

      const outcome = await assignFromPenalty(
        db,
        pembina,
        penaltyId,
        "a".repeat(501),
        NOW,
      );

      expect(outcome).toEqual({ kind: "refused", error: MESSAGE_TOO_LONG });
      expect(await schedulesOf(db)).toEqual([]);
    });
  });
});

/** Konselor's moves, made straight on the table. */
function moveTo(
  db: Database,
  penaltyId: string,
  values: Partial<typeof counsellingSchedules.$inferInsert>,
) {
  return db
    .update(counsellingSchedules)
    .set(values)
    .where(eq(counsellingSchedules.penaltyId, penaltyId));
}

describe("how a Penugasan sent from a penalty stands", () => {
  it("shows Pembina Disiplin Mahasiswa its status, when and by whom it was sent, and the date and Jam once Konselor set them", async () => {
    await inTestDatabase(async (db) => {
      const { punished, pembina, penaltyId } = await addRecords(db);
      const without = await addTestPenalty(
        db,
        punished,
        pembina.id,
        "2026-10-16",
      );
      await assignFromPenalty(db, pembina, penaltyId, "Pesan rahasia.", NOW);
      const ids = [penaltyId, without];
      const sent = { sentAt: NOW, sentBy: "Pembina Uji Tugaskan" };
      const time = {
        day: "2026-10-21",
        hour: "10:00",
        way: "in_person",
        counsellorId: pembina.id,
      } as const;

      const waiting = await readPenaltyAssignments(db, pembina, ids);
      await moveTo(db, penaltyId, { status: "scheduled", ...time });
      const scheduled = await readPenaltyAssignments(db, pembina, ids);
      await moveTo(db, penaltyId, { status: "reschedule_asked" });
      const asked = await readPenaltyAssignments(db, pembina, ids);
      await moveTo(db, penaltyId, { status: "missed" });
      const missed = await readPenaltyAssignments(db, pembina, ids);

      expect(waiting).toEqual(
        new Map([
          [penaltyId, { status: "awaiting", day: null, hour: null, ...sent }],
        ]),
      );
      expect(scheduled?.get(penaltyId)).toEqual({
        status: "scheduled",
        day: "2026-10-21",
        hour: "10:00",
        ...sent,
      });
      expect(asked?.get(penaltyId)).toEqual({
        status: "reschedule_asked",
        day: null,
        hour: null,
        ...sent,
      });
      expect(missed?.get(penaltyId)).toMatchObject({
        status: "missed",
        day: "2026-10-21",
      });
      expect(JSON.stringify([...(waiting?.values() ?? [])])).not.toContain(
        "Pesan rahasia",
      );
    });
  });

  it.each<RoleId>([
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
    "counsellor",
    "assessor",
    "student",
  ])("refuses %s, telling nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { pembina, penaltyId } = await addRecords(db);
      await assignFromPenalty(db, pembina, penaltyId, "", NOW);
      const other = await addTestActor(db, "Bukan Pembina Uji", [role]);

      expect(await readPenaltyAssignments(db, other, [penaltyId])).toBeNull();
    });
  });

  it("tells nothing of a student outside the sender's rows", async () => {
    await inTestDatabase(async (db) => {
      const { punished, pembina, penaltyId } = await addRecords(db);
      await assignFromPenalty(db, pembina, penaltyId, "", NOW);
      await db
        .update(students)
        .set({ deletedAt: NOW, deletedBy: pembina.id })
        .where(eq(students.id, punished));

      expect(await readPenaltyAssignments(db, pembina, [penaltyId])).toEqual(
        new Map(),
      );
    });
  });
});
