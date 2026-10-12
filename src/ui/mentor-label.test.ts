import { describe, expect, it } from "vitest";
import { mentorLabel } from "./mentor-label";

describe("mentorLabel", () => {
  it("writes the gelar after the name when there is one", () => {
    expect(mentorLabel({ name: "Sari Uji", title: "M.Si." })).toBe(
      "Sari Uji, M.Si.",
    );
  });

  it("writes the name alone without a gelar", () => {
    expect(mentorLabel({ name: "Sari Uji", title: null })).toBe("Sari Uji");
    expect(mentorLabel({ name: "Sari Uji", title: "" })).toBe("Sari Uji");
  });
});
