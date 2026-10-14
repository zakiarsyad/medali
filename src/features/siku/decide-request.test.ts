// Sample Tahun akademik of this file: 2918 to 2918.
// Sample NIMs of this file: 9964001900 to 9964001999.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
  sikuRequests,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { decideSikuRequest } from "./decide-request";
import { readOwnSiku } from "./own-siku";
import {
  NOTE_NEEDED,
  POINTS_OUTSIDE,
  REQUEST_REJECTED,
} from "./request-decision";
import {
  DECIDE_NOT_ALLOWED,
  DECIDED_BEFORE,
  REQUEST_GONE,
  STUDENT_NOT_ACTIVE,
} from "./request-messages";
import { readSikuHistory } from "./siku-history";
import { NO_PERIOD } from "./siku-messages";
import { readTotalsOf } from "./siku-totals";
import { addTestRequest } from "./test-requests";
import { addTestActor, addTestStudents, addTestYear } from "./test-siku";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 15 October 2918.
const AT = new Date("2918-10-15T03:00:00Z");

const APPROVE = { kind: "approve", points: "4", note: "Sesuai." };

async function addRecords(db: Database, withPeriod = true) {
  if (withPeriod) await addTestYear(db, 2918);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Putus Pengajuan",
    2918,
    ["9964001901"],
  );
  const [ani = ""] = studentIds;
  const requestId = await addTestRequest(db, ani, {
    day: "2918-10-12",
    more: {
      reason: "training_speaker",
      report: "Menjadi narasumber pelatihan penulisan laporan kegiatan.",
    },
  });
  const penilai = await addTestActor(db, "Penilai Uji Putus", ["assessor"]);
  return { ani, requestId, penilai };
}

async function requestById(db: Database, id: string) {
  const [request] = await db
    .select()
    .from(sikuRequests)
    .where(eq(sikuRequests.id, id));
  return request;
}

async function gainsOf(db: Database, studentId: string) {
  return db
    .select({ entry: sikuAdjustments })
    .from(sikuAdjustmentStudents)
    .innerJoin(
      sikuAdjustments,
      eq(sikuAdjustments.id, sikuAdjustmentStudents.adjustmentId),
    )
    .where(eq(sikuAdjustmentStudents.studentId, studentId));
}

