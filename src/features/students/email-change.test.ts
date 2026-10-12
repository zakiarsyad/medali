import { describe, expect, it } from "vitest";
import { emailChangeOf } from "./email-change";

const OLD = "lama.uji@kampus.example";
const NEW = "baru.uji@kampus.example";

describe("emailChangeOf", () => {
  it.each([
    ["added", null, NEW],
    ["changed", OLD, NEW],
    ["cleared", OLD, null],
  ] as const)(
    "calls it %s, with the address before and after",
    (action, before, after) => {
      expect(emailChangeOf(before, after)).toEqual({
        action,
        emailBefore: before,
        emailAfter: after,
      });
    },
  );

  it.each([
    ["the address stays as it is", OLD, OLD],
    ["there was none and there is none", null, null],
  ])("gives no line when %s", (_kind, before, after) => {
    expect(emailChangeOf(before, after)).toBeNull();
  });
});
