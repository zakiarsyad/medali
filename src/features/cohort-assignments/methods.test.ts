import { describe, expect, it } from "vitest";
import {
  ASSIGNMENT_METHODS,
  DEFAULT_METHOD,
  METHOD_TITLES,
  methodOf,
} from "./methods";

describe("the methods", () => {
  it("are the three of the prototype, in its order and its words", () => {
    expect(ASSIGNMENT_METHODS.map((method) => METHOD_TITLES[method])).toEqual([
      "Seimbang jenis kelamin dan provinsi",
      "Urut NIM",
      "Mengikuti kelas akademik",
    ]);
  });

  it("start with the balanced one", () => {
    expect(DEFAULT_METHOD).toBe("balanced");
  });
});

describe("methodOf", () => {
  it.each(ASSIGNMENT_METHODS)("knows %s", (method) => {
    expect(methodOf(method)).toBe(method);
  });

  it("gives null for a text that names no method", () => {
    expect(methodOf("")).toBe(null);
    expect(methodOf("seimbang")).toBe(null);
  });
});
