// Sample Tahun akademik of this file: 2913 to 2913.
// Sample NIMs of this file: 9964001300 to 9964001399.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { samplePhotoBytes } from "@/db/sample-attendance-photo";
import { sikuRequests, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { FileStore } from "@/files/file-store";
import { memoryStore } from "@/files/memory-store";
import { DAY_IN_FUTURE, NO_REASON } from "./request-input";
import {
  ASK_NOT_ALLOWED,
  NO_PHOTO_STORAGE,
  NOT_AN_ACTIVE_STUDENT,
  PHOTOS_NOT_KEPT,
  REQUEST_ALREADY_SENT,
  REQUEST_SENT,
} from "./request-messages";
import { NO_PHOTO, TOO_MANY_PHOTOS } from "./request-photo";
import {
  type SentPhoto,
  type SentRequest,
  sendSikuRequest,
} from "./send-request";
import { photosOf } from "./test-requests";
import { addTestActor, addTestStudents } from "./test-siku";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 15 October 2913.
const AT = new Date("2913-10-15T03:00:00Z");

const PHOTO: SentPhoto = {
  photo: { name: "foto-bukti-siku.jpg", bytes: samplePhotoBytes() },
  thumb: { name: "foto-bukti-siku.jpg", bytes: samplePhotoBytes() },
};

const SENT: SentRequest = {
  reason: "peer_mentoring",
  day: "2913-10-14",
  report: "Membimbing dua mahasiswa lain menyiapkan ujian akuntansi.",
  photos: [PHOTO, PHOTO],
};

async function addRecords(db: Database) {
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Kirim Pengajuan",
    2913,
    ["9964001301", "9964001302"],
  );
  const [ani = "", budi = ""] = studentIds;
  return {
    ani: await addTestActor(db, "Ani Uji Kirim", ["student"], {
      studentId: ani,
    }),
    budi: await addTestActor(db, "Budi Uji Kirim", ["student"], {
      studentId: budi,
    }),
  };
}

function requestsOf(db: Database, studentId: string | null) {
  return db
    .select()
    .from(sikuRequests)
    .where(eq(sikuRequests.studentId, studentId ?? ""));
}

const BROKEN_STORE: FileStore = {
  ...memoryStore(),
  async put() {
    throw new Error("The file storage cannot be reached.");
  },
};

