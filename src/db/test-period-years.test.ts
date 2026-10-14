import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "@/ui/source-files";
import type { TestFileText } from "./test-nim-blocks";
import {
  filesWithoutYearsLine,
  namedYearsIn,
  sharedYears,
  unnamedYears,
  unnamedYearsMessage,
  unreadableYearLines,
  yearsLineIn,
} from "./test-period-years";

const TEST_FILE_ENDINGS = [".test.ts", ".test.tsx"];

const SAMPLE_DATA = "those of the app's sample data";

function testFiles(): TestFileText[] {
  return TEST_FILE_ENDINGS.flatMap(sourceFilesEndingWith).map((path) => ({
    path,
    text: readFileSync(path, "utf8"),
  }));
}

/** The text of a made-up test file whose first line names these years. */
function textNaming(years: string): string {
  return `// Sample Tahun akademik of this file: ${years}.\nimport { it } from "vitest";\n`;
}

// Written in parts, so this file is not read as one that adds a period
// in the database the checks share.
const SHARED_DATABASE = ["const inTestDatabase = with", "TestDatabase();"];
const OWN_DATABASE = `const own = withOwnTestDatabase("years");\n`;
const ADDS_PERIOD = ["await db.insert(", "academicPeriods).values(ODD);"];

/** The text of a made-up test file, after its first line. */
function textWith(...lines: string[][]): string {
  return lines.map((parts) => `${parts.join("")}\n`).join("");
}

describe("the line of sample years of a test file", () => {
  it("names the first and the last year the file adds", () => {
    expect(namedYearsIn(textNaming("2159 to 2161"))).toEqual({
      own: { first: 2159, last: 2161 },
      withSampleData: false,
    });
  });

  it("names one year as its first and its last", () => {
    expect(namedYearsIn(textNaming("2159 to 2159"))?.own).toEqual({
      first: 2159,
      last: 2159,
    });
  });

  it("names the years of the app's sample data, and no year of its own", () => {
    expect(namedYearsIn(textNaming(SAMPLE_DATA))).toEqual({
      withSampleData: true,
    });
  });

  it("names years of its own and those of the app's sample data", () => {
    expect(
      namedYearsIn(textNaming(`2199 to 2200, and ${SAMPLE_DATA}`)),
    ).toEqual({ own: { first: 2199, last: 2200 }, withSampleData: true });
  });

  it("is read on the first line only", () => {
    const text = `import { it } from "vitest";\n${textNaming("2159 to 2161")}`;

    expect(yearsLineIn(text)).toBeUndefined();
    expect(namedYearsIn(text)).toBeUndefined();
  });

  it("is read beside the line of sample NIMs under it", () => {
    const text = `${textNaming("2159 to 2161")}// Sample NIMs of this file: a block of its own.\n`;

    expect(namedYearsIn(text)?.own).toEqual({ first: 2159, last: 2161 });
  });

  it.each([
    ["a year before 2090", "2089 to 2090"],
    ["a year after 9999", "2159 to 10000"],
    ["a last year before the first", "2161 to 2159"],
    ["one year alone", "2159"],
    ["a list of years", "2159, 2161"],
    ["other words", "the usual ones"],
  ])("cannot be read with %s", (_name, years) => {
    const text = textNaming(years);

    expect(namedYearsIn(text)).toBeUndefined();
    expect(unreadableYearLines([{ path: "src/one.test.ts", text }])).toEqual([
      "src/one.test.ts",
    ]);
  });

  it("is not missed by a file that has none", () => {
    const files = [
      { path: "src/one.test.ts", text: 'import { it } from "vitest";\n' },
      { path: "src/two.test.ts", text: textNaming("2159 to 2161") },
    ];

    expect(unreadableYearLines(files)).toEqual([]);
  });
});

describe("the test files that must have a line of sample years", () => {
  const adding = textWith(SHARED_DATABASE, ADDS_PERIOD);

  it("name a file that adds a period itself and has no line", () => {
    const files = [{ path: "src/one.test.ts", text: adding }];

    expect(filesWithoutYearsLine(files)).toEqual(["src/one.test.ts"]);
  });

  it("leave out a file that has the line", () => {
    const text = `${textNaming("2159 to 2161")}${adding}`;

    expect(filesWithoutYearsLine([{ path: "src/one.test.ts", text }])).toEqual(
      [],
    );
  });

  it("leave out a file with a database of its own", () => {
    const text = `${OWN_DATABASE}${textWith(ADDS_PERIOD)}`;

    expect(filesWithoutYearsLine([{ path: "src/one.test.ts", text }])).toEqual(
      [],
    );
  });

  it("leave out a file that adds no period itself", () => {
    const text = textWith(SHARED_DATABASE);

    expect(filesWithoutYearsLine([{ path: "src/one.test.ts", text }])).toEqual(
      [],
    );
  });
});

