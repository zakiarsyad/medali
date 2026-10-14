import { afterEach, describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { dormCleaningPlaces } from "@/db/schema";
import { type Save, withOwnTestDatabase } from "@/db/test-database-at-once";
import type { Parsed } from "@/parsed";
import { readCleaningPlaces } from "./cleaning-place-list";
import { addCleaningPlace } from "./cleaning-places";

const own = withOwnTestDatabase("cleaning");
const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
const BAM = { roles: ["bam_household"] as RoleId[] };
const DORM = "dana_rakca";

afterEach(async () => {
  await own.db.delete(dormCleaningPlaces);
});

type CleaningSave = Save<Parsed<string>>;

function addPlace(actor: { roles: RoleId[] }, name: string): CleaningSave {
  return (db) => addCleaningPlace(db, actor, { name, dorm: DORM });
}

describe("two staff adding a place of the same name at the same moment", () => {
  it("saves one, and tells the other the name is used", async () => {
    const both = await own.atOnce(
      addPlace(MANAGER, "Musala"),
      addPlace(BAM, "musala "),
    );

    expect(both.sooner).toEqual({ ok: true, value: "Musala" });
    expect(both.later).toEqual({
      ok: false,
      error: "Tempat dengan nama ini sudah ada di asrama ini.",
    });
    const places = await readCleaningPlaces(own.db, [DORM]);
    expect(places.map((place) => place.name)).toEqual(["Musala"]);
  });
});
