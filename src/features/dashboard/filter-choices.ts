import { STAGES } from "@/academic-periods/stages";
import type { StudyProgram } from "@/db/study-programs";
import type { CountedChoice } from "@/ui/counted-select";
import { type EntryPath, NO, NO_AGENCY, YES } from "./dashboard-address";
import type { ChoiceCounts } from "./dashboard-choices";

/** The words of each list of choices of the filter, and its choices. */

export const ENTRY_PATH_WORDS: Record<EntryPath, string> = {
  regular: "Reguler",
  transfer: "Alih program",
};

export function stageChoices(counts: ChoiceCounts): CountedChoice[] {
  return STAGES.map((name, place) => {
    const stageNo = place + 1;
    return {
      value: String(stageNo),
      shown: `Tahap ${stageNo} · ${name}`,
      held: counts.stages.get(stageNo) ?? 0,
    };
  });
}

export function programChoices(
  programs: StudyProgram[],
  counts: ChoiceCounts,
): CountedChoice[] {
  return programs.map((program) => ({
    value: String(program.id),
    shown: program.name,
    held: counts.programs.get(program.id) ?? 0,
  }));
}

export function entryPathChoices(counts: ChoiceCounts): CountedChoice[] {
  const paths: EntryPath[] = ["regular", "transfer"];
  return paths.map((path) => ({
    value: path,
    shown: ENTRY_PATH_WORDS[path],
    held: counts.entryPaths.get(path) ?? 0,
  }));
}

export function nameChoices(
  names: readonly string[],
  held: ReadonlyMap<string | null, number>,
): CountedChoice[] {
  return names.map((name) => ({
    value: name,
    shown: name,
    held: held.get(name) ?? 0,
  }));
}

export function agencyChoices(
  agencies: readonly string[],
  counts: ChoiceCounts,
): CountedChoice[] {
  const none = {
    value: NO_AGENCY,
    shown: "Tanpa instansi (reguler)",
    held: counts.agencies.get(NO_AGENCY) ?? 0,
  };
  return [none, ...nameChoices(agencies, counts.agencies)];
}

/** A yes or no list: its words for yes and for no. */
export function yesNoChoices(
  words: { yes: string; no: string },
  held: ReadonlyMap<boolean, number>,
): CountedChoice[] {
  return [
    { value: YES, shown: words.yes, held: held.get(true) ?? 0 },
    { value: NO, shown: words.no, held: held.get(false) ?? 0 },
  ];
}

/** The value a yes or no choice has in its list, or empty for every student. */
export function yesNoChosen(choice: boolean | null): string {
  if (choice === null) return "";
  return choice ? YES : NO;
}
