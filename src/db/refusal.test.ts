import { describe, expect, it } from "vitest";
import { faultCodeOf, Refusal, shownFor } from "./refusal";

describe("faultCodeOf", () => {
  it("gives the code of a fault", () => {
    const fault = Object.assign(new Error("Down."), { code: "ECONNREFUSED" });

    expect(faultCodeOf(fault)).toBe("ECONNREFUSED");
  });

  it("gives the code of the fault another one wraps", () => {
    const cause = Object.assign(new Error("Refused."), { code: "23505" });
    const fault = new Error(
      "Failed query: insert into accounts params: Sari Contoh,sari@kampus.example",
      { cause },
    );

    expect(faultCodeOf(fault)).toBe("23505");
  });

  it("gives nothing for a fault without a code, or for what is no fault", () => {
    expect(faultCodeOf(new Error("Something broke."))).toBeNull();
    expect(faultCodeOf("Something broke.")).toBeNull();
  });
});

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
