// Room numbers of this file: NS101 to NS199.
import { describe, expect, it } from "vitest";
import { academicPeriods } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { ODD_2026 } from "@/dorms/test-records";
import type { Parsed } from "@/parsed";
import { judgeDuty } from "./judge-cleaning";
import { removeRoom } from "./remove-room";
import { lockRoom } from "./room-lock";
import {
  addTestDuty,
  changesOfDuty,
  dutyById,
  judgedBy,
  repeatsOfDuty,
} from "./test-cleaning";
import { addTestActor } from "./test-records";
import { sendBackDuty, validateDuty } from "./validate-cleaning";

/*
 * Two decisions at the same moment need two connections that both see
 * the saved rows, so these checks have a database of their own, dropped
 * at the end, and each uses a duty of its own.
 */
const own = withOwnTestDatabase("nilaibersih");

const TODAY = "2026-10-12";
const DECIDED_FIRST = {
  ok: false,
  error:
    "Penilaian ini sudah diputuskan oleh petugas lain. Muat ulang halaman.",
  stale: true,
};

async function judgedDuty(room: string, result: "met" | "not_met") {
  const bam = await addTestActor(own.db, `BAM Uji Serentak ${room}`, [
    "bam_bphk",
  ]);
  const duty = await addTestDuty(
    own.db,
    { room, place: `Lorong Uji Serentak ${room}` },
    judgedBy(bam.id, result),
  );
  const second = await addTestActor(own.db, `Pengelola Kedua ${room}`, [
    "dorm_manager",
  ]);
  return { ...duty, second };
}

describe("two decisions on one cleaning duty at the same moment", () => {
  it("validates once when Validasi is pressed twice: one point, one repeat and one log line, and the second sees a message", async () => {
    const duty = await judgedDuty("NS101", "not_met");

    const both = await own.atOnce(
      (db) => validateDuty(db, duty.manager, duty.id, TODAY),
      (db) => validateDuty(db, duty.manager, duty.id, TODAY),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(DECIDED_FIRST);
    expect(await dutyById(own.db, duty.id)).toMatchObject({
      status: "validated",
      validatedBy: duty.manager.id,
    });
    expect(await changesOfDuty(own.db, duty.id)).toHaveLength(1);
    expect(await repeatsOfDuty(own.db, duty.id)).toHaveLength(1);
  });

  it("keeps the validation of the first of two people, and refuses the second", async () => {
    const duty = await judgedDuty("NS102", "met");

    const both = await own.atOnce(
      (db) => validateDuty(db, duty.second, duty.id, TODAY),
      (db) => validateDuty(db, duty.manager, duty.id, TODAY),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(DECIDED_FIRST);
    expect((await dutyById(own.db, duty.id)).validatedBy).toBe(duty.second.id);
    expect(await changesOfDuty(own.db, duty.id)).toHaveLength(1);
  });

  it("keeps a validation that came before a sending back, with no second line", async () => {
    const duty = await judgedDuty("NS103", "not_met");

    const both = await own.atOnce(
      (db) => validateDuty(db, duty.manager, duty.id, TODAY),
      (db) => sendBackDuty(db, duty.second, duty.id, "Belum diperiksa."),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(DECIDED_FIRST);
    expect((await dutyById(own.db, duty.id)).status).toBe("validated");
    expect(await changesOfDuty(own.db, duty.id)).toHaveLength(1);
    expect(await repeatsOfDuty(own.db, duty.id)).toHaveLength(1);
  });

  it("keeps a sending back that came before a validation: no point and no repeat", async () => {
    const duty = await judgedDuty("NS104", "not_met");

    const both = await own.atOnce(
      (db) => sendBackDuty(db, duty.second, duty.id, "Belum diperiksa."),
      (db) => validateDuty(db, duty.manager, duty.id, TODAY),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error: "Tugas ini belum dinilai BAM. Muat ulang halaman.",
      stale: true,
    });
    expect((await dutyById(own.db, duty.id)).status).toBe("scheduled");
    expect(await repeatsOfDuty(own.db, duty.id)).toEqual([]);
  });

  it("keeps the judgement of the first of two BAM members, and refuses the second", async () => {
    const duty = await addTestDuty(
      own.db,
      { room: "NS105", place: "Lorong Uji Serentak NS105" },
      {},
    );
    const bphk = await addTestActor(own.db, "BAM BPHK Serentak", ["bam_bphk"]);
    const household = await addTestActor(own.db, "BAM RT Serentak", [
      "bam_household",
    ]);

    const both = await own.atOnce(
      (db) =>
        judgeDuty(
          db,
          bphk,
          { dutyId: duty.id, result: "met", note: "" },
          TODAY,
        ),
      (db) =>
        judgeDuty(
          db,
          household,
          { dutyId: duty.id, result: "not_met", note: "Kotor." },
          TODAY,
        ),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error: "Tugas ini sudah dinilai oleh petugas lain. Muat ulang halaman.",
    });
    expect(await dutyById(own.db, duty.id)).toMatchObject({
      result: "met",
      judgedBy: bphk.id,
    });
    expect(await changesOfDuty(own.db, duty.id)).toHaveLength(1);
  });
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("a validation while the room of the duty is being removed", () => {
  it("lets both finish: the room goes, the result stays validated, and no repeat is given", async () => {
    await own.db.insert(academicPeriods).values(ODD_2026);
    const duty = await judgedDuty("NS106", "not_met");
    let validation: Promise<Parsed<string>> | undefined;

    // A removal holds the room first, as removeRoom does, and only then
    // deletes it; the validation is sent while the room is held.
    const removal = await own.db.transaction(async (tx) => {
      await lockRoom(tx, duty.roomId);
      validation = validateDuty(own.otherDb, duty.manager, duty.id, TODAY);
      validation.catch(() => undefined);
      await wait(400);
      return removeRoom(tx, { roles: ["dorm_manager"] }, duty.roomId, TODAY);
    });
    if (!validation) throw new Error("The validation was not sent.");

    expect(removal).toEqual({ ok: true, value: "NS106" });
    expect(await validation).toEqual({
      ok: true,
      value:
        "Divalidasi: −1 poin. Pembersihan ulang tidak dijadwalkan karena tempat atau kamar sudah dihapus.",
    });
    expect(await dutyById(own.db, duty.id)).toMatchObject({
      status: "validated",
      roomId: null,
      roomNumber: "NS106",
    });
    expect(await repeatsOfDuty(own.db, duty.id)).toEqual([]);
  });
});
