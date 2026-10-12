// Sample NIMs of this file: 9999999800 to 9999999999. None is added to
// the database.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "@/ui/source-files";
import {
  nimBlocksIn,
  sharedNimBlocks,
  type TestFileText,
} from "./test-nim-blocks";

const TEST_FILE_ENDINGS = [".test.ts", ".test.tsx"];

function testFiles(): TestFileText[] {
  return TEST_FILE_ENDINGS.flatMap(sourceFilesEndingWith).map((path) => ({
    path,
    text: readFileSync(path, "utf8"),
  }));
}

describe("the blocks of sample NIMs in a test file", () => {
  it("are named by the first 8 digits of each NIM, once each", () => {
    const text = 'add("9999999901"); add("9999999902"); add("9999999801");';

    expect(nimBlocksIn(text)).toEqual(["99999999", "99999998"]);
  });

  it("include a NIM made from a number", () => {
    expect(nimBlocksIn("String(9999999900 + place)")).toEqual(["99999999"]);
  });

  it("include the start of a NIM that a test puts together or searches by", () => {
    const text = 'const START = "99999999"; find("999999980");';

    expect(nimBlocksIn(text)).toEqual(["99999999", "99999998"]);
  });

  it.each([
    ["a NIP", 'nip: "999999990000000001"'],
    ["a number that does not start with 99", 'nim: "4121260001"'],
    ["a number shorter than a block", 'query: "9999999"'],
  ])("leave out %s", (_name, text) => {
    expect(nimBlocksIn(text)).toEqual([]);
  });
});

describe("the sample NIMs of the test files", () => {
  it("are found to clash when two files use one block, naming both", () => {
    const shared = sharedNimBlocks([
      { path: "src/first.test.ts", text: 'nim: "9999999901"' },
      { path: "src/second.test.ts", text: 'nim: "9999999801"' },
      { path: "src/third.test.ts", text: "String(9999999950 + place)" },
    ]);

    expect(shared).toEqual([
      {
        block: "99999999",
        paths: ["src/first.test.ts", "src/third.test.ts"],
      },
    ]);
  });

  it("are read from the test files that hold them", () => {
    const withNims = testFiles().filter(
      (file) => nimBlocksIn(file.text).length > 0,
    );

    expect(withNims.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "src/features/students/student-list.test.ts",
        "src/features/mentor-groups/group-members-table.test.tsx",
      ]),
    );
  });

  it("are in a block of 100 NIMs that no other test file uses", () => {
    expect(sharedNimBlocks(testFiles())).toEqual([]);
  });
});
