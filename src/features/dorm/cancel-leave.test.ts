// Sample Tahun akademik of this file: 2860 to 2860.
// Sample NIMs of this file: 9937830000 to 9937830099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormLeaves } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { askLeave } from "./ask-leave";
import { cancelLeave } from "./cancel-leave";
import {
  ASK_NOT_ALLOWED,
  LEAVE_NOT_FOUND,
  tooLateToCancel,
} from "./leave-messages";
import { addTestResidents, leaveById, sentOuting } from "./test-leave";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2860.
const MOMENT = new Date("2860-10-12T03:00:00Z");

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

      const cancelled = await cancelLeave(db, ani, id);

      expect(cancelled).toEqual({ ok: true, value: null });
      const kept = await leaveById(db, id);
      expect(kept?.status).toBe("cancelled");
      expect(kept?.cancelledAt).toBeInstanceOf(Date);
    });
  });

  it("refuses a resident who cancels another resident's request, as if it were not there", async () => {
    await inTestDatabase(async (db) => {
      const { bea, id } = await addRecords(db);

      const cancelled = await cancelLeave(db, bea, id);

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

      const cancelled = await cancelLeave(db, ani, id);

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
        await cancelLeave(db, { ...ani, roles: ["dorm_manager"] }, id),
      ).toEqual(ASK_NOT_ALLOWED);
      expect(await cancelLeave(db, ani, "bukan-kunci")).toEqual(
        LEAVE_NOT_FOUND,
      );
      expect((await leaveById(db, id))?.status).toBe("submitted");
    });
  });
});
