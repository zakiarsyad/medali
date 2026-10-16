// Sample NIMs of this file: 9986202000 to 9986202099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { changeConsentAsCounsellor } from "./change-consent";
import {
  lookUpConsent,
  SEARCH_LIMIT,
  searchConsentStudents,
} from "./consent-picks";
import { NO_CONSENT_VERSION } from "./consent-view";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { addTestActor } from "./test-consents";

const inTestDatabase = withTestDatabase();

const MOMENT = new Date("2026-10-16T03:00:00Z");

/** Students named "Siswa Cari Konseling 01" and on, one of each status. */
async function addStudents(db: Database, count: number): Promise<string[]> {
  const programId = await addTestProgram(db, "Prodi Uji Cari Konseling");
  const statuses = ["active", "on_leave", "inactive"] as const;
  const ids: string[] = [];
  for (let place = 1; place <= count; place += 1) {
    const number = String(place).padStart(2, "0");
    ids.push(
      await addTestStudent(db, programId, {
        nim: `99862020${number}`,
        name: `Siswa Cari Konseling ${number}`,
        status: statuses[place % statuses.length],
      }),
    );
  }
  return ids;
}

describe("searchConsentStudents", () => {
  it("finds students of every status by name, 20 at most, by name", async () => {
    await inTestDatabase(async (db) => {
      await addStudents(db, SEARCH_LIMIT + 2);
      const counsellor = await addTestActor(db, "Konselor Cari", [
        "counsellor",
      ]);

      const found = await searchConsentStudents(
        db,
        counsellor,
        "cari konseling",
      );

      expect(found).toHaveLength(SEARCH_LIMIT);
      expect(found[0]).toEqual({
        id: expect.any(String),
        name: "Siswa Cari Konseling 01",
        nim: "9986202001",
        program: "Prodi Uji Cari Konseling",
      });
      const statuses = await db
        .select({ status: students.status })
        .from(students)
        .where(eq(students.nim, "9986202002"));
      expect(statuses).toEqual([{ status: "inactive" }]);
      expect(found.map((pick) => pick.nim)).toContain("9986202002");
    });
  });

  it("finds a student by NIM, but not a removed one", async () => {
    await inTestDatabase(async (db) => {
      const [kept, removed] = await addStudents(db, 2);
      if (!kept || !removed) throw new Error("Students missing.");
      await db
        .update(students)
        .set({ deletedAt: MOMENT })
        .where(eq(students.id, removed));
      const counsellor = await addTestActor(db, "Konselor Cari", [
        "counsellor",
      ]);

      const found = await searchConsentStudents(db, counsellor, "998620200");

      expect(found.map((pick) => pick.id)).toEqual([kept]);
    });
  });

  it.each(["head_of_unit", "student", "mentor"] as const)(
    "finds nobody for %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        await addStudents(db, 2);
        const other = await addTestActor(db, "Bukan Konselor", [role]);

        expect(
          await searchConsentStudents(db, other, "cari konseling"),
        ).toEqual([]);
      });
    },
  );

  it.each(["", "   ", 7, "x".repeat(101)])(
    "finds nobody for %j",
    async (query) => {
      await inTestDatabase(async (db) => {
        await addStudents(db, 2);
        const counsellor = await addTestActor(db, "Konselor Cari", [
          "counsellor",
        ]);

        expect(await searchConsentStudents(db, counsellor, query)).toEqual([]);
      });
    },
  );
});

describe("lookUpConsent", () => {
  it("gives a student never asked no consent, and an asked one their status", async () => {
    await inTestDatabase(async (db) => {
      const [never, asked] = await addStudents(db, 2);
      const counsellor = await addTestActor(db, "Konselor Cari", [
        "counsellor",
      ]);
      await changeConsentAsCounsellor(
        db,
        counsellor,
        asked,
        "ask",
        NO_CONSENT_VERSION,
        MOMENT,
      );

      expect(await lookUpConsent(db, counsellor, never)).toEqual({
        ok: true,
        value: null,
      });
      expect(await lookUpConsent(db, counsellor, asked)).toMatchObject({
        ok: true,
        value: { status: "waiting", counsellorName: "Konselor Cari" },
      });
    });
  });

  it.each(["head_of_unit", "student"] as const)(
    "gives %s nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const [asked] = await addStudents(db, 1);
        const counsellor = await addTestActor(db, "Konselor Cari", [
          "counsellor",
        ]);
        await changeConsentAsCounsellor(
          db,
          counsellor,
          asked,
          "ask",
          NO_CONSENT_VERSION,
          MOMENT,
        );
        const other = await addTestActor(db, "Bukan Konselor", [role]);

        expect(await lookUpConsent(db, other, asked)).toEqual({
          ok: false,
          error: STUDENT_NOT_FOUND,
        });
      });
    },
  );
});
