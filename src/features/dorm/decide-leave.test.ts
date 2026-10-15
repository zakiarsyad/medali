// Sample Tahun akademik of this file: 2890 to 2890.
// Sample NIMs of this file: 9937870000 to 9937870099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormLeaves } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { askLeave } from "./ask-leave";
import { decideLeave, NO_DECISION, NOTE_TOO_LONG } from "./decide-leave";
import {
  DECIDE_NOT_ALLOWED,
  LEAVE_NOT_FOUND,
  REJECTION_NEEDS_NOTE,
  tooLateToDecide,
} from "./leave-messages";
import { addTestResidents, leaveById, sentOuting } from "./test-leave";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 2890.
const MOMENT = new Date("2890-10-12T03:00:00Z");

async function addRecords(db: Database) {
  const [ani] = await addTestResidents(db, 2890, "Prodi Uji Putus Izin", [
    "9937870001",
  ]);
  if (!ani) throw new Error("The resident was not added.");
  const manager = await addTestActor(db, "Pengelola Uji Putus Izin", [
    "dorm_manager",
  ]);
  const id = crypto.randomUUID();
  const saved = await askLeave(db, ani, id, sentOuting("2890-10-13"), MOMENT);
  if (!saved.ok) throw new Error(saved.error);
  return { ani, manager, id };
}

describe("decideLeave", () => {
  it("approves a request that waits, with who, when and the note", async () => {
    await inTestDatabase(async (db) => {
      const { manager, id } = await addRecords(db);

      const decided = await decideLeave(
        db,
        manager,
        id,
        "approve",
        "  Hati-hati di jalan.  ",
      );

      expect(decided).toEqual({ ok: true, value: "approved" });
      const kept = await leaveById(db, id);
      expect(kept).toMatchObject({
        status: "approved",
        decidedBy: manager.id,
        decisionNote: "Hati-hati di jalan.",
      });
      expect(kept?.decidedAt).toBeInstanceOf(Date);
    });
  });

  it("approves a request whose start has passed", async () => {
    await inTestDatabase(async (db) => {
      const { manager, id } = await addRecords(db);
      await db
        .update(dormLeaves)
        .set({ startsAt: new Date("2000-01-01T02:00:00Z") })
        .where(eq(dormLeaves.id, id));

      expect(await decideLeave(db, manager, id, "approve", "")).toEqual({
        ok: true,
        value: "approved",
      });
    });
  });

  it("rejects only with a note, which the resident sees", async () => {
    await inTestDatabase(async (db) => {
      const { manager, id } = await addRecords(db);

      const bare = await decideLeave(db, manager, id, "reject", "   ");
      const noted = await decideLeave(
        db,
        manager,
        id,
        "reject",
        "Bertepatan dengan kerja bakti.",
      );

      expect(bare).toEqual(REJECTION_NEEDS_NOTE);
      expect(noted).toEqual({ ok: true, value: "rejected" });
      expect((await leaveById(db, id))?.decisionNote).toBe(
        "Bertepatan dengan kerja bakti.",
      );
    });
  });

  it("refuses a hand-made approval from BAM - BPHK, and from a resident", async () => {
    await inTestDatabase(async (db) => {
      const { ani, id } = await addRecords(db);
      const bam = await addTestActor(db, "BAM Uji Putus Izin", ["bam_bphk"]);

      expect(await decideLeave(db, bam, id, "approve", "")).toEqual(
        DECIDE_NOT_ALLOWED,
      );
      expect(
        await decideLeave(
          db,
          { id: bam.id, roles: ani.roles },
          id,
          "approve",
          "",
        ),
      ).toEqual(DECIDE_NOT_ALLOWED);
      expect((await leaveById(db, id))?.status).toBe("submitted");
    });
  });

  it("refuses a request that no longer waits, saying where it stands", async () => {
    await inTestDatabase(async (db) => {
      const { manager, id } = await addRecords(db);
      await decideLeave(db, manager, id, "approve", "");

      const again = await decideLeave(db, manager, id, "reject", "Tidak jadi.");

      expect(again).toEqual(tooLateToDecide("approved"));
      expect(again).toEqual({
        ok: false,
        error:
          "Izin ini sudah disetujui lebih dulu, jadi keputusan Anda tidak disimpan. Muat ulang halaman.",
        stale: true,
      });
      expect((await leaveById(db, id))?.status).toBe("approved");
    });
  });

  it("counts an emoji in the note as one letter, as the database does", async () => {
    await inTestDatabase(async (db) => {
      const { manager, id } = await addRecords(db);

      const tooLong = await decideLeave(
        db,
        manager,
        id,
        "reject",
        "😀".repeat(501),
      );
      const longest = await decideLeave(
        db,
        manager,
        id,
        "reject",
        "😀".repeat(500),
      );

      expect(tooLong).toEqual(NOTE_TOO_LONG);
      expect(longest).toEqual({ ok: true, value: "rejected" });
    });
  });

  it("refuses a decision it does not know, and a request that is not there", async () => {
    await inTestDatabase(async (db) => {
      const { manager, id } = await addRecords(db);

      expect(await decideLeave(db, manager, id, "cancel", "")).toEqual(
        NO_DECISION,
      );
      expect(
        await decideLeave(db, manager, crypto.randomUUID(), "approve", ""),
      ).toEqual(LEAVE_NOT_FOUND);
    });
  });
});
