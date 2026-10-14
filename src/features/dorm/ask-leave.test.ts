// Sample Tahun akademik of this file: 2750 to 2750.
// Sample NIMs of this file: 9937820000 to 9937820099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { askLeave } from "./ask-leave";
import {
  ASK_NOT_ALLOWED,
  LEAVE_ALREADY_SENT,
  LEAVE_OVERLAPS,
  NOT_A_RESIDENT,
} from "./leave-messages";
import { OUTING_DOES_NOT_FIT } from "./leave-rules";
import {
  addTestResidents,
  leaveById,
  leavesOf,
  sentOuting,
} from "./test-leave";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2750.
const MOMENT = new Date("2750-10-12T03:00:00Z");
const TOMORROW = "2750-10-13";

async function addRecords(db: Database) {
  const [ani, bea, senior] = await addTestResidents(
    db,
    2750,
    "Prodi Uji Ajukan Izin",
    ["9937820001", "9937820002", "9937820003"],
  );
  if (!ani || !bea || !senior) throw new Error("The residents were not added.");
  // Angkatan 2749 is in semester 3 then: it lives in no dorm.
  await db
    .update(students)
    .set({ cohortYear: 2749 })
    .where(eq(students.id, senior.studentId));
  return { ani, bea, senior };
}

describe("askLeave", () => {
  it("keeps a request of the resident as Diajukan, with when it was sent", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const id = crypto.randomUUID();

      const saved = await askLeave(db, ani, id, sentOuting(TOMORROW), MOMENT);

      expect(saved.ok).toBe(true);
      const kept = await leaveById(db, id);
      expect(kept).toMatchObject({
        studentId: ani.studentId,
        kind: "outing",
        status: "submitted",
        startsAt: new Date("2750-10-13T02:00:00Z"),
        endsAt: new Date("2750-10-13T09:00:00Z"),
        purpose: "Membeli buku kuliah",
        sentAt: MOMENT,
      });
    });
  });

  it("saves nothing and says why for times the rules refuse", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const saved = await askLeave(
        db,
        ani,
        crypto.randomUUID(),
        sentOuting(TOMORROW, { endsAt: `${TOMORROW}T22:00` }),
        MOMENT,
      );

      expect(saved).toEqual({ ok: false, error: OUTING_DOES_NOT_FIT });
      expect(await leavesOf(db, ani.studentId)).toEqual([]);
    });
  });

  it("refuses times that overlap a request of theirs that waits or is approved, and not one cancelled", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const first = crypto.randomUUID();
      await askLeave(db, ani, first, sentOuting(TOMORROW), MOMENT);

      const overlapping = sentOuting(TOMORROW, {
        startsAt: `${TOMORROW}T15:59`,
        endsAt: `${TOMORROW}T18:00`,
      });
      const refused = await askLeave(
        db,
        ani,
        crypto.randomUUID(),
        overlapping,
        MOMENT,
      );
      const after = sentOuting(TOMORROW, {
        startsAt: `${TOMORROW}T16:00`,
        endsAt: `${TOMORROW}T18:00`,
      });
      const right = await askLeave(db, ani, crypto.randomUUID(), after, MOMENT);

      expect(refused).toEqual(LEAVE_OVERLAPS);
      expect(right.ok).toBe(true);
      expect(await leavesOf(db, ani.studentId)).toHaveLength(2);
    });
  });

  it("lets two residents ask for the same times", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea: other } = await addRecords(db);

      await askLeave(
        db,
        ani,
        crypto.randomUUID(),
        sentOuting(TOMORROW),
        MOMENT,
      );
      const saved = await askLeave(
        db,
        other,
        crypto.randomUUID(),
        sentOuting(TOMORROW),
        MOMENT,
      );

      expect(saved.ok).toBe(true);
    });
  });

  it("answers a form sent twice the same, and keeps it once", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const id = crypto.randomUUID();

      const first = await askLeave(db, ani, id, sentOuting(TOMORROW), MOMENT);
      const second = await askLeave(db, ani, id, sentOuting(TOMORROW), MOMENT);

      expect(second).toEqual(first);
      expect(await leavesOf(db, ani.studentId)).toHaveLength(1);
    });
  });

  it("refuses the key of a request sent before with other words, or by another student", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea: other } = await addRecords(db);
      const id = crypto.randomUUID();
      await askLeave(db, ani, id, sentOuting(TOMORROW), MOMENT);

      const changed = await askLeave(
        db,
        ani,
        id,
        sentOuting(TOMORROW, { purpose: "Membeli buku tulis" }),
        MOMENT,
      );
      const stranger = await askLeave(
        db,
        other,
        id,
        sentOuting("2750-10-14"),
        MOMENT,
      );

      expect(changed).toEqual(LEAVE_ALREADY_SENT);
      expect(stranger).toEqual(LEAVE_ALREADY_SENT);
      expect(await leavesOf(db, other.studentId)).toEqual([]);
    });
  });

  it("refuses a role that may not ask, BAM - BPHK and Pengelola Asrama among them", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      for (const role of ["bam_bphk", "dorm_manager"] as const) {
        const saved = await askLeave(
          db,
          { ...ani, roles: [role] },
          crypto.randomUUID(),
          sentOuting(TOMORROW),
          MOMENT,
        );
        expect(saved).toEqual(ASK_NOT_ALLOWED);
      }
      expect(await leavesOf(db, ani.studentId)).toEqual([]);
    });
  });

  it("refuses a student who lives in no dorm, and an account without a student", async () => {
    await inTestDatabase(async (db) => {
      const { senior } = await addRecords(db);

      const outside = await askLeave(
        db,
        senior,
        crypto.randomUUID(),
        sentOuting(TOMORROW),
        MOMENT,
      );
      const noStudent = await askLeave(
        db,
        { roles: ["student"], studentId: null },
        crypto.randomUUID(),
        sentOuting(TOMORROW),
        MOMENT,
      );

      expect(outside).toEqual(NOT_A_RESIDENT);
      expect(noStudent).toEqual(NOT_A_RESIDENT);
    });
  });
});
