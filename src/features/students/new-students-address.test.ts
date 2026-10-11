import { describe, expect, it } from "vitest";
import { readNewStudentsParams } from "./new-students-address";

describe("readNewStudentsParams", () => {
  it("reads the search", () => {
    expect(readNewStudentsParams({ q: " ayu " })).toEqual({ query: "ayu" });
  });

  it.each([[{}], [{ q: "" }], [{ q: [] }]])(
    "reads no search from %o",
    (params) => {
      expect(readNewStudentsParams(params)).toEqual({ query: "" });
    },
  );
});
