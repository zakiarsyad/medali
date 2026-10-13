import { describe, expect, it } from "vitest";
import { takesNewPhoto } from "./attendance-status";

describe("takesNewPhoto", () => {
  it("is so with nothing sent, and again after a rejection", () => {
    expect(takesNewPhoto(null)).toBe(true);
    expect(takesNewPhoto("rejected")).toBe(true);
  });

  it.each(["waiting", "valid", "dispensation"] as const)(
    "is not so while the newest attendance is %s",
    (status) => {
      expect(takesNewPhoto(status)).toBe(false);
    },
  );
});
