// Sample Tahun akademik of this file: 4472 to 4472.
// Sample NIMs of this file: 9987702000 to 9987702099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { changeCoachingStatus } from "./change-coaching-status";
import {
  COACHING_NOTE_TOO_LONG,
  NOT_A_COACHING_STATUS,
  NOT_ALLOWED_TO_CHANGE,
  NOT_IN_COACHING,
} from "./coaching-messages";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  coachingLinesOf,
  coachingStatusAt,
  INTENSIVE,
  NOT_LISTED,
} from "./test-coaching";
import { addPenaltyGroup } from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

const ASSESSED_AT = new Date("4472-09-01T03:00:00Z");

interface Setting {
  kepala: AccountForAccess;
  /** Listed: Mahasiswa Uji Ubah Pembinaan 1 and 2. */
  listed: string[];
  /** Assessed, but not listed. */
  fine: string;
  programId: number;
}

async function setting(db: Database): Promise<Setting> {
  const periodId = await addCoachingPeriod(db, 4472);
  const { programId, studentIds } = await addNoteStudents(
    db,
    "Prodi Uji Ubah Pembinaan",
    "Mahasiswa Uji Ubah Pembinaan",
    ["9987702001", "9987702002", "9987702003"],
  );
  const kepala = await addNoteActor(db, "Kepala Uji Ubah Pembinaan", [
    "head_of_unit",
  ]);
  const [one = "", two = "", three = ""] = studentIds;
  for (const studentId of [one, two]) {
    await addCoachingAssessment(
      db,
      studentId,
      kepala.id,
      periodId,
      INTENSIVE,
      ASSESSED_AT,
    );
  }
  await addCoachingAssessment(
    db,
    three,
    kepala.id,
    periodId,
    NOT_LISTED,
    ASSESSED_AT,
  );
  return { kepala, listed: [one, two], fine: three, programId };
}

function actor(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(db, "Pengubah Uji Pembinaan", roles, programId ?? null);
}

describe("changeCoachingStatus", () => {
  it("keeps a first change with its note, at version 1, and logs it from Teridentifikasi", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, listed } = await setting(db);
      const [one = ""] = listed;

      const changed = await changeCoachingStatus(
        db,
        kepala,
        one,
        "counselling",
        " Diajak bicara. ",
      );

      expect(changed).toEqual({
        ok: true,
        value: {
          name: "Mahasiswa Uji Ubah Pembinaan 1",
          status: "counselling",
          note: "Diajak bicara.",
          version: 1,
        },
      });
      expect(await coachingStatusAt(db, one)).toMatchObject({
        status: "counselling",
        note: "Diajak bicara.",
        version: 1,
        changedBy: kepala.id,
      });
      expect(await coachingLinesOf(db, one)).toEqual([
        expect.objectContaining({
          statusBefore: "identified",
          noteBefore: "",
          statusAfter: "counselling",
          noteAfter: "Diajak bicara.",
          changedBy: kepala.id,
        }),
      ]);
    });
  });

  it("keeps a later change with the version up, and logs what it was before", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, listed } = await setting(db);
      const [one = ""] = listed;
      await changeCoachingStatus(db, kepala, one, "counselling", "Diajak.");

      const changed = await changeCoachingStatus(db, kepala, one, "done", "");

      expect(changed.ok && changed.value.version).toBe(2);
      expect(await coachingStatusAt(db, one)).toMatchObject({
        status: "done",
        note: "",
        version: 2,
      });
      const lines = await coachingLinesOf(db, one);
      expect(lines).toHaveLength(2);
      expect(lines[1]).toMatchObject({
        statusBefore: "counselling",
        noteBefore: "Diajak.",
        statusAfter: "done",
        noteAfter: "",
      });
    });
  });

  it("keeps and logs nothing when nothing changes", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, listed } = await setting(db);
      const [one = ""] = listed;
      await changeCoachingStatus(db, kepala, one, "monitoring", "Dipantau.");

      const again = await changeCoachingStatus(
        db,
        kepala,
        one,
        "monitoring",
        "Dipantau.",
      );
      const first = await changeCoachingStatus(
        db,
        kepala,
        listed[1] ?? "",
        "identified",
        "",
      );

      expect(again.ok && again.value.version).toBe(1);
      expect(await coachingLinesOf(db, one)).toHaveLength(1);
      expect(first.ok).toBe(true);
      expect(await coachingStatusAt(db, listed[1] ?? "")).toBeUndefined();
    });
  });

  it("refuses a status not on the list and a note too long, keeping nothing", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, listed } = await setting(db);
      const [one = ""] = listed;

      expect(
        await changeCoachingStatus(db, kepala, one, "Selesai", ""),
      ).toEqual(NOT_A_COACHING_STATUS);
      expect(
        await changeCoachingStatus(db, kepala, one, "done", "a".repeat(301)),
      ).toEqual(COACHING_NOTE_TOO_LONG);
      expect(await coachingStatusAt(db, one)).toBeUndefined();
    });
  });

  it("lets Pengasuh change their own mentee, and refuses a student outside their mentees", async () => {
    await inTestDatabase(async (db) => {
      const { listed, programId } = await setting(db);
      const [one = "", two = ""] = listed;
      const mentor = await actor(db, ["mentor"]);
      await addPenaltyGroup(db, programId, [one], mentor.id);

      const own = await changeCoachingStatus(db, mentor, one, "done", "");
      const other = await changeCoachingStatus(db, mentor, two, "done", "");

      expect(own.ok).toBe(true);
      expect(other).toEqual(NOT_IN_COACHING);
      expect(await coachingStatusAt(db, two)).toBeUndefined();
    });
  });

  it("refuses a Ketua Program Studi who is also Pengasuh a student of the program who is not a mentee", async () => {
    await inTestDatabase(async (db) => {
      const { listed, programId } = await setting(db);
      const [one = "", two = ""] = listed;
      const both = await actor(db, ["head_of_program", "mentor"], programId);
      await addPenaltyGroup(db, programId, [one], both.id);

      expect((await changeCoachingStatus(db, both, one, "done", "")).ok).toBe(
        true,
      );
      expect(await changeCoachingStatus(db, both, two, "done", "")).toEqual(
        NOT_IN_COACHING,
      );
    });
  });

  it.each([
    "director",
    "head_of_program",
    "discipline_officer",
    "student",
    "counsellor",
    "assessor",
    "dorm_manager",
    "bam_bphk",
    "bam_compliance",
  ] as const)("refuses a change sent by hand by %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { listed, programId } = await setting(db);
      const [one = ""] = listed;
      const other = await actor(db, [role], programId);

      expect(await changeCoachingStatus(db, other, one, "done", "")).toEqual(
        NOT_ALLOWED_TO_CHANGE,
      );
      expect(await coachingStatusAt(db, one)).toBeUndefined();
    });
  });

  it("refuses a student the list does not hold: not listed, not Aktif, or no key at all", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, listed, fine } = await setting(db);
      const [, two = ""] = listed;
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, two));

      for (const studentId of [fine, two, "bukan-id"]) {
        expect(
          await changeCoachingStatus(db, kepala, studentId, "done", ""),
        ).toEqual(NOT_IN_COACHING);
      }
      expect(await coachingStatusAt(db, fine)).toBeUndefined();
    });
  });
});
