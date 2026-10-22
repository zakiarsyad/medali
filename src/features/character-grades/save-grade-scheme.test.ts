import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { readGradeScheme } from "@/character-grades/grade-scheme";
import {
  STARTING_SCHEME,
  STARTING_VERSION,
} from "@/character-grades/scheme-ids";
import { FORTY_TWENTY } from "@/character-grades/test-weights";
import { characterGradeSchemes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  CHANGED_SINCE,
  NOT_ALLOWED_TO_SET,
  saveGradeScheme,
} from "./save-grade-scheme";
import {
  LIMITS_NOT_DOWN,
  NOT_WHOLE,
  type SentScheme,
  TOTAL_NOT_100,
} from "./scheme-input";
import { addTestActor, sentWithWeights } from "./test-scheme";

const inTestDatabase = withTestDatabase();

const SAVED = { ok: true, value: null };

describe("saveGradeScheme", () => {
  it("sets 40, 20, 20, 20 with who and when, and logs the scheme before and after", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Skema", [
        "head_of_unit",
      ]);

      expect(
        await saveGradeScheme(
          db,
          kepala,
          sentWithWeights(FORTY_TWENTY),
          STARTING_VERSION,
        ),
      ).toEqual(SAVED);

      const inForce = await readGradeScheme(db);
      expect(inForce.scheme).toEqual({
        ...STARTING_SCHEME,
        weights: FORTY_TWENTY,
      });
      expect(inForce.set).toEqual({
        at: expect.any(Date),
        by: "Kepala Uji Skema",
      });
      const [line] = await db.select().from(characterGradeSchemes);
      expect(line).toMatchObject({
        attendanceWeight: 40,
        mentoringWeight: 20,
        sikuWeight: 20,
        skpmWeight: 20,
        before: STARTING_SCHEME,
        replaces: null,
        setBy: kepala.id,
      });
    });
  });

  it("logs the scheme set before as the before of the next setting", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Skema", [
        "head_of_unit",
      ]);
      await saveGradeScheme(
        db,
        kepala,
        sentWithWeights(FORTY_TWENTY),
        STARTING_VERSION,
      );
      const first = await readGradeScheme(db);
      const next = sentWithWeights(FORTY_TWENTY, {
        lowerLimits: { A: 90, B: 80, C: 70, D: 60 },
        passLetter: "C",
      });

      expect(await saveGradeScheme(db, kepala, next, first.version)).toEqual(
        SAVED,
      );

      const second = await readGradeScheme(db);
      expect(second.scheme.passLetter).toBe("C");
      const lines = await db
        .select()
        .from(characterGradeSchemes)
        .orderBy(characterGradeSchemes.setAt);
      expect(lines.map((line) => [line.before, line.replaces])).toEqual([
        [STARTING_SCHEME, null],
        [first.scheme, first.version],
      ]);
    });
  });

  it.each<[string, RoleId]>([
    ["Penilai Mahasiswa", "assessor"],
    ["Pengasuh", "mentor"],
    ["Direktur", "director"],
    ["Ketua Program Studi", "head_of_program"],
    ["a student", "student"],
  ])("refuses %s, who may not set it, saving nothing", async (_, role) => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Tanpa Hak Bobot", [role]);

      expect(
        await saveGradeScheme(
          db,
          actor,
          sentWithWeights(FORTY_TWENTY),
          STARTING_VERSION,
        ),
      ).toEqual(NOT_ALLOWED_TO_SET);
      expect(await db.select().from(characterGradeSchemes)).toEqual([]);
    });
  });

  it.each<[string, SentScheme, string]>([
    [
      "weights that total 90",
      sentWithWeights({ ...FORTY_TWENTY, attendance: 30 }),
      TOTAL_NOT_100,
    ],
    [
      "B as high as A",
      sentWithWeights(FORTY_TWENTY, {
        lowerLimits: { A: 85, B: 85, C: 60, D: 50 },
      }),
      LIMITS_NOT_DOWN,
    ],
    [
      "a weight that is no whole number",
      {
        ...sentWithWeights(FORTY_TWENTY),
        weights: {
          attendance: "40.5",
          mentoring: "19.5",
          siku: "20",
          skpm: "20",
        },
      },
      NOT_WHOLE,
    ],
  ])("refuses %s sent by hand, saving nothing", async (_, sent, error) => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Skema", [
        "head_of_unit",
      ]);

      expect(await saveGradeScheme(db, kepala, sent, STARTING_VERSION)).toEqual(
        { ok: false, error },
      );
      expect(await db.select().from(characterGradeSchemes)).toEqual([]);
    });
  });

  it("refuses a form opened before someone else saved, naming who did", async () => {
    await inTestDatabase(async (db) => {
      const ani = await addTestActor(db, "Kepala Uji Ani", ["head_of_unit"]);
      const budi = await addTestActor(db, "Kepala Uji Budi", ["head_of_unit"]);
      await saveGradeScheme(
        db,
        ani,
        sentWithWeights(FORTY_TWENTY),
        STARTING_VERSION,
      );

      expect(
        await saveGradeScheme(
          db,
          budi,
          sentWithWeights({ ...FORTY_TWENTY, attendance: 10, skpm: 50 }),
          STARTING_VERSION,
        ),
      ).toEqual({
        ok: false,
        error: "Skema sudah diubah oleh Kepala Uji Ani. Muat ulang.",
      });
      expect(await db.select().from(characterGradeSchemes)).toHaveLength(1);
    });
  });

  it("refuses a form opened on a version that is no setting", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Skema", [
        "head_of_unit",
      ]);

      expect(
        await saveGradeScheme(
          db,
          kepala,
          sentWithWeights(FORTY_TWENTY),
          crypto.randomUUID(),
        ),
      ).toEqual(CHANGED_SINCE);
      expect(await db.select().from(characterGradeSchemes)).toEqual([]);
    });
  });

  it("saves once when the same form is sent twice, and says it is saved both times", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Skema", [
        "head_of_unit",
      ]);
      const sent = sentWithWeights(FORTY_TWENTY);

      expect(await saveGradeScheme(db, kepala, sent, STARTING_VERSION)).toEqual(
        SAVED,
      );
      expect(await saveGradeScheme(db, kepala, sent, STARTING_VERSION)).toEqual(
        SAVED,
      );
      expect(await db.select().from(characterGradeSchemes)).toHaveLength(1);
    });
  });

  it("refuses the same form sent again with another scheme, as a change it has not seen", async () => {
    await inTestDatabase(async (db) => {
      const kepala = await addTestActor(db, "Kepala Uji Skema", [
        "head_of_unit",
      ]);
      await saveGradeScheme(
        db,
        kepala,
        sentWithWeights(FORTY_TWENTY),
        STARTING_VERSION,
      );

      expect(
        await saveGradeScheme(
          db,
          kepala,
          sentWithWeights({ ...FORTY_TWENTY, attendance: 10, skpm: 50 }),
          STARTING_VERSION,
        ),
      ).toEqual({
        ok: false,
        error: "Skema sudah diubah oleh Kepala Uji Skema. Muat ulang.",
      });
      expect(await db.select().from(characterGradeSchemes)).toHaveLength(1);
    });
  });
});
