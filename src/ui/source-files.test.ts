import { describe, expect, it } from "vitest";
import { sourceFilesEndingWith } from "./source-files";

describe("sourceFilesEndingWith", () => {
  it("writes paths the same way on every computer", () => {
    const paths = sourceFilesEndingWith(".ts");
    expect(paths).toContain("src/ui/source-files.ts");
    for (const path of paths) {
      expect(path).not.toContain("\\");
    }
  });
});
