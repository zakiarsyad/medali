// Sample NIMs of this file: 9986115100 to 9986115199.

import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { handleDisciplineProposal } from "./handle-proposal";
import { addViolationActor, addViolationSetting } from "./test-violations";
import {
  addTestLetter,
  issuedBy,
  letterLinesOf,
  lettersOf,
  periodIdOf,
} from "./test-warnings";
import { ALREADY_HANDLED, PROPOSAL_HANDLED } from "./warning-messages";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("pengajuanhukuman");

// 10:00 on campus on 20 October 2026.
const NOW = new Date("2026-10-20T03:00:00Z");

describe("Proses of a discipline proposal pressed twice at the same moment", () => {
  it("changes the status once with the first note and one line in the log: the second waits, then is told it is processed", async () => {
    const setting = await addViolationSetting(
      own.db,
      2026,
      "Prodi Uji Pengajuan Sekaligus",
      ["9986115101", "9986115102", "9986115103", "9986115104", "9986115105"],
    );
    const ani = setting.residents[0] ?? "";
    const manager = await addViolationActor(own.db, "Pengelola Uji Pengajuan", [
      "dorm_manager",
    ]);
    const head = await addViolationActor(own.db, "Kepala Uji Pengajuan", [
      "head_of_unit",
    ]);
    const letterId = await addTestLetter(own.db, {
      studentId: ani,
      periodId: await periodIdOf(own.db, 2026),
      level: 2,
      ...issuedBy(manager.id),
    });

    const both = await own.atOnce(
      (db) =>
        handleDisciplineProposal(
          db,
          head,
          { letterId, note: "Catatan pertama Kepala Unit." },
          NOW,
        ),
      (db) =>
        handleDisciplineProposal(
          db,
          head,
          { letterId, note: "Catatan kedua Kepala Unit." },
          NOW,
        ),
    );

    expect(both.sooner).toEqual({ ok: true, value: PROPOSAL_HANDLED });
    expect(both.later).toEqual(ALREADY_HANDLED);
    const [letter] = await lettersOf(own.db, ani);
    expect(letter?.handlingNote).toBe("Catatan pertama Kepala Unit.");
    const lines = await letterLinesOf(own.db, letterId);
    expect(lines.map((line) => line.action)).toEqual(["handled"]);
  });
});
