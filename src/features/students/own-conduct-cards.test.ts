// Sample Tahun akademik of this file: 5430 to 5430.
// Sample NIMs of this file: 9989770000 to 9989770099.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { withTestDatabase } from "@/db/test-database";
import { readOwnSanction } from "@/discipline-penalties/read-sanctions";
import { readOwnCoaching } from "@/features/guidance/student-coaching";
import { readOwnPenalties } from "@/features/guidance/student-penalties";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  INTENSIVE,
} from "@/features/guidance/test-coaching";
import { addTestPenalty } from "@/features/guidance/test-discipline-penalties";
import {
  addNoteActor,
  addNoteStudents,
} from "@/features/guidance/test-violation-notes";
import { readOwnNotes } from "@/features/mentoring/own-notes";
import { addTestNote } from "@/features/mentoring/test-records";

const inTestDatabase = withTestDatabase();

/** A style file, starting with a break so the first rule is found like every other. */
function stylesOf(path: string): string {
  return `\n${readFileSync(path, "utf8")}`;
}

/** What a rule of a style file holds, without the breaks between its lines. */
function ruleOf(styles: string, selector: string): string {
  const start = styles.indexOf(`\n${selector} {`);
  if (start === -1) return "";
  const body = styles.slice(start, styles.indexOf("}", start));
  return body.replace(/\s+/g, " ");
}

const PENALTIES = stylesOf(
  "src/features/guidance/student-penalties.module.css",
);
const COACHING = stylesOf("src/features/guidance/student-coaching.module.css");
const NOTES = stylesOf("src/mentoring/mentoring-notes.module.css");

const CODE = [
  "src/features/guidance/own-penalties-panel.tsx",
  "src/features/guidance/student-penalties-view.tsx",
  "src/features/guidance/own-coaching-panel.tsx",
  "src/features/guidance/student-coaching-view.tsx",
  "src/features/mentoring/own-notes-panel.tsx",
  "src/features/mentoring/own-notes-view.tsx",
  "src/mentoring/note-item.tsx",
].map((path) => readFileSync(path, "utf8"));

function expectNoForcedWidth(styles: string, selectors: string[]) {
  for (const selector of selectors) {
    const rule = ruleOf(styles, selector);
    expect(rule, selector).not.toBe("");
    expect(rule, selector).not.toMatch(/(^|[ ;{])width:/);
    expect(rule, selector).not.toMatch(/min-width: (?!0;)/);
    expect(rule, selector).not.toContain("nowrap");
  }
}

describe("the conduct cards of Profil saya on a phone", () => {
  it("shows each penalty and each note as a card of its own, whose head wraps and whose text folds", () => {
    for (const styles of [PENALTIES, NOTES]) {
      expect(ruleOf(styles, ".item")).toContain("border-top:");
      expect(ruleOf(styles, ".itemTitle")).toContain("flex-wrap: wrap;");
      expect(ruleOf(styles, ".text")).toContain("overflow-wrap: anywhere;");
    }
    expect(ruleOf(PENALTIES, ".panelHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(COACHING, ".panelHead")).toContain("flex-wrap: wrap;");
    expect(ruleOf(COACHING, ".text")).toContain("overflow-wrap: anywhere;");
  });

  it("forces no width wider than a phone", () => {
    expectNoForcedWidth(PENALTIES, [
      ".panelHead",
      ".list",
      ".item",
      ".itemTitle",
      ".text",
    ]);
    expectNoForcedWidth(COACHING, [".panelHead", ".text"]);
    expectNoForcedWidth(NOTES, [".notes", ".item", ".itemTitle", ".text"]);
    for (const code of CODE) {
      expect(code).not.toContain("style=");
    }
  });
});

describe("the conduct cards of Profil saya", () => {
  it("read a student with many penalties and notes well within a second", async () => {
    await inTestDatabase(async (db) => {
      const periodId = await addCoachingPeriod(db, 5430);
      const { studentIds } = await addNoteStudents(
        db,
        "Prodi Uji Kartu Sendiri",
        "Mahasiswa Uji Kartu Sendiri",
        ["9989770001"],
      );
      const ani = studentIds[0] ?? "";
      const staff = await addNoteActor(db, "Kepala Uji Kartu Sendiri", [
        "head_of_unit",
      ]);
      await addCoachingAssessment(
        db,
        ani,
        staff.id,
        periodId,
        INTENSIVE,
        new Date("5430-09-01T03:00:00Z"),
      );
      for (let day = 1; day <= 20; day += 1) {
        const date = `2026-09-${String(day).padStart(2, "0")}`;
        await addTestPenalty(db, ani, staff.id, date);
      }
      for (let place = 0; place < 60; place += 1) {
        await addTestNote(db, ani, staff.id, {
          writtenAt: new Date(Date.UTC(2026, 8, 1, place)),
        });
      }
      const own: AccountForAccess = {
        id: crypto.randomUUID(),
        roles: ["student"],
        studyProgramId: null,
        studentId: ani,
      };
      const started = performance.now();

      const [penalties, sanction, coaching, notes] = await Promise.all([
        readOwnPenalties(db, own),
        readOwnSanction(db, own),
        readOwnCoaching(db, own),
        readOwnNotes(db, own),
      ]);

      expect(performance.now() - started).toBeLessThan(1000);
      expect(penalties).toHaveLength(20);
      expect(sanction).toBeNull();
      expect(coaching).toMatchObject({ level: "intensive" });
      expect(notes).toHaveLength(60);
    });
  });
});
