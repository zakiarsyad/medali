// Room numbers of this file: NJ101 to NJ199.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { judgeDuty } from "./judge-cleaning";
import {
  addTestDuty,
  changesOfDuty,
  dutyById,
  judgedBy,
} from "./test-cleaning";
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

describe("judgeDuty", () => {
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