describe("decideSikuRequest", () => {
  it("approves with a gain of the points for that student alone, with the request's reason, day and report, logged, and kept on the request", async () => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db);

      const decided = await decideSikuRequest(
        db,
        penilai,
        requestId,
        APPROVE,
        AT,
      );

      expect(decided).toEqual({
        ok: true,
        value: "Disetujui: +4 SIKU untuk Mahasiswa Uji SIKU 1.",
      });
      const gains = await gainsOf(db, ani);
      expect(gains).toHaveLength(1);
      const entry = gains[0]?.entry;
      expect(entry).toMatchObject({
        kind: "gain",
        reason: "training_speaker",
        points: 4,
        day: "2918-10-12",
        note: "Menjadi narasumber pelatihan penulisan laporan kegiatan.",
        basis: "",
        enteredBy: penilai.id,
        enteredAs: "assessor",
        enteredAt: AT,
        uploadId: null,
      });
      const named = await db
        .select()
        .from(sikuAdjustmentStudents)
        .where(eq(sikuAdjustmentStudents.adjustmentId, entry?.id ?? ""));
      expect(named).toHaveLength(1);
      const lines = await db
        .select()
        .from(sikuAdjustmentChanges)
        .where(eq(sikuAdjustmentChanges.adjustmentId, entry?.id ?? ""));
      expect(lines).toMatchObject([
        { changedBy: penilai.id, action: "entered" },
      ]);
      expect(await requestById(db, requestId)).toMatchObject({
        status: "approved",
        entryId: entry?.id,
        decidedBy: penilai.id,
        decidedAs: "assessor",
        decidedAt: AT,
        decisionNote: "Sesuai.",
      });
      const totals = await readTotalsOf(db, [ani]);
      expect(totals.get(ani)).toEqual({ gains: 4, losses: 0 });
    });
  });

  it.each([
    [["head_of_unit"], "head_of_unit"],
    [["head_of_unit", "assessor"], "assessor"],
  ] as const)("keeps the role %j decided as: %s", async (roles, decidedAs) => {
    await inTestDatabase(async (db) => {
      const { requestId } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Putus", [...roles]);

      await decideSikuRequest(db, kepala, requestId, APPROVE, AT);

      expect((await requestById(db, requestId))?.decidedAs).toBe(decidedAs);
    });
  });

  it("rejects with its note, and makes no gain", async () => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db);

      const decided = await decideSikuRequest(
        db,
        penilai,
        requestId,
        { kind: "reject", points: "", note: "Sudah tercatat." },
        AT,
      );

      expect(decided).toEqual({ ok: true, value: REQUEST_REJECTED });
      expect(await requestById(db, requestId)).toMatchObject({
        status: "rejected",
        decisionNote: "Sudah tercatat.",
        entryId: null,
        decidedAs: "assessor",
      });
      expect(await gainsOf(db, ani)).toEqual([]);
    });
  });

  it.each([
    [
      "a rejection without a note",
      { kind: "reject", points: "", note: " " },
      NOTE_NEEDED,
    ],
    [
      "points outside 1–30",
      { kind: "approve", points: "31", note: "" },
      POINTS_OUTSIDE,
    ],
  ])("changes nothing for %s", async (_what, sent, error) => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db);

      const decided = await decideSikuRequest(db, penilai, requestId, sent, AT);

      expect(decided).toEqual({ ok: false, error });
      expect((await requestById(db, requestId))?.status).toBe("waiting");
      expect(await gainsOf(db, ani)).toEqual([]);
    });
  });

  it.each(["mentor", "director", "head_of_program", "student"] as const)(
    "refuses %s, who may not decide, and changes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { ani, requestId } = await addRecords(db);
        const roles: RoleId[] = [role];
        const someone = await addTestActor(db, "Bukan Penilai Uji", roles);

        const decided = await decideSikuRequest(
          db,
          someone,
          requestId,
          APPROVE,
          AT,
        );

        expect(decided).toEqual(DECIDE_NOT_ALLOWED);
        expect((await requestById(db, requestId))?.status).toBe("waiting");
        expect(await gainsOf(db, ani)).toEqual([]);
      });
    },
  );

  it("refuses to approve for a student who is not Aktif now, and still lets the request be rejected", async () => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db);
      await db
        .update(students)
        .set({ status: "inactive" })
        .where(eq(students.id, ani));

      const approved = await decideSikuRequest(
        db,
        penilai,
        requestId,
        APPROVE,
        AT,
      );
      const rejected = await decideSikuRequest(
        db,
        penilai,
        requestId,
        { kind: "reject", points: "", note: "Mahasiswa tidak aktif." },
        AT,
      );

      expect(approved).toEqual(STUDENT_NOT_ACTIVE);
      expect(rejected.ok).toBe(true);
      expect(await gainsOf(db, ani)).toEqual([]);
    });
  });

  it("refuses to approve while no academic period runs, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db, false);

      const decided = await decideSikuRequest(
        db,
        penilai,
        requestId,
        APPROVE,
        AT,
      );

      expect(decided).toEqual(NO_PERIOD);
      expect((await requestById(db, requestId))?.status).toBe("waiting");
      expect(await gainsOf(db, ani)).toEqual([]);
    });
  });

  it("refuses a second decision, and a second Setujui adds no second gain", async () => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db);
      await decideSikuRequest(db, penilai, requestId, APPROVE, AT);

      const again = await decideSikuRequest(
        db,
        penilai,
        requestId,
        APPROVE,
        AT,
      );
      const rejected = await decideSikuRequest(
        db,
        penilai,
        requestId,
        { kind: "reject", points: "", note: "Berubah pikiran." },
        AT,
      );

      expect(again).toEqual(DECIDED_BEFORE);
      expect(rejected).toEqual(DECIDED_BEFORE);
      expect(await gainsOf(db, ani)).toHaveLength(1);
      expect((await requestById(db, requestId))?.status).toBe("approved");
    });
  });

  it("answers a withdrawn request, and a key that is no key, as gone", async () => {
    await inTestDatabase(async (db) => {
      const { requestId, penilai } = await addRecords(db);
      await db
        .update(sikuRequests)
        .set({ status: "withdrawn", withdrawnAt: AT })
        .where(eq(sikuRequests.id, requestId));

      expect(
        await decideSikuRequest(db, penilai, requestId, APPROVE, AT),
      ).toEqual(REQUEST_GONE);
      expect(
        await decideSikuRequest(db, penilai, "bukan", APPROVE, AT),
      ).toEqual(REQUEST_GONE);
    });
  });

  it("keeps a long report as the gain's Keterangan cut to what an entry holds", async () => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db);
      await db
        .update(sikuRequests)
        .set({ report: "a".repeat(1000) })
        .where(eq(sikuRequests.id, requestId));

      await decideSikuRequest(db, penilai, requestId, APPROVE, AT);

      const [gain] = await gainsOf(db, ani);
      expect(gain?.entry.note).toHaveLength(500);
    });
  });

  it("marks the gain as Pengajuan mahasiswa in the history and in the student's own SIKU", async () => {
    await inTestDatabase(async (db) => {
      const { ani, requestId, penilai } = await addRecords(db);
      const student = await addTestActor(db, "Ani Uji Putus", ["student"], {
        studentId: ani,
      });

      await decideSikuRequest(db, penilai, requestId, APPROVE, AT);

      const history = await readSikuHistory(db, eq(students.id, ani), 1);
      expect(history.entries).toMatchObject([
        { source: "form", fromRequest: true, points: 4, students: 1 },
      ]);
      const own = await readOwnSiku(db, student);
      expect(own.kind === "shown" && own.siku.entries).toMatchObject([
        { fromRequest: true, enteredAs: "assessor" },
      ]);
    });
  });
});
