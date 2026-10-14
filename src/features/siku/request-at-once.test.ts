// Sample NIMs of this file: 9964001400 to 9964001499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { samplePhotoBytes } from "@/db/sample-attendance-photo";
import { sikuRequestPhotos, sikuRequests } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import { REQUEST_SENT } from "./request-messages";
import { type SentRequest, sendSikuRequest } from "./send-request";
import {
  addTestActor,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("sikurequest");

// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");

const PHOTO = { name: "foto-bukti-siku.jpg", bytes: samplePhotoBytes() };

const SENT: SentRequest = {
  reason: "knowledge_sharing",
  day: "2026-10-11",
  report: "Berbagi pengetahuan literasi keuangan untuk mahasiswa baru.",
  photos: [{ photo: PHOTO, thumb: PHOTO }],
};

let records: { student: TestActor; penilai: TestActor } | undefined;

/** The period, a student with an account and Penilai Mahasiswa, once for the file. */
async function prepared() {
  if (records) return records;
  await addTestYear(own.db, 2026);
  const { studentIds } = await addTestStudents(
    own.db,
    "Prodi Uji Pengajuan Sekaligus",
    2026,
    ["9964001401"],
  );
  const student = await addTestActor(own.db, "Ani Uji Sekaligus", ["student"], {
    studentId: studentIds[0] ?? null,
  });
  const penilai = await addTestActor(own.db, "Penilai Uji Pengajuan", [
    "assessor",
  ]);
  records = { student, penilai };
  return records;
}

describe("Kirim pengajuan pressed twice at the same moment", () => {
  it("keeps the request once with its photos once: the second waits, then answers the same", async () => {
    const { student } = await prepared();
    const store = memoryStore();
    const id = crypto.randomUUID();

    const both = await own.atOnce(
      (db) => sendSikuRequest(db, store, student, id, SENT, MOMENT),
      (db) => sendSikuRequest(db, store, student, id, SENT, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: REQUEST_SENT });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(sikuRequests)
      .where(eq(sikuRequests.id, id));
    const photos = await own.db
      .select()
      .from(sikuRequestPhotos)
      .where(eq(sikuRequestPhotos.requestId, id));
    expect(kept).toHaveLength(1);
    expect(photos).toHaveLength(1);
    expect(store.files.size).toBe(2);
  });
});
