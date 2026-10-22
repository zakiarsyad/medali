// Sample Tahun akademik of this file: 5300 to 5300.
// Sample NIMs of this file: 9989700000 to 9989700099.
// Room numbers of this file: NJ101 to NJ199.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { placeTestResident } from "@/dorms/test-records";
import { judgeDuty } from "./judge-cleaning";
import { OWN_RECORD } from "./own-record";
import {
  addTestDuty,
  changesOfDuty,
  dutyById,
  judgedBy,
} from "./test-cleaning";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-12";
const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menilai pembersihan asrama.",
};

async function setUp(db: Database, room: string, values = {}) {
  const duty = await addTestDuty(
    db,
    { room, place: `Lorong Uji Nilai ${room}` },
    values,
  );
  const bam = await addTestActor(db, `BAM Uji Nilai ${room}`, ["bam_bphk"]);
  return { duty, bam };
}

async function expectUnjudged(db: Database, dutyId: string) {
  expect(await dutyById(db, dutyId)).toMatchObject({
    status: "scheduled",
    result: null,
    judgedBy: null,
  });
  expect(await changesOfDuty(db, dutyId)).toEqual([]);
}

/** A day of 5300, when angkatan 5300 lives in Dana Rakca. */
const OWN_TODAY = "5300-10-12";

/**
 * A duty of today given to a room where Ani lives, and Ani's account with
 * a BAM role that judges cleaning.
 */
async function setUpOwn(db: Database, room: string, role: RoleId) {
  const { duty, bam } = await setUp(db, room, { day: OWN_TODAY });
  const [ani] = await addTestResidents(db, 5300, "Prodi Uji Nilai Kamar", [
    "9989700001",
  ]);
  if (!ani) throw new Error("The resident was not added.");
  await placeTestResident(db, duty.roomId, ani.studentId);
  const own = await addTestActor(
    db,
    `Ani BAM Uji Nilai ${room}`,
    ["student", role],
    ani.studentId,
  );
  return { duty, bam, own };
}

