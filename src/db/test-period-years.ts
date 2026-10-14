// Two test files that add the same Tahun akademik at the same moment wait
// for each other, and the database stops one of them with "deadlock
// detected". So each test file keeps sample years of its own. A year
// written in a test file is often an angkatan or a date, so the years a
// file adds cannot be told from its numbers: its first line names them.

import type { TestFileText } from "./test-nim-blocks";

const FIXED_WORDS = "// Sample Tahun akademik of this file";

const SAMPLE_DATA_WORDS = "those of the app's sample data";

const NAMED_YEARS = new RegExp(
  `^${FIXED_WORDS}: (?:(?<first>\\d{4}) to (?<last>\\d{4})(?<both>, and ${SAMPLE_DATA_WORDS})?|(?<only>${SAMPLE_DATA_WORDS}))\\.$`,
);

/**
 * The years before this one are left to the app's sample data, which
 * follows today's date. The form that adds a period takes no year
 * after 2100, so the test files that add one through it need the years
 * from here to 2100.
 */
const FIRST_OWN_YEAR = 2090;

const LAST_OWN_YEAR = 9999;

export interface YearRange {
  first: number;
  last: number;
}

export interface NamedYears {
  /** The years that only this file adds. */
  own?: YearRange;
  withSampleData: boolean;
}

export interface SharedYears {
  years: YearRange;
  paths: [string, string];
}

/** The first line of a test file, when it sets out to name sample years. */
export function yearsLineIn(text: string): string | undefined {
  const [firstLine = ""] = text.split("\n", 1);
  if (!firstLine.startsWith(FIXED_WORDS)) return undefined;
  return firstLine.trimEnd();
}

function isOwnRange(range: YearRange): boolean {
  return (
    range.first >= FIRST_OWN_YEAR &&
    range.last <= LAST_OWN_YEAR &&
    range.first <= range.last
  );
}

/** Nothing for a file with no such line, or with one that cannot be read. */
export function namedYearsIn(text: string): NamedYears | undefined {
  const groups = yearsLineIn(text)?.match(NAMED_YEARS)?.groups;
  if (!groups) return undefined;
  if (groups.only) return { withSampleData: true };
  const own = { first: Number(groups.first), last: Number(groups.last) };
  if (!isOwnRange(own)) return undefined;
  return { own, withSampleData: groups.both !== undefined };
}

function isNamed(year: number, named: NamedYears): boolean {
  if (year < FIRST_OWN_YEAR) return named.withSampleData;
  if (!named.own) return false;
  return year >= named.own.first && year <= named.own.last;
}

/** The years a test file added that its first line does not name. */
export function unnamedYears(
  added: number[],
  named: NamedYears | undefined,
): number[] {
  if (!named) return added;
  return added.filter((year) => !isNamed(year, named));
}

function sampleDataYearsAdvice(): string[] {
  return [
    `A year before ${FIRST_OWN_YEAR} is left to the app's sample data. A file that loads the sample data says so instead, or besides its own years, like:`,
    `${FIXED_WORDS}: ${SAMPLE_DATA_WORDS}.`,
    `${FIXED_WORDS}: 2700 to 2701, and ${SAMPLE_DATA_WORDS}.`,
    `A file that adds such a year itself moves it to ${FIRST_OWN_YEAR} or later.`,
  ];
}

export function unnamedYearsMessage(path: string, years: number[]): string {
  const message = [
    `${path} added the Tahun akademik ${years.join(", ")}, which its first line does not name.`,
    `Name the first and the last year the file adds in its first line, from ${FIRST_OWN_YEAR} to ${LAST_OWN_YEAR}, with years no other test file has, like:`,
    `${FIXED_WORDS}: 2700 to 2701.`,
  ];
  const addsSampleDataYear = years.some((year) => year < FIRST_OWN_YEAR);
  if (!addsSampleDataYear) return message.join("\n");
  return [...message, ...sampleDataYearsAdvice()].join("\n");
}

/** The paths of the files whose line of sample years cannot be read. */
export function unreadableYearLines(files: TestFileText[]): string[] {
  return files
    .filter((file) => yearsLineIn(file.text) !== undefined)
    .filter((file) => namedYearsIn(file.text) === undefined)
    .map((file) => file.path);
}

const SHARED_DATABASE = "withTestDatabase";

const ADDS_PERIOD = "insert(academicPeriods)";

/**
 * The paths of the files that add a period themselves in the database
 * the checks share, and have no line of sample years. A check that ends
 * on a statement the database refused cannot be asked for its years, so
 * such a file could add a year of another file unseen.
 */
export function filesWithoutYearsLine(files: TestFileText[]): string[] {
  return files
    .filter((file) => file.text.includes(SHARED_DATABASE))
    .filter((file) => file.text.includes(ADDS_PERIOD))
    .filter((file) => yearsLineIn(file.text) === undefined)
    .map((file) => file.path);
}

function yearsOfBoth(one: YearRange, other: YearRange): YearRange | undefined {
  const first = Math.max(one.first, other.first);
  const last = Math.min(one.last, other.last);
  if (first > last) return undefined;
  return { first, last };
}

interface OwnYearsOfFile {
  path: string;
  own: YearRange;
}

function ownYearsOfFiles(files: TestFileText[]): OwnYearsOfFile[] {
  const ownYears: OwnYearsOfFile[] = [];
  for (const file of files) {
    const own = namedYearsIn(file.text)?.own;
    if (own) ownYears.push({ path: file.path, own });
  }
  return ownYears;
}

export function sharedYears(files: TestFileText[]): SharedYears[] {
  const shared: SharedYears[] = [];
  const ownYears = ownYearsOfFiles(files);
  for (const [place, one] of ownYears.entries()) {
    for (const other of ownYears.slice(place + 1)) {
      const years = yearsOfBoth(one.own, other.own);
      if (years) shared.push({ years, paths: [one.path, other.path] });
    }
  }
  return shared;
}