describe("sendSikuRequest", () => {
  it("keeps a waiting request of the account's own student, with each photo large and small, in the order picked", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const store = memoryStore();
      const id = crypto.randomUUID();

      const sent = await sendSikuRequest(db, store, ani, id, SENT, AT);

      expect(sent).toEqual({ ok: true, value: REQUEST_SENT });
      const [kept] = await requestsOf(db, ani.studentId);
      expect(kept).toMatchObject({
        id,
        studentId: ani.studentId,
        reason: "peer_mentoring",
        day: "2913-10-14",
        report: SENT.report,
        status: "waiting",
        sentAt: AT,
        decidedBy: null,
        entryId: null,
      });
      const photos = await photosOf(db, id);
      expect(photos.map((photo) => photo.place)).toEqual([1, 2]);
      expect(store.files.size).toBe(4);
      for (const photo of photos) {
        expect(store.files.has(photo.photoKey ?? "")).toBe(true);
        expect(store.files.has(photo.thumbKey ?? "")).toBe(true);
      }
    });
  });

  it.each([
    ["Penilai Mahasiswa", ["assessor"] as const],
    ["Kepala Unit", ["head_of_unit"] as const],
  ])("refuses %s, who may not ask", async (_who, roles) => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      // A staff account that names a student, as by a mistake.
      const staff = { ...ani, roles: [...roles] };
      const store = memoryStore();

      const sent = await sendSikuRequest(
        db,
        store,
        staff,
        crypto.randomUUID(),
        SENT,
        AT,
      );

      expect(sent).toEqual(ASK_NOT_ALLOWED);
      expect(await requestsOf(db, ani.studentId)).toEqual([]);
      expect(store.files.size).toBe(0);
    });
  });

  it("refuses a Mahasiswa account with no student", async () => {
    await inTestDatabase(async (db) => {
      const nobody = await addTestActor(db, "Tanpa Mahasiswa", ["student"]);

      const sent = await sendSikuRequest(
        db,
        memoryStore(),
        nobody,
        crypto.randomUUID(),
        SENT,
        AT,
      );

      expect(sent).toEqual(ASK_NOT_ALLOWED);
    });
  });

  it.each([
    ["no reason", { reason: "" }, NO_REASON],
    ["a day after today", { day: "2913-10-16" }, DAY_IN_FUTURE],
    ["no photo", { photos: [] }, NO_PHOTO],
    ["four photos", { photos: [PHOTO, PHOTO, PHOTO, PHOTO] }, TOO_MANY_PHOTOS],
  ])("keeps nothing for %s", async (_what, change, error) => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const store = memoryStore();

      const sent = await sendSikuRequest(
        db,
        store,
        ani,
        crypto.randomUUID(),
        { ...SENT, ...change },
        AT,
      );

      expect(sent).toEqual({ ok: false, error });
      expect(await requestsOf(db, ani.studentId)).toEqual([]);
      expect(store.files.size).toBe(0);
    });
  });

  it("keeps nothing for a photo or a small copy that is no JPEG, whatever its name says", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const store = memoryStore();
      const fake = { name: "foto.jpg", bytes: new TextEncoder().encode("x") };

      const wrongPhoto = await sendSikuRequest(
        db,
        store,
        ani,
        crypto.randomUUID(),
        { ...SENT, photos: [PHOTO, { photo: fake, thumb: PHOTO.thumb }] },
        AT,
      );
      const wrongThumb = await sendSikuRequest(
        db,
        store,
        ani,
        crypto.randomUUID(),
        { ...SENT, photos: [{ photo: PHOTO.photo, thumb: fake }] },
        AT,
      );

      expect(wrongPhoto.ok).toBe(false);
      expect(wrongThumb.ok).toBe(false);
      expect(await requestsOf(db, ani.studentId)).toEqual([]);
      expect(store.files.size).toBe(0);
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "refuses a student who is %s now, as gains go to Aktif students only",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { ani } = await addRecords(db);
        await db
          .update(students)
          .set({ status })
          .where(eq(students.id, ani.studentId ?? ""));

        const sent = await sendSikuRequest(
          db,
          memoryStore(),
          ani,
          crypto.randomUUID(),
          SENT,
          AT,
        );

        expect(sent).toEqual(NOT_AN_ACTIVE_STUDENT);
      });
    },
  );

  it("keeps nothing where file keeping is off, and says the photos cannot be stored yet", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const sent = await sendSikuRequest(
        db,
        null,
        ani,
        crypto.randomUUID(),
        SENT,
        AT,
      );

      expect(sent).toEqual(NO_PHOTO_STORAGE);
      expect(await requestsOf(db, ani.studentId)).toEqual([]);
    });
  });

  it("keeps nothing when the file storage fails, and asks to try again", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const sent = await sendSikuRequest(
        db,
        BROKEN_STORE,
        ani,
        crypto.randomUUID(),
        SENT,
        AT,
      );

      expect(sent).toEqual(PHOTOS_NOT_KEPT);
      expect(await requestsOf(db, ani.studentId)).toEqual([]);
    });
  });

  it("keeps a request sent twice once, answers the second as the first, and keeps no photo of the second", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);
      const store = memoryStore();
      const id = crypto.randomUUID();
      await sendSikuRequest(db, store, ani, id, SENT, AT);

      const again = await sendSikuRequest(db, store, ani, id, SENT, AT);

      expect(again).toEqual({ ok: true, value: REQUEST_SENT });
      expect(await requestsOf(db, ani.studentId)).toHaveLength(1);
      expect(store.files.size).toBe(4);
    });
  });

  it("refuses the key of another student's request, and keeps nothing for it", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi } = await addRecords(db);
      const id = crypto.randomUUID();
      await sendSikuRequest(db, memoryStore(), ani, id, SENT, AT);

      const sent = await sendSikuRequest(db, memoryStore(), budi, id, SENT, AT);

      expect(sent).toEqual(REQUEST_ALREADY_SENT);
      expect(await requestsOf(db, budi.studentId)).toEqual([]);
    });
  });
});
