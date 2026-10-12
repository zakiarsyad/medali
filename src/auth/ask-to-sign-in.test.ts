import { describe, expect, it } from "vitest";
import { answerToNobody } from "./ask-to-sign-in";

describe("answerToNobody", () => {
  it("is the sign-in page on the campus server", () => {
    expect(answerToNobody("campus")).toBe("sign-in");
  });

  it.each(["local", "pr-preview", "main-preview"] as const)(
    "is a refusal in %s, where Ganti peran gives an account",
    (stage) => {
      expect(answerToNobody(stage)).toBe("refused");
    },
  );
});
