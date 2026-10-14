import { describe, expect, it } from "vitest";
import { firstLetters, lettersIn } from "./letters-in";

describe("lettersIn", () => {
  it("counts an emoji as one letter, as the database does", () => {
    expect(lettersIn("Mengajar 🙏🙏")).toBe(11);
    expect(lettersIn("")).toBe(0);
  });
});

describe("firstLetters", () => {
  it("keeps the first letters without cutting an emoji in half", () => {
    expect(firstLetters("ab🙏🙏", 3)).toBe("ab🙏");
    expect(firstLetters("ab", 5)).toBe("ab");
  });
});
