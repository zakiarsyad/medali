import { describe, expect, it } from "vitest";
import { Refusal, shownFor } from "./refusal";

describe("shownFor", () => {
  it("shows a refusal as its one line of words", () => {
    expect(shownFor(new Refusal("Refused, and why."))).toBe(
      "Refused, and why.",
    );
  });

  it("shows any other fault whole, so it still fails loudly", () => {
    const fault = new Error("Something broke.");

    expect(shownFor(fault)).toBe(fault);
  });

  it("shows a fault that only wraps a refusal whole", () => {
    const fault = new Error("Wrapped.", { cause: new Refusal("Refused.") });

    expect(shownFor(fault)).toBe(fault);
  });
});
