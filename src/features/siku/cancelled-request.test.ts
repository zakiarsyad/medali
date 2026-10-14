// Sample Tahun akademik of this file: 2919 to 2919.
// Sample NIMs of this file: 9964002000 to 9964002099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { sikuRequests } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelSikuEntry } from "./cancel-entry";
import { decideSikuRequest } from "./decide-request";
import { readOwnRequests } from "./own-requests";
import { readRequestBoard } from "./request-board";
import { readTotalsOf } from "./siku-totals";
import { addTestRequest } from "./test-requests";
import { addTestActor, addTestStudents, addTestYear } from "./test-siku";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 15 October 2919.
const AT = new Date("2919-10-15T03:00:00Z");

async function approvedRequest(db: Database) {
  await addTestYear(db, 2919);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Pengajuan Dibatalkan",
    2919,
    ["9964002001"],
  );
  const [ani = ""] = studentIds;
  const student = await addTestActor(db, "Ani Uji Dibatalkan", ["student"], {
    studentId: ani,
  });
  const penilai = await addTestActor(db, "Penilai Uji Dibatalkan", [
    "assessor",
  ]);
  const requestId = await addTestRequest(db, ani, { day: "2919-10-12" });
  await decideSikuRequest(
    db,
    penilai,
    requestId,
    { kind: "approve", points: "5", note: "" },
    AT,
  );
  const [request] = await db
    .select({ entryId: sikuRequests.entryId })
    .from(sikuRequests)
    .where(eq(sikuRequests.id, requestId));
  return { ani, student, penilai, requestId, entryId: request?.entryId ?? "" };
}

describe("a request whose gain is cancelled with Batalkan", () => {
  it("shows the student Dibatalkan, and their SIKU falls back", async () => {
    await inTestDatabase(async (db) => {
      const { ani, student, penilai, requestId, entryId } =
        await approvedRequest(db);
      const before = await readOwnRequests(db, student);

      const cancelled = await cancelSikuEntry(db, penilai, entryId);

      expect(before?.[0]?.status).toBe("approved");
      expect(cancelled.ok).toBe(true);
      const after = await readOwnRequests(db, student);
      expect(after).toMatchObject([{ id: requestId, status: "cancelled" }]);
      const totals = await readTotalsOf(db, [ani]);
      expect(totals.get(ani)).toEqual({ gains: 0, losses: 0 });
    });
  });

  it("leaves Disetujui for staff, and shows as Dibatalkan under Semua", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, requestId, entryId } = await approvedRequest(db);
      const visible = visibleTo({ kind: "all" });
      await cancelSikuEntry(db, penilai, entryId);

      const approved = await readRequestBoard(db, visible, "approved", 1);
      const all = await readRequestBoard(db, visible, "all", 1);

      expect(approved.cards.map((card) => card.id)).not.toContain(requestId);
      expect(all.cards).toContainEqual(
        expect.objectContaining({ id: requestId, status: "cancelled" }),
      );
    });
  });

  it("keeps the request decided, so it cannot be decided again", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, requestId, entryId } = await approvedRequest(db);
      await cancelSikuEntry(db, penilai, entryId);

      const again = await decideSikuRequest(
        db,
        penilai,
        requestId,
        { kind: "approve", points: "5", note: "" },
        AT,
      );

      expect(again.ok).toBe(false);
    });
  });
});
