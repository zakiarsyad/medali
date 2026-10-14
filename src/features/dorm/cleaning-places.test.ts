import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { dormCleaningPlaces } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readCleaningPlaces } from "./cleaning-place-list";
import {
  addCleaningPlace,
  removeCleaningPlace,
  renameCleaningPlace,
  restoreCleaningPlace,
} from "./cleaning-places";
import { addTestActor, type TestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * The place names here are used by no other file of checks: two checks
 * that add the same one wait for each other.
 */
const DORM = "wismantara_putri";
const NAME = "Taman Uji Tempat";
const TODAY = "2026-10-12";
const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola pembersihan asrama.",
};
const TAKEN = {
  ok: false,
  error: "Tempat dengan nama ini sudah ada di asrama ini.",
};
const NOT_FOUND = {
  ok: false,
  error: "Tempat tidak ditemukan. Muat ulang halaman.",
};
const NO_PLACE = "00000000-0000-4000-8000-000000000000";
const READ_ONLY: RoleId[] = [
  "head_of_unit",
  "director",
  "head_of_program",
  "student",
  "bam_compliance",
  "mentor",
];

function manager(db: Database): Promise<TestActor> {
  return addTestActor(db, "Pengelola Uji Tempat", ["dorm_manager"]);
}

async function added(db: Database, name = NAME, dorm = DORM): Promise<string> {
  const actor = { roles: ["bam_household"] as RoleId[] };
  const saved = await addCleaningPlace(db, actor, { name, dorm });
  if (!saved.ok) throw new Error(saved.error);
  const [place] = await db
    .select({ id: dormCleaningPlaces.id })
    .from(dormCleaningPlaces)
    .where(eq(dormCleaningPlaces.name, saved.value));
  if (!place) throw new Error("The place was not found.");
  return place.id;
}

async function namesIn(db: Database): Promise<string[]> {
  const places = await readCleaningPlaces(db, [DORM]);
  return places.map((place) => place.name);
}

describe("addCleaningPlace", () => {
  it("adds a place to the dorm picked, its name without the spaces around it", async () => {
    await inTestDatabase(async (db) => {
      const saved = await addCleaningPlace(
        db,
        { roles: ["dorm_manager"] },
        { name: `  ${NAME} `, dorm: DORM },
      );

      expect(saved).toEqual({ ok: true, value: NAME });
      expect(await namesIn(db)).toEqual([NAME]);
    });
  });

  it("refuses a name used in the dorm, whatever its capitals", async () => {
    await inTestDatabase(async (db) => {
      await added(db);

      const again = await addCleaningPlace(
        db,
        { roles: ["bam_bphk"] },
        { name: NAME.toUpperCase(), dorm: DORM },
      );

      expect(again).toEqual(TAKEN);
      expect(await namesIn(db)).toEqual([NAME]);
    });
  });

  it("takes the name of a place in another dorm", async () => {
    await inTestDatabase(async (db) => {
      await added(db, NAME, "dana_rakca");

      expect(
        (
          await addCleaningPlace(
            db,
            { roles: ["dorm_manager"] },
            { name: NAME, dorm: DORM },
          )
        ).ok,
      ).toBe(true);
    });
  });

  it("refuses a name under 3 letters and a dorm that is not one", async () => {
    await inTestDatabase(async (db) => {
      const actor = { roles: ["dorm_manager"] as RoleId[] };

      expect(
        await addCleaningPlace(db, actor, { name: "Ab", dorm: DORM }),
      ).toEqual({
        ok: false,
        error: "Nama tempat minimal 3 huruf.",
      });
      expect(
        await addCleaningPlace(db, actor, { name: NAME, dorm: "lain" }),
      ).toEqual({
        ok: false,
        error: "Pilih asrama.",
      });
      expect(await namesIn(db)).toEqual([]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and adds nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const saved = await addCleaningPlace(
        db,
        { roles: [role] },
        { name: NAME, dorm: DORM },
      );

      expect(saved).toEqual(NOT_ALLOWED);
      expect(await namesIn(db)).toEqual([]);
    });
  });
});

describe("renameCleaningPlace", () => {
  it("gives a place a new name", async () => {
    await inTestDatabase(async (db) => {
      const placeId = await added(db);

      const renamed = await renameCleaningPlace(
        db,
        { roles: ["dorm_manager"] },
        { placeId, name: "Taman Uji Baru" },
      );

      expect(renamed).toEqual({ ok: true, value: "Taman Uji Baru" });
      expect(await namesIn(db)).toEqual(["Taman Uji Baru"]);
    });
  });

  it("refuses the name of another place of the dorm, and keeps the old one", async () => {
    await inTestDatabase(async (db) => {
      await added(db);
      const placeId = await added(db, "Taman Uji Lain");

      const renamed = await renameCleaningPlace(
        db,
        { roles: ["dorm_manager"] },
        { placeId, name: ` ${NAME.toLowerCase()} ` },
      );

      expect(renamed).toEqual(TAKEN);
      expect(await namesIn(db)).toEqual(["Taman Uji Lain", NAME]);
    });
  });

  it("refuses a place that is removed or not found", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const placeId = await added(db);
      await removeCleaningPlace(db, actor, placeId, TODAY);
      const sent = { placeId, name: "Taman Uji Baru" };

      expect(await renameCleaningPlace(db, actor, sent)).toEqual(NOT_FOUND);
      expect(
        await renameCleaningPlace(db, actor, { ...sent, placeId: NO_PLACE }),
      ).toEqual(NOT_FOUND);
      expect(
        await renameCleaningPlace(db, actor, { ...sent, placeId: "x" }),
      ).toEqual(NOT_FOUND);
    });
  });

  it.each(READ_ONLY)("refuses %s, and keeps the name", async (role) => {
    await inTestDatabase(async (db) => {
      const placeId = await added(db);

      const renamed = await renameCleaningPlace(
        db,
        { roles: [role] },
        { placeId, name: "Taman Uji Baru" },
      );

      expect(renamed).toEqual(NOT_ALLOWED);
      expect(await namesIn(db)).toEqual([NAME]);
    });
  });
});

