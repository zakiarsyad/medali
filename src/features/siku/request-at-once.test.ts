// Sample NIMs of this file: 9964001400 to 9964001499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { samplePhotoBytes } from "@/db/sample-attendance-photo";
import {
  sikuAdjustmentStudents,
  sikuRequestPhotos,
  sikuRequests,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import { decideSikuRequest } from "./decide-request";
import { REQUEST_REJECTED } from "./request-decision";
import {
  ALREADY_DECIDED,
  DECIDED_BEFORE,
  REQUEST_GONE,
  REQUEST_SENT,
  REQUEST_WITHDRAWN,
} from "./request-messages";
import { type SentRequest, sendSikuRequest } from "./send-request";
import { addTestRequest } from "./test-requests";
import {
  addTestActor,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";
import { withdrawSikuRequest } from "./withdraw-request";

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

const APPROVE = { kind: "approve", points: "3", note: "" };
const REJECT = { kind: "reject", points: "", note: "Tidak sesuai." };

/** A request that waits, of the student of the file. */
async function waitingRequest(): Promise<string> {
  const { student } = await prepared();
  return addTestRequest(own.db, student.studentId ?? "", {
    day: "2026-10-11",
  });
}

async function statusOf(id: string) {
  const [request] = await own.db
    .select({ status: sikuRequests.status, entryId: sikuRequests.entryId })
    .from(sikuRequests)
    .where(eq(sikuRequests.id, id));
  return request;
}

async function gainsOfRequest(id: string) {
  const request = await statusOf(id);
  if (!request?.entryId) return [];
  return own.db
    .select()
    .from(sikuAdjustmentStudents)
    .where(eq(sikuAdjustmentStudents.adjustmentId, request.entryId));
}

describe("Setujui pressed twice at the same moment", () => {
  it("adds one gain: the second waits, then is told it was decided", async () => {
    const { penilai, student } = await prepared();
    const id = await waitingRequest();

    const both = await own.atOnce(
      (db) => decideSikuRequest(db, penilai, id, APPROVE, MOMENT),
      (db) => decideSikuRequest(db, penilai, id, APPROVE, MOMENT),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(DECIDED_BEFORE);
    expect(await gainsOfRequest(id)).toMatchObject([
      { studentId: student.studentId },
    ]);
  });
});

describe("two staff deciding the same request at the same moment", () => {
  it("keeps the first decision and refuses the second with a message", async () => {
    const { penilai } = await prepared();
    const kepala = await addTestActor(own.db, "Kepala Uji Sekaligus", [
      "head_of_unit",
    ]);
    const id = await waitingRequest();

    const both = await own.atOnce(
      (db) => decideSikuRequest(db, kepala, id, REJECT, MOMENT),
      (db) => decideSikuRequest(db, penilai, id, APPROVE, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: REQUEST_REJECTED });
    expect(both.later).toEqual(DECIDED_BEFORE);
    expect(await statusOf(id)).toEqual({ status: "rejected", entryId: null });
  });
});

describe("a withdrawal and a decision at the same moment", () => {
  it("lets the withdrawal saved first win, and refuses the decision with a message", async () => {
    const { penilai, student } = await prepared();
    const id = await waitingRequest();

    const both = await own.atOnce(
      (db) => withdrawSikuRequest(db, student, id, MOMENT),
      (db) => decideSikuRequest(db, penilai, id, APPROVE, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: REQUEST_WITHDRAWN });
    expect(both.later).toEqual(REQUEST_GONE);
    expect(await statusOf(id)).toEqual({ status: "withdrawn", entryId: null });
  });

  it("lets the decision saved first win, and refuses the withdrawal with a message", async () => {
    const { penilai, student } = await prepared();
    const id = await waitingRequest();

    const both = await own.atOnce(
      (db) => decideSikuRequest(db, penilai, id, APPROVE, MOMENT),
      (db) => withdrawSikuRequest(db, student, id, MOMENT),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(ALREADY_DECIDED);
    expect((await statusOf(id))?.status).toBe("approved");
  });
});