describe("judgeDuty", () => {
  it.each(["bam_bphk", "bam_household"] as const)(
    "refuses a resident who is also %s a duty of the room they live in, also with its key in capitals",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { duty, own } = await setUpOwn(db, "NJ150", role);

        for (const dutyId of [duty.id, duty.id.toUpperCase()]) {
          for (const result of ["met", "not_met"]) {
            expect(
              await judgeDuty(
                db,
                own,
                { dutyId, result, note: "Lantai kotor." },
                OWN_TODAY,
              ),
            ).toEqual(OWN_RECORD);
          }
        }
        await expectUnjudged(db, duty.id);
      });
    },
  );

  it("lets another BAM member judge that duty, and the resident judge a duty of another room", async () => {
    await inTestDatabase(async (db) => {
      const { duty, bam, own } = await setUpOwn(db, "NJ151", "bam_bphk");
      const other = await addTestDuty(
        db,
        { room: "NJ152", place: "Lorong Uji Nilai NJ152" },
        { day: OWN_TODAY },
      );
      const met = { result: "met", note: "" };

      expect(
        await judgeDuty(db, bam, { dutyId: duty.id, ...met }, OWN_TODAY),
      ).toMatchObject({ ok: true });
      expect(
        await judgeDuty(db, own, { dutyId: other.id, ...met }, OWN_TODAY),
      ).toMatchObject({ ok: true });
    });
  });

  it("makes a duty of today Dinilai BAM with Memenuhi, who and when, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const { duty, bam } = await setUp(db, "NJ101");

      const judged = await judgeDuty(
        db,
        bam,
        { dutyId: duty.id, result: "met", note: "" },
        TODAY,
      );

      expect(judged).toEqual({
        ok: true,
        value: "Dinilai memenuhi. Menunggu validasi Pengelola Asrama.",
      });
      const kept = await dutyById(db, duty.id);
      expect(kept).toMatchObject({
        status: "judged",
        result: "met",
        judgeNote: "",
        judgedBy: bam.id,
      });
      expect(kept.judgedAt).toBeInstanceOf(Date);
      const changes = await changesOfDuty(db, duty.id);
      expect(changes).toEqual([
        expect.objectContaining({
          changedBy: bam.id,
          step: "judged",
          result: "met",
          note: "",
        }),
      ]);
    });
  });

  it("lets BAM - Kerumahtanggaan judge a duty of a past day Tidak memenuhi with its note", async () => {
    await inTestDatabase(async (db) => {
      const { duty } = await setUp(db, "NJ102", { day: "2026-10-10" });
      const household = await addTestActor(db, "BAM RT Uji Nilai", [
        "bam_household",
      ]);

      const judged = await judgeDuty(
        db,
        household,
        { dutyId: duty.id, result: "not_met", note: " Wastafel kotor. " },
        TODAY,
      );

      expect(judged).toEqual({
        ok: true,
        value: "Dinilai tidak memenuhi. Menunggu validasi Pengelola Asrama.",
      });
      expect(await dutyById(db, duty.id)).toMatchObject({
        status: "judged",
        result: "not_met",
        judgeNote: "Wastafel kotor.",
        judgedBy: household.id,
      });
    });
  });

  it("saves nothing for Tidak memenuhi without a note", async () => {
    await inTestDatabase(async (db) => {
      const { duty, bam } = await setUp(db, "NJ103");

      const judged = await judgeDuty(
        db,
        bam,
        { dutyId: duty.id, result: "not_met", note: "  " },
        TODAY,
      );

      expect(judged).toEqual({
        ok: false,
        error: "Tulis catatan bagian yang belum bersih.",
      });
      await expectUnjudged(db, duty.id);
    });
  });

  it("refuses a duty dated after today, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { duty, bam } = await setUp(db, "NJ104", { day: "2026-10-13" });

      const judged = await judgeDuty(
        db,
        bam,
        { dutyId: duty.id, result: "met", note: "" },
        TODAY,
      );

      expect(judged).toEqual({
        ok: false,
        error: "Tugas ini belum dapat dinilai sebelum tanggalnya.",
      });
      await expectUnjudged(db, duty.id);
    });
  });

  it("refuses a duty judged already, and keeps the first judgement", async () => {
    await inTestDatabase(async (db) => {
      const first = await addTestActor(db, "BAM Uji Nilai Pertama", [
        "bam_bphk",
      ]);
      const { duty, bam } = await setUp(db, "NJ105", judgedBy(first.id, "met"));

      const judged = await judgeDuty(
        db,
        bam,
        { dutyId: duty.id, result: "not_met", note: "Kotor." },
        TODAY,
      );

      expect(judged).toEqual({
        ok: false,
        error: "Tugas ini sudah dinilai oleh petugas lain. Muat ulang halaman.",
      });
      expect(await dutyById(db, duty.id)).toMatchObject({
        result: "met",
        judgedBy: first.id,
      });
    });
  });

  it("judges again a duty whose judgement was sent back, keeping the reason it was sent back", async () => {
    await inTestDatabase(async (db) => {
      const manager = await addTestActor(db, "Pengelola Uji Nilai Ulang", [
        "dorm_manager",
      ]);
      const { duty, bam } = await setUp(db, "NJ106", {
        sentBackReason: "Belum diperiksa.",
        sentBackBy: manager.id,
        sentBackAt: new Date(),
      });

      const judged = await judgeDuty(
        db,
        bam,
        { dutyId: duty.id, result: "met", note: "" },
        TODAY,
      );

      expect(judged.ok).toBe(true);
      expect(await dutyById(db, duty.id)).toMatchObject({
        status: "judged",
        sentBackReason: "Belum diperiksa.",
      });
    });
  });

  it("answers a duty that is not there", async () => {
    await inTestDatabase(async (db) => {
      const { bam } = await setUp(db, "NJ107");
      const missing = {
        ok: false,
        error: "Tugas tidak ditemukan. Muat ulang halaman.",
      };

      for (const dutyId of [
        "bukan-id",
        "00000000-0000-4000-8000-000000000000",
      ]) {
        expect(
          await judgeDuty(db, bam, { dutyId, result: "met", note: "" }, TODAY),
        ).toEqual(missing);
      }
    });
  });

  const others: RoleId[] = [
    "dorm_manager",
    "bam_compliance",
    "head_of_unit",
    "director",
    "head_of_program",
    "student",
  ];

  it.each(others)(
    "refuses a hand-made judgement of %s, and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { duty } = await setUp(db, "NJ108");
        const actor = await addTestActor(db, "Bukan Penilai Uji", [role]);

        const judged = await judgeDuty(
          db,
          actor,
          { dutyId: duty.id, result: "met", note: "" },
          TODAY,
        );

        expect(judged).toEqual(NOT_ALLOWED);
        await expectUnjudged(db, duty.id);
      });
    },
  );
});
