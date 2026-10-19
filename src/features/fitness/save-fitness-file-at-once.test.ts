// Sample NIMs of this file: 9986200800 to 9986200899.
import { inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { fitnessScores } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { saveFitnessFile } from "./save-fitness-file";
import { addTestActor, addTestStudents } from "./test-fitness";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("jasmaniberkas");

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

describe("Simpan (n) baris of a fitness file pressed twice at the same moment", () => {
  it("keeps the rows once: the second waits, then answers the same", async () => {
    const { studentIds } = await addTestStudents(
      own.db,
      "Prodi Uji Berkas Jasmani Sekaligus",
      ["9986200801", "9986200802"],
    );
    const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
      "assessor",
    ]);
    const id = crypto.randomUUID();
    const file = {
      name: "kebugaran.csv",
      bytes: new TextEncoder().encode(
        ["nim,skor", "9986200801,80", "9986200802,64"].join("\n"),
      ),
    };

    const both = await own.atOnce(
      (db) => saveFitnessFile(db, penilai, id, "2026-10-16", file, MOMENT),
      (db) => saveFitnessFile(db, penilai, id, "2026-10-16", file, MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: 2 });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(fitnessScores)
      .where(inArray(fitnessScores.studentId, studentIds));
    expect(kept.map((row) => row.studentId).sort()).toEqual(
      [...studentIds].sort(),
    );
  });
});