describe("removeCleaningPlace and restoreCleaningPlace", () => {
  it("takes a place off the list with a mark of who, when and from which day, and Urungkan brings it back", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const placeId = await added(db);

      expect(await removeCleaningPlace(db, actor, placeId, TODAY)).toEqual({
        ok: true,
        value: NAME,
      });
      expect(await namesIn(db)).toEqual([]);
      const [kept] = await db
        .select()
        .from(dormCleaningPlaces)
        .where(eq(dormCleaningPlaces.id, placeId));
      expect(kept).toMatchObject({ removedFrom: TODAY, deletedBy: actor.id });

      expect(await restoreCleaningPlace(db, actor, placeId)).toEqual({
        ok: true,
        value: NAME,
      });
      expect(await namesIn(db)).toEqual([NAME]);
    });
  });

  it("lets the name be used again once the place is removed, and then refuses Urungkan", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const placeId = await added(db);
      await removeCleaningPlace(db, actor, placeId, TODAY);

      await added(db, NAME.toUpperCase());

      expect(await restoreCleaningPlace(db, actor, placeId)).toEqual(TAKEN);
      expect(await namesIn(db)).toEqual([NAME.toUpperCase()]);
    });
  });

  it("refuses to remove a place twice, and to bring back one removed by someone else", async () => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const other = await addTestActor(db, "BAM Uji Tempat", ["bam_bphk"]);
      const placeId = await added(db);
      await removeCleaningPlace(db, actor, placeId, TODAY);

      expect(await removeCleaningPlace(db, actor, placeId, TODAY)).toEqual(
        NOT_FOUND,
      );
      expect(await restoreCleaningPlace(db, other, placeId)).toEqual(NOT_FOUND);
      expect(await restoreCleaningPlace(db, actor, NO_PLACE)).toEqual(
        NOT_FOUND,
      );
    });
  });

  it.each(READ_ONLY)("refuses %s both, and changes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const actor = await manager(db);
      const placeId = await added(db);
      const reader = await addTestActor(db, "Pembaca Uji Tempat", [role]);

      expect(await removeCleaningPlace(db, reader, placeId, TODAY)).toEqual(
        NOT_ALLOWED,
      );
      expect(await namesIn(db)).toEqual([NAME]);

      await removeCleaningPlace(db, actor, placeId, TODAY);
      expect(await restoreCleaningPlace(db, reader, placeId)).toEqual(
        NOT_ALLOWED,
      );
      expect(await namesIn(db)).toEqual([]);
    });
  });
});
