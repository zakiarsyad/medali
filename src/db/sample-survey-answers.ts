import { daysAfter } from "@/academic-periods/days-after";
import {
  isGroupOf,
  SAMPLE_REPLACED_GROUP,
  type SampleMentorGroup,
} from "./sample-mentor-groups";
import type { SampleStudent } from "./sample-students";
import type { SampleSurveyPeriod } from "./sample-survey-periods";

/*
 * Made-up answers only, of the made-up students. The scores and the
 * suggestions here are invented.
 */

export interface SampleSurveyAnswer {
  survey: SampleSurveyPeriod;
  group: SampleMentorGroup;
  nim: string;
  /** The score of each statement, in the order of the statements. */
  scores: number[];
  suggestion: string | null;
  /** The day it was sent, within the dates of its period. */
  sentOn: string;
}

/** How each answer scores the eight statements, taken in turn. */
const SCORE_SETS: readonly (readonly number[])[] = [
  [4, 4, 5, 4, 4, 5, 4, 4],
  [3, 4, 3, 3, 4, 3, 4, 3],
  [5, 5, 4, 5, 5, 4, 5, 5],
  [4, 3, 4, 4, 3, 4, 4, 4],
];

/**
 * The answers of the group whose result is Kurang, beside its Capaian
 * karakter on the closing day, so the jump to a replacement can be tried.
 */
const LOW_SCORE_SETS: readonly (readonly number[])[] = [
  [2, 3, 2, 2, 3, 2, 3, 2],
  [3, 2, 2, 3, 2, 3, 2, 3],
  [2, 2, 3, 2, 2, 3, 2, 2],
];

/** Made-up suggestions, given with every other answer. */
const SUGGESTIONS = [
  "Pertemuan pengasuhan sebaiknya dijadwalkan lebih awal agar tidak bentrok dengan kuliah.",
  "Terima kasih atas pendampingannya selama semester ini.",
  "Mohon lebih sering menanyakan kabar anggota kelompok di luar pertemuan.",
  "Diskusi kelompok sangat membantu saya beradaptasi di kampus.",
];

/** Every fifth group in turn sends no answer, so "Belum ada responden" shows. */
const SILENT_EVERY = 5;
/** In every third group in turn the last Aktif member does not answer. */
const ONE_SILENT_EVERY = 3;
/** The answers of a group come in over this many days from the first day. */
const SENT_OVER_DAYS = 7;

function pick<Item>(items: readonly Item[], place: number): Item {
  const item = items[place % items.length];
  if (item === undefined) throw new Error("A sample list is empty.");
  return item;
}

function isActive(nim: string, students: Map<string, SampleStudent>): boolean {
  const status = students.get(nim)?.status ?? "active";
  return status === "active";
}

/**
 * The members of a group who answer, by the place of the group in turn.
 * Every Aktif member of the group that answers low answers.
 */
function answeringMembers(
  group: SampleMentorGroup,
  place: number,
  students: Map<string, SampleStudent>,
  answersLow: boolean,
): string[] {
  const active = group.memberNims.filter((nim) => isActive(nim, students));
  if (answersLow) return active;
  if (place % SILENT_EVERY === SILENT_EVERY - 1) return [];
  if (place % ONE_SILENT_EVERY !== ONE_SILENT_EVERY - 1) return active;
  return active.slice(0, -1);
}

function answersOfGroup(
  survey: SampleSurveyPeriod,
  group: SampleMentorGroup,
  place: number,
  students: Map<string, SampleStudent>,
): SampleSurveyAnswer[] {
  const answersLow = isGroupOf(group, SAMPLE_REPLACED_GROUP);
  const sets = answersLow ? LOW_SCORE_SETS : SCORE_SETS;
  const members = answeringMembers(group, place, students, answersLow);
  return members.map((nim, member) => ({
    survey,
    group,
    nim,
    scores: [...pick(sets, place + member)],
    suggestion: member % 2 === 0 ? pick(SUGGESTIONS, place + member) : null,
    sentOn: daysAfter(survey.startsOn, member % SENT_OVER_DAYS),
  }));
}

/**
 * The made-up answers of each sample survey period: of the Aktif members
 * of the groups that had started by its first day. Most such groups
 * answer in full, some lack one member and some send none, so a group of
 * three shows its numbers and a smaller one shows Responden only. The
 * group of the earlier replacement answers low, so its result is Kurang.
 */
export function sampleSurveyAnswers(
  surveys: SampleSurveyPeriod[],
  groups: SampleMentorGroup[],
  students: SampleStudent[],
): SampleSurveyAnswer[] {
  const byNim = new Map(students.map((student) => [student.nim, student]));
  const answers: SampleSurveyAnswer[] = [];
  for (const survey of surveys) {
    const started = groups.filter((group) => group.startsOn <= survey.startsOn);
    for (const [place, group] of started.entries()) {
      answers.push(...answersOfGroup(survey, group, place, byNim));
    }
  }
  return answers;
}
