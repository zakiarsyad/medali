// Sample NIMs of this file: 9944240000 to 9944240099.
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import type { SentPenalty } from "./penalty-input";
import { saveDisciplinePenalty } from "./save-discipline-penalty";
import { penaltyLinesOf } from "./test-discipline-penalties";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
} from "./test-violation-notes";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So this check has a database of its own, dropped at the
 * end.
 */
const own = withOwnTestDatabase("hukumandisiplin");

// 10:00 on campus on 20 October 2026.
const MOMENT = new Date("2026-10-20T03:00:00Z");

describe("Simpan pelanggaran pressed twice at the same moment", () => {
  it("keeps the penalty once: the second waits, then answers the same, and the log has one line", async () => {
    await addNotePeriods(own.db, 2026);
    const { studentIds } = await addNoteStudents(
      own.db,
      "Prodi Uji Hukuman Sekaligus",
      "Mahasiswa Uji Hukuman Sekaligus",
      ["9944240001"],
    );
    const officer = await addNoteActor(
      own.db,
      "Pembina Uji Hukuman Sekaligus",
      ["discipline_officer"],
    );
    const id = crypto.randomUUID();
    const penalty: SentPenalty = {
      studentId: studentIds[0] ?? "",
      day: "2026-10-20",
      description: "Terlambat mengikuti apel pagi tiga kali.",
      category: "light",
      level: "1",
      decisionNumber: "",
      socialWorkForms: ["grounds"],
      socialWorkOther: "",
      socialWorkPlace: "campus",
      socialWorkStart: "2026-10-20",
      confirmed: false,
    };

    const both = await own.atOnce(
      (db) => saveDisciplinePenalty(db, officer, id, penalty, MOMENT),
      (db) => saveDisciplinePenalty(db, officer, id, penalty, MOMENT),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: { name: "Mahasiswa Uji Hukuman Sekaligus 1", status: "imposed" },
    });
    expect(both.later).toEqual(both.sooner);
    expect(await penaltyLinesOf(own.db, id)).toHaveLength(1);
  });
});
