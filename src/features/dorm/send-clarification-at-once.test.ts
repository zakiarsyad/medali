// Sample Tahun akademik of this file: 3020 to 3020.
// Sample NIMs of this file: 9937980300 to 9937980399.
import { describe, expect, it } from "vitest";
import { testPaper } from "@/clarifications/test-paper";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { memoryStore } from "@/files/memory-store";
import { sendDormClarification } from "./send-clarification";
import { addTestActivity } from "./test-activities";
import { addTestCount, clarificationsOf } from "./test-clarifications";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";

/*
 * Two sends at the same moment need two connections that both see the
 * saved rows, so these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("kirimklarasrama");

describe("Kirim klarifikasi of a dorm absence pressed twice at the same moment", () => {
  it("keeps one clarification and one file: the second press waits for the first, then finds it sent", async () => {
    const [ani] = await addTestResidents(own.db, 3020, "Prodi Uji Dua Kali", [
      "9937980301",
    ]);
    if (!ani) throw new Error("The resident was not added.");
    const bam = await addTestActor(own.db, "BAM Uji Dua Kali", ["bam_bphk"]);
    const activityId = await addTestActivity(own.db, bam.id);
    const day = "3020-10-13";
    await addTestCount(own.db, {
      activityId,
      day,
      byId: bam.id,
      marks: { [ani.studentId]: { isAbsent: true, note: "" } },
    });
    const store = memoryStore();
    // Ten in the morning on campus, after the Apel pagi of that day.
    const at = new Date("3020-10-13T03:00:00Z");
    const sent = {
      activityId,
      day,
      reason: "sick",
      explanation: "Demam sejak malam dan beristirahat di kamar.",
      file: { name: "surat-keterangan.pdf", bytes: testPaper() },
    };

    const both = await own.atOnce(
      (db) => sendDormClarification(db, store, ani, sent, at),
      (db) => sendDormClarification(db, store, ani, sent, at),
    );

    const answer = { ok: true, value: "Klarifikasi terkirim." };
    expect(both.sooner).toEqual(answer);
    expect(both.later).toEqual(answer);
    const kept = await clarificationsOf(own.db, ani.studentId);
    expect(kept).toHaveLength(1);
    expect([...store.files.keys()]).toEqual([kept[0]?.fileKey]);
  });
});
