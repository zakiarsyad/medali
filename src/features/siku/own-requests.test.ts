// Sample Tahun akademik of this file: 2914 to 2914.
// Sample NIMs of this file: 9964001500 to 9964001599.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readOwnRequests, waitingCount } from "./own-requests";
import { addTestRequest } from "./test-requests";
import {
  addTestActor,
  addTestEntry,
  addTestStudents,
  addTestYear,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2914);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Pengajuan Saya",
    2914,
    ["9964001501", "9964001502"],
  );
  const [ani = "", budi = ""] = studentIds;
  const student = await addTestActor(db, "Ani Uji Pengajuan", ["student"], {
    studentId: ani,
  });
  const penilai = await addTestActor(db, "Penilai Uji Pengajuan", ["assessor"]);
  return { periods, ani, budi, student, penilai };
}

describe("readOwnRequests", () => {
  it("gives the student's own requests, the newest first, each as shown, with the role that decided it and no withdrawn one", async () => {
    await inTestDatabase(async (db) => {
      const { periods, ani, budi, student, penilai } = await addRecords(db);
      const gainOf = (cancelled: boolean) =>
        addTestEntry(db, penilai, {
          kind: "gain",
          reason: "knowledge_sharing",
          points: 4,
          day: "2914-10-10",
          periodId: periods.odd,
          studentIds: [ani],
          cancelled,
        });
      const decided = {
        decidedBy: penilai.id,
        decidedAs: "assessor",
        decidedAt: new Date("2914-10-12T03:00:00Z"),
      } as const;
      const waiting = await addTestRequest(db, ani, {
        sentAt: new Date("2914-10-14T03:00:00Z"),
        photoKeys: ["a", null],
      });
      const approved = await addTestRequest(db, ani, {
        sentAt: new Date("2914-10-13T03:00:00Z"),
        more: {
          ...decided,
          status: "approved",
          entryId: await gainOf(false),
          decisionNote: "Sesuai.",
        },
      });
      const cancelled = await addTestRequest(db, ani, {
        sentAt: new Date("2914-10-12T03:00:00Z"),
        more: { ...decided, status: "approved", entryId: await gainOf(true) },
      });
      const rejected = await addTestRequest(db, ani, {
        sentAt: new Date("2914-10-11T03:00:00Z"),
        more: { ...decided, status: "rejected", decisionNote: "Tidak sesuai." },
      });
      await addTestRequest(db, ani, {
        more: { status: "withdrawn", withdrawnAt: new Date() },
      });
      await addTestRequest(db, budi);

      const requests = await readOwnRequests(db, student);

      expect(requests?.map((request) => request.id)).toEqual([
        waiting,
        approved,
        cancelled,
        rejected,
      ]);
      expect(requests?.map((request) => request.status)).toEqual([
        "waiting",
        "approved",
        "cancelled",
        "rejected",
      ]);
      expect(requests?.[0]).toMatchObject({
        points: null,
        decidedAs: null,
        photos: [{ isKept: true }, { isKept: false }],
      });
      expect(requests?.[1]).toMatchObject({
        points: 4,
        decidedAs: "assessor",
        note: "Sesuai.",
      });
      expect(requests?.[3]?.note).toBe("Tidak sesuai.");
      expect(waitingCount(requests ?? [])).toBe(1);
    });
  });

  it("refuses an account that may not ask, and one with no student", async () => {
    await inTestDatabase(async (db) => {
      const { student, penilai } = await addRecords(db);
      const nobody = await addTestActor(db, "Tanpa Mahasiswa", ["student"]);

      expect(await readOwnRequests(db, { ...student, roles: ["mentor"] })).toBe(
        null,
      );
      expect(await readOwnRequests(db, penilai)).toBe(null);
      expect(await readOwnRequests(db, nobody)).toBe(null);
    });
  });
});
