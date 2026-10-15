// Room numbers of this file: NV101 to NV199.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { dormCleaningDuties, dormCleaningPlaces } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestRoom } from "@/dorms/test-records";
import {
  addTestDuty,
  changesOfDuty,
  dutyById,
  judgedBy,
  repeatsOfDuty,
} from "./test-cleaning";
import { addTestActor, type TestActor } from "./test-records";
import { sendBackDuty, validateDuty } from "./validate-cleaning";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-12";
const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak memvalidasi penilaian pembersihan asrama.",
};
const DECIDED_FIRST = {
  ok: false,
  error:
    "Penilaian ini sudah diputuskan oleh petugas lain. Muat ulang halaman.",
};
const NOT_JUDGED = {
  ok: false,
  error: "Tugas ini belum dinilai BAM. Muat ulang halaman.",
};

interface Setting {
  dutyId: string;
  roomId: string;
  placeId: string;
  manager: TestActor;
  bam: TestActor;
}

/** A duty of today judged by BAM - BPHK, with what else is given. */
async function setUp(
  db: Database,
  room: string,
  result: "met" | "not_met" | null,
  values = {},
): Promise<Setting> {
  const bam = await addTestActor(db, `BAM Uji Validasi ${room}`, ["bam_bphk"]);
  const judged = result === null ? {} : judgedBy(bam.id, result);
  const duty = await addTestDuty(
    db,
    { room, place: `Lorong Uji Validasi ${room}` },
    { ...judged, ...values },
  );
  return {
    dutyId: duty.id,
    roomId: duty.roomId,
    placeId: duty.placeId,
    manager: duty.manager,
    bam,
  };
}

describe("validateDuty", () => {
  it("makes a duty judged Memenuhi Divalidasi with who and when, says +1 and logs it, with no repeat", async () => {
    await inTestDatabase(async (db) => {
      const { dutyId, manager } = await setUp(db, "NV101", "met");

      const validated = await validateDuty(db, manager, dutyId, TODAY);

      expect(validated).toEqual({
        ok: true,
        value: "Divalidasi: +1 poin untuk kamar.",
      });
      const kept = await dutyById(db, dutyId);
      expect(kept).toMatchObject({
        status: "validated",
        result: "met",
        validatedBy: manager.id,
      });
      expect(kept.validatedAt).toBeInstanceOf(Date);
      expect(await changesOfDuty(db, dutyId)).toEqual([
        expect.objectContaining({
          changedBy: manager.id,
          step: "validated",
          result: "met",
        }),
      ]);
      expect(await repeatsOfDuty(db, dutyId)).toEqual([]);
    });
  });

  it("says −1 for Tidak memenuhi and gives the same place and room a Pembersihan ulang the next day", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db, "NV102", "not_met");

      const validated = await validateDuty(
        db,
        setting.manager,
        setting.dutyId,
        TODAY,
      );

      expect(validated).toEqual({
        ok: true,
        value:
          "Divalidasi: −1 poin. Pembersihan ulang dijadwalkan Selasa, 13 Okt 2026.",
      });
      expect(await repeatsOfDuty(db, setting.dutyId)).toEqual([
        expect.objectContaining({
          day: "2026-10-13",
          placeId: setting.placeId,
          roomId: setting.roomId,
          roomNumber: "NV102",
          status: "scheduled",
          createdBy: setting.manager.id,
        }),
      ]);
    });
  });

  it("puts the repeat on the next free day of the place, and names that day", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db, "NV103", "not_met", {
        day: "2026-10-10",
      });
      const other = await addTestRoom(db, { number: "NV104" });
      const taken = {
        dorm: "dana_rakca",
        placeId: setting.placeId,
        roomId: other,
        roomNumber: "NV104",
        createdBy: setting.manager.id,
      } as const;
      await db.insert(dormCleaningDuties).values([
        { ...taken, day: "2026-10-13" },
        { ...taken, day: "2026-10-14" },
        { ...taken, day: "2026-10-16" },
      ]);

      const validated = await validateDuty(
        db,
        setting.manager,
        setting.dutyId,
        TODAY,
      );

      expect(validated).toEqual({
        ok: true,
        value:
          "Divalidasi: −1 poin. Pembersihan ulang dijadwalkan Kamis, 15 Okt 2026.",
      });
      const [repeat] = await repeatsOfDuty(db, setting.dutyId);
      expect(repeat).toMatchObject({
        day: "2026-10-15",
        roomId: setting.roomId,
      });
    });
  });

  it("puts the repeat of an own-room duty on the next day that room's own room is free", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db, "NV105", "not_met", { placeId: null });
      await db.insert(dormCleaningDuties).values({
        day: "2026-10-13",
        dorm: "dana_rakca",
        roomId: setting.roomId,
        roomNumber: "NV105",
        createdBy: setting.manager.id,
      });

      await validateDuty(db, setting.manager, setting.dutyId, TODAY);

      expect(await repeatsOfDuty(db, setting.dutyId)).toEqual([
        expect.objectContaining({
          day: "2026-10-14",
          placeId: null,
          roomId: setting.roomId,
        }),
      ]);
    });
  });

  it("gives no repeat when the place has been removed, and says so", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db, "NV106", "not_met");
      await db
        .update(dormCleaningPlaces)
        .set({
          removedFrom: TODAY,
          deletedAt: new Date(),
          deletedBy: setting.manager.id,
        })
        .where(eq(dormCleaningPlaces.id, setting.placeId));

      const validated = await validateDuty(
        db,
        setting.manager,
        setting.dutyId,
        TODAY,
      );

      expect(validated).toEqual({
        ok: true,
        value:
          "Divalidasi: −1 poin. Pembersihan ulang tidak dijadwalkan karena tempat atau kamar sudah dihapus.",
      });
      expect((await dutyById(db, setting.dutyId)).status).toBe("validated");
      expect(await repeatsOfDuty(db, setting.dutyId)).toEqual([]);
    });
  });

  it("refuses a second press: one validation, one log line and one repeat", async () => {
    await inTestDatabase(async (db) => {
      const { dutyId, manager } = await setUp(db, "NV107", "not_met");

      await validateDuty(db, manager, dutyId, TODAY);
      const again = await validateDuty(db, manager, dutyId, TODAY);

      expect(again).toEqual(DECIDED_FIRST);
      expect(await changesOfDuty(db, dutyId)).toHaveLength(1);
      expect(await repeatsOfDuty(db, dutyId)).toHaveLength(1);
    });
  });

  it("refuses a duty that BAM has not judged", async () => {
    await inTestDatabase(async (db) => {
      const { dutyId, manager } = await setUp(db, "NV108", null);

      expect(await validateDuty(db, manager, dutyId, TODAY)).toEqual(
        NOT_JUDGED,
      );
      expect((await dutyById(db, dutyId)).status).toBe("scheduled");
    });
  });

  const others: RoleId[] = [
    "bam_bphk",
    "bam_household",
    "bam_compliance",
    "head_of_unit",
    "director",
    "head_of_program",
    "student",
  ];

  it.each(others)(
    "refuses a hand-made validation of %s, and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { dutyId } = await setUp(db, "NV109", "not_met");
        const actor = await addTestActor(db, "Bukan Validator Uji", [role]);

        expect(await validateDuty(db, actor, dutyId, TODAY)).toEqual(
          NOT_ALLOWED,
        );
        expect((await dutyById(db, dutyId)).status).toBe("judged");
        expect(await changesOfDuty(db, dutyId)).toEqual([]);
        expect(await repeatsOfDuty(db, dutyId)).toEqual([]);
      });
    },
  );
});

