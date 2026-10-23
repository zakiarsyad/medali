import { type GroupCodeParts, groupCode } from "@/ui/group-code";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import {
  type AnswerSums,
  respondentShare,
  type SurveyGroupResult,
  surveyGroupResult,
} from "./survey-result";
import type { SurveyResultChoices } from "./survey-results-address";

/*
 * The rows and numbers of "Hasil evaluasi per kelompok", from what the
 * database added up. Nothing here reads one student's answer.
 */

/** A group of the results, with the mentor who held it on the day of the numbers. */
export interface SurveyGroup extends GroupCodeParts {
  id: string;
  studyProgram: string;
  /** How many Aktif members the group holds. */
  members: number;
  mentorId: string | null;
  mentorName: string | null;
}

/** The answers of a group for one mentor, as the database added them up. */
export interface MentorSums extends AnswerSums {
  groupId: string;
  mentorId: string;
  mentorName: string;
}

/** One row of the table: a group, and the mentor its answers count for. */
export interface SurveyGroupRow {
  /** The group and the mentor, which tell one row from every other. */
  key: string;
  group: Omit<SurveyGroup, "mentorId" | "mentorName">;
  mentorId: string | null;
  mentorName: string | null;
  result: SurveyGroupResult;
}

/** What tells one row from every other: its group and its mentor. */
export function rowKey(groupId: string, mentorId: string | null): string {
  return `${groupId} ${mentorId ?? ""}`;
}

function sumsByGroup(sums: readonly MentorSums[]): Map<string, MentorSums[]> {
  const byGroup = new Map<string, MentorSums[]>();
  for (const one of sums) {
    const found = byGroup.get(one.groupId) ?? [];
    found.push(one);
    byGroup.set(one.groupId, found);
  }
  return byGroup;
}

/**
 * The rows of the groups: one for each mentor the answers of a group
 * count for, or one with the mentor of the day for a group without
 * answers. `reratas` holds the Capaian karakter of each group that has one.
 */
export function surveyGroupRows(
  groups: readonly SurveyGroup[],
  sums: readonly MentorSums[],
  reratas: ReadonlyMap<string, number>,
  achievementWeight: number,
): SurveyGroupRow[] {
  const byGroup = sumsByGroup(sums);
  const rows: SurveyGroupRow[] = [];
  for (const { mentorId, mentorName, ...group } of groups) {
    const achievement = reratas.get(group.id) ?? null;
    const facts = { members: group.members, achievement };
    const answered = byGroup.get(group.id) ?? [];
    const mentors =
      answered.length > 0
        ? answered
        : [{ mentorId, mentorName, answers: 0, total: 0 }];
    for (const mentor of mentors) {
      rows.push({
        key: rowKey(group.id, mentor.mentorId),
        group,
        mentorId: mentor.mentorId,
        mentorName: mentor.mentorName,
        result: surveyGroupResult({ ...facts, ...mentor }, achievementWeight),
      });
    }
  }
  return rows;
}

function matchesSearch(row: SurveyGroupRow, query: string): boolean {
  if (query === "") return true;
  const wanted = query.toLocaleLowerCase("id-ID");
  const code = groupCode(row.group).toLocaleLowerCase("id-ID");
  const mentor = (row.mentorName ?? "").toLocaleLowerCase("id-ID");
  return code.includes(wanted) || mentor.includes(wanted);
}

function matchesFilter(
  row: SurveyGroupRow,
  filter: SurveyResultChoices["filter"],
): boolean {
  if (filter === "poor") return row.result.result === "poor";
  if (filter === "no_answers") return row.result.answers === 0;
  return true;
}

/** The lowest Nilai evaluasi first, then the rows without one, by group code. */
function lowestFirst(one: SurveyGroupRow, other: SurveyGroupRow): number {
  const first = one.result.score;
  const second = other.result.score;
  if (first !== null && second !== null && first !== second) {
    return first - second;
  }
  if (first === null && second !== null) return 1;
  if (first !== null && second === null) return -1;
  return groupCode(one.group).localeCompare(groupCode(other.group));
}

export interface ResultPage {
  rows: SurveyGroupRow[];
  /** How many rows match in all, on every page. */
  matching: number;
  /** The page given: the one asked for, or the last when it is past it. */
  page: number;
}

/** The page of the rows that match the search and the filter, lowest first. */
export function resultPage(
  rows: readonly SurveyGroupRow[],
  choices: SurveyResultChoices,
): ResultPage {
  const found = rows
    .filter((row) => matchesSearch(row, choices.query))
    .filter((row) => matchesFilter(row, choices.filter))
    .sort(lowestFirst);
  const page = pageWithin(choices.page, found.length);
  const start = (page - 1) * PAGE_SIZE;
  return {
    rows: found.slice(start, start + PAGE_SIZE),
    matching: found.length,
    page,
  };
}

/** The numbers above the table, over every group the account may see. */
export interface ResultNumbers {
  /** "Responden": the answers of every group, out of their members. */
  answers: number;
  members: number;
  share: number | null;
  /** "Rerata capaian karakter", over the groups that have one. */
  achievement: number | null;
  /** "Rerata umpan balik", over the groups that show one. */
  feedbackOutOfFive: number | null;
  feedback: number | null;
  /** "Nilai evaluasi kurang": the rows whose Predikat is Kurang. */
  poor: number;
  /** How many groups the numbers are of. */
  groups: number;
}

/** The mean of numbers of one decimal, to one decimal. Null for none. */
function meanOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let tenths = 0;
  for (const value of values) tenths += Math.round(value * 10);
  return Math.round(tenths / values.length) / 10;
}

function shown(values: readonly (number | null)[]): number[] {
  return values.filter((value) => value !== null);
}

/**
 * The numbers above the table. A group with a row for each of two
 * mentors counts its members and its Capaian karakter once.
 */
export function resultNumbers(rows: readonly SurveyGroupRow[]): ResultNumbers {
  const firstOfGroup = new Map<string, SurveyGroupRow>();
  let answers = 0;
  for (const row of rows) {
    answers += row.result.answers;
    if (!firstOfGroup.has(row.group.id)) firstOfGroup.set(row.group.id, row);
  }
  const groups = [...firstOfGroup.values()];
  let members = 0;
  for (const row of groups) members += row.result.members;
  return {
    answers,
    members,
    share: respondentShare(answers, members),
    achievement: meanOf(shown(groups.map((row) => row.result.achievement))),
    feedbackOutOfFive: meanOf(
      shown(rows.map((row) => row.result.feedbackOutOfFive)),
    ),
    feedback: meanOf(shown(rows.map((row) => row.result.feedback))),
    poor: rows.filter((row) => row.result.result === "poor").length,
    groups: groups.length,
  };
}
