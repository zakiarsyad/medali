// Sample Tahun akademik of this file: 2860 to 2860.
// Sample NIMs of this file: 9937830000 to 9937830099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormLeaves } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { askLeave } from "./ask-leave";
import { cancelLeave } from "./cancel-leave";
import { decideLeave } from "./decide-leave";
import {
  ASK_NOT_ALLOWED,
  CANCEL_NOT_A_RESIDENT,
  LEAVE_NOT_FOUND,
  tooLateToCancel,
} from "./leave-messages";
import { makeNonResident } from "./make-non-resident";
import { addTestResidents, leaveById, sentOuting } from "./test-leave";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2860.
const MOMENT = new Date("2860-10-12T03:00:00Z");
const DAY = "2860-10-12";

async function addRecords(db: Database) {
  const [ani, bea] = await addTestResidents(db, 2860, "Prodi Uji Batal Izin", [
    "9937830001",
    "9937830002",
  ]);
  if (!ani || !bea) throw new Error("The residents were not added.");
  const id = crypto.randomUUID();
  const saved = await askLeave(db, ani, id, sentOuting("2860-10-13"), MOMENT);
  if (!saved.ok) throw new Error(saved.error);
  return { ani, bea, id };
}

describe("cancelLeave", () => {
  it("makes a request that waits Dibatalkan, with when", async () => {
    await inTestDatabase(async (db) => {
      const { ani, id } = await addRecords(db);

      const cancelled = await cancelLeave(db, ani, id, MOMENT);

      expect(cancelled).toEqual({ ok: true, value: null });
      const kept = await leaveById(db, id);
      expect(kept?.status).toBe("cancelled");
      expect(kept?.cancelledAt).toBeInstanceOf(Date);
    });
  });

  it("refuses a resident who cancels another resident's request, as if it were not there", async () => {
    await inTestDatabase(async (db) => {
      const { bea, id } = await addRecords(db);

      const cancelled = await cancelLeave(db, bea, id, MOMENT);

      expect(cancelled).toEqual(LEAVE_NOT_FOUND);
      expect((await leaveById(db, id))?.status).toBe("submitted");
    });
  });

  it("refuses a request that no longer waits, saying where it stands", async () => {
    await inTestDatabase(async (db) => {
      const { ani, id } = await addRecords(db);
      await db
        .update(dormLeaves)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(dormLeaves.id, id));

      const cancelled = await cancelLeave(db, ani, id, MOMENT);

      expect(cancelled).toEqual(tooLateToCancel("cancelled"));
      expect(cancelled).toEqual({
        ok: false,
        error:
          "Izin ini sudah dibatalkan, jadi tidak dapat dibatalkan lagi. Muat ulang halaman.",
      });
    });
  });

  it("refuses a role that may not ask for leave, and a key that is not one", async () => {
    await inTestDatabase(async (db) => {
      const { ani, id } = await addRecords(db);

      expect(
        await cancelLeave(db, { ...ani, roles: ["dorm_manager"] }, id, MOMENT),
      ).toEqual(ASK_NOT_ALLOWED);
      expect(await cancelLeave(db, ani, "bukan-kunci", MOMENT)).toEqual(
        LEAVE_NOT_FOUND,
      );
      expect((await leaveById(db, id))?.status).toBe("submitted");
    });
  });

  it("refuses a student who moved out of the dorm, whose request still waits for Pengelola Asrama", async () => {
    await inTestDatabase(async (db) => {
      const { ani, id } = await addRecords(db);
      const manager = await addTestActor(db, "Pengelola Uji Batal", [
        "dorm_manager",
      ]);
      const moved = await makeNonResident(db, manager, ani.studentId, DAY);
      if (!moved.ok) throw new Error(moved.error);

      const cancelled = await cancelLeave(db, ani, id, MOMENT);

      expect(cancelled).toEqual(CANCEL_NOT_A_RESIDENT);
      expect(cancelled).toEqual({
        ok: false,
        error:
          "Izin asrama hanya dapat dibatalkan oleh mahasiswa yang tinggal di asrama.",
      });
      expect((await leaveById(db, id))?.status).toBe("submitted");
      expect(await decideLeave(db, manager, id, "approve", "")).toEqual({
        ok: true,
        value: "approved",
      });
    });
  });

  it("refuses an account without a student", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addRecords(db);

      const cancelled = await cancelLeave(
        db,
        { roles: ["student"], studentId: null },
        id,
        MOMENT,
      );

      expect(cancelled).toEqual(CANCEL_NOT_A_RESIDENT);
      expect((await leaveById(db, id))?.status).toBe("submitted");
    });
  });
});