describe("sendBackDuty", () => {
  it("makes a judged duty Terjadwal again with the reason, who and when, and logs the result it sent back", async () => {
    await inTestDatabase(async (db) => {
      const { dutyId, manager } = await setUp(db, "NV111", "not_met");

      const sent = await sendBackDuty(db, manager, dutyId, " Foto kurang. ");

      expect(sent).toEqual({
        ok: true,
        value: "Penilaian dikembalikan ke BAM.",
      });
      const kept = await dutyById(db, dutyId);
      expect(kept).toMatchObject({
        status: "scheduled",
        result: null,
        judgeNote: "",
        judgedBy: null,
        sentBackReason: "Foto kurang.",
        sentBackBy: manager.id,
      });
      expect(kept.sentBackAt).toBeInstanceOf(Date);
      expect(await changesOfDuty(db, dutyId)).toEqual([
        expect.objectContaining({
          changedBy: manager.id,
          step: "sent_back",
          result: "not_met",
          note: "Foto kurang.",
        }),
      ]);
    });
  });

  it("asks for a reason of 5 letters or more, and saves nothing without one", async () => {
    await inTestDatabase(async (db) => {
      const { dutyId, manager } = await setUp(db, "NV112", "met");

      expect(await sendBackDuty(db, manager, dutyId, "Ulan")).toEqual({
        ok: false,
        error: "Tulis alasan penolakan minimal 5 huruf.",
      });
      expect((await dutyById(db, dutyId)).status).toBe("judged");
      expect(await changesOfDuty(db, dutyId)).toEqual([]);
    });
  });

  it("refuses a duty validated first, and one not judged", async () => {
    await inTestDatabase(async (db) => {
      const validated = await setUp(db, "NV113", "met");
      await validateDuty(db, validated.manager, validated.dutyId, TODAY);
      const scheduled = await setUp(db, "NV114", null);

      expect(
        await sendBackDuty(db, validated.manager, validated.dutyId, "Ulangi"),
      ).toEqual(DECIDED_FIRST);
      expect(
        await sendBackDuty(db, scheduled.manager, scheduled.dutyId, "Ulangi"),
      ).toEqual(NOT_JUDGED);
    });
  });

  it.each(["bam_bphk", "bam_compliance", "head_of_unit"] as const)(
    "refuses a hand-made sending back of %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { dutyId } = await setUp(db, "NV115", "met");
        const actor = await addTestActor(db, "Bukan Validator Uji", [role]);

        expect(await sendBackDuty(db, actor, dutyId, "Ulangi")).toEqual(
          NOT_ALLOWED,
        );
        expect((await dutyById(db, dutyId)).status).toBe("judged");
      });
    },
  );
});
