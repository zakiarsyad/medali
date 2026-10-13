import { groupCode } from "@/ui/group-code";
import type { GroupChoice } from "./mentor-group-choices";

/** The value of the choice "Belum ditetapkan": no group. */
export const NO_GROUP = "";

export const NO_GROUP_WORDS = "Belum ditetapkan";

/** The angkatan, program studi and jalur as the form holds them. */
export interface ChosenCohort {
  cohortYear: string;
  studyProgramId: string;
  entryPath: string;
}

/** The groups of the angkatan, program studi and jalur chosen in the form. */
export function fittingGroups(
  groups: GroupChoice[],
  chosen: ChosenCohort,
): GroupChoice[] {
  return groups.filter(
    (group) =>
      String(group.cohortYear) === chosen.cohortYear &&
      String(group.studyProgramId) === chosen.studyProgramId &&
      group.entryPath === chosen.entryPath,
  );
}

/**
 * The group the choice stands on: the one chosen while it still fits, and
 * no group once the angkatan, program studi or jalur moved away from it.
 */
export function keptGroupId(chosenId: string, fitting: GroupChoice[]): string {
  const stillFits = fitting.some((group) => group.id === chosenId);
  return stillFits ? chosenId : NO_GROUP;
}

/** A group as the choice names it: its code, its mentor and its size. */
export function groupChoiceWords(group: GroupChoice): string {
  const mentor = group.mentorName ?? "-";
  return `${groupCode(group)} · ${mentor} · ${group.members} anggota`;
}

const GROUPS_OFFERED =
  "Pilih kelompok yang sudah ada untuk angkatan, prodi, dan jalur ini, atau biarkan kosong untuk diatur lewat Pengasuh > Penetapan angkatan baru.";

function pathWords(entryPath: string): string {
  return entryPath === "transfer" ? "alih program" : "reguler";
}

/** The line under the choice. `programName` is the program studi chosen. */
export function groupHint(
  fitting: GroupChoice[],
  chosen: ChosenCohort,
  programName: string,
): string {
  if (fitting.length > 0) return GROUPS_OFFERED;
  const cohort = `${chosen.cohortYear} ${programName} ${pathWords(chosen.entryPath)}`;
  return `Belum ada kelompok untuk angkatan ${cohort}. Kelompok dibentuk lewat Pengasuh > Penetapan angkatan baru.`;
}