describe("the years a test file added without naming them", () => {
  const own = namedYearsIn(textNaming("2159 to 2161"));
  const sampleData = namedYearsIn(textNaming(SAMPLE_DATA));
  const both = namedYearsIn(textNaming(`2159 to 2161, and ${SAMPLE_DATA}`));

  it("are none for the years from the first to the last it names", () => {
    expect(unnamedYears([2159, 2160, 2161], own)).toEqual([]);
  });

  it("are those outside the years it names", () => {
    expect(unnamedYears([2158, 2160, 2162], own)).toEqual([2158, 2162]);
  });

  it("are those of the app's sample data when the line does not say so", () => {
    expect(unnamedYears([2025, 2026, 2160], own)).toEqual([2025, 2026]);
  });

  it("are none before 2090 for a file that names the app's sample data", () => {
    expect(unnamedYears([2024, 2089], sampleData)).toEqual([]);
  });

  it("are those from 2090 on for a file that names only the app's sample data", () => {
    expect(unnamedYears([2026, 2090, 2160], sampleData)).toEqual([2090, 2160]);
  });

  it("are none for a file that names both and adds both", () => {
    expect(unnamedYears([2026, 2159, 2161], both)).toEqual([]);
  });

  it("are all of them for a file with no line, or one that cannot be read", () => {
    expect(unnamedYears([2026, 2160], undefined)).toEqual([2026, 2160]);
    expect(unnamedYears([], undefined)).toEqual([]);
  });

  it("are told with the file, the years and what to do", () => {
    const message = unnamedYearsMessage("src/one.test.ts", [2026, 2160]);

    expect(message).toContain("src/one.test.ts added the Tahun akademik");
    expect(message).toContain("2026, 2160");
    expect(message).toContain("// Sample Tahun akademik of this file: ");
  });

  it("are told with the words for the app's sample data when one is before 2090", () => {
    const message = unnamedYearsMessage("src/one.test.ts", [2026, 2160]);

    expect(message).toContain("A year before 2090 is left to the app's");
    expect(message).toContain(`2700 to 2701, and ${SAMPLE_DATA}.`);
    expect(message).toContain(`file: ${SAMPLE_DATA}.`);
  });

  it("are told without the app's sample data when all are from 2090 on", () => {
    const message = unnamedYearsMessage("src/one.test.ts", [2160]);

    expect(message).not.toContain("sample data");
  });
});

describe("the sample years of the test files", () => {
  it("are found to clash when the years of two files meet, naming both", () => {
    const shared = sharedYears([
      { path: "src/first.test.ts", text: textNaming("2159 to 2161") },
      { path: "src/second.test.ts", text: textNaming("2170 to 2170") },
      { path: "src/third.test.ts", text: textNaming("2161 to 2165") },
    ]);

    expect(shared).toEqual([
      {
        years: { first: 2161, last: 2161 },
        paths: ["src/first.test.ts", "src/third.test.ts"],
      },
    ]);
  });

  it("are found to clash when one file's years lie inside another's", () => {
    const shared = sharedYears([
      { path: "src/first.test.ts", text: textNaming("2159 to 2165") },
      { path: "src/second.test.ts", text: textNaming("2160 to 2162") },
    ]);

    expect(shared).toEqual([
      {
        years: { first: 2160, last: 2162 },
        paths: ["src/first.test.ts", "src/second.test.ts"],
      },
    ]);
  });

  it("do not clash when the years of two files follow each other", () => {
    const shared = sharedYears([
      { path: "src/first.test.ts", text: textNaming("2159 to 2160") },
      { path: "src/second.test.ts", text: textNaming("2161 to 2162") },
    ]);

    expect(shared).toEqual([]);
  });

  it("do not clash between files that only load the app's sample data", () => {
    const shared = sharedYears([
      { path: "src/first.test.ts", text: textNaming(SAMPLE_DATA) },
      { path: "src/second.test.ts", text: textNaming(SAMPLE_DATA) },
    ]);

    expect(shared).toEqual([]);
  });

  it("clash by a file's own years when it loads the app's sample data too", () => {
    const shared = sharedYears([
      {
        path: "src/first.test.ts",
        text: textNaming(`2159 to 2160, and ${SAMPLE_DATA}`),
      },
      { path: "src/second.test.ts", text: textNaming("2160 to 2160") },
    ]);

    expect(shared).toEqual([
      {
        years: { first: 2160, last: 2160 },
        paths: ["src/first.test.ts", "src/second.test.ts"],
      },
    ]);
  });

  it("are read from the test files that name them", () => {
    const withYears = testFiles().filter(
      (file) => namedYearsIn(file.text) !== undefined,
    );

    expect(withYears.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "src/features/activities/student-activities.test.ts",
        "src/db/seed.test.ts",
      ]),
    );
  });

  it("are named in a line that can be read, from 2090 to 9999", () => {
    expect(unreadableYearLines(testFiles())).toEqual([]);
  });

  it("are named by every test file that adds a period itself", () => {
    expect(filesWithoutYearsLine(testFiles())).toEqual([]);
  });

  it("are years that no other test file adds", () => {
    expect(sharedYears(testFiles())).toEqual([]);
  });
});
