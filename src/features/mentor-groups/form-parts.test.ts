import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import { openPart } from "./form-parts";

const EVERY_ROW: RowLimit = { kind: "all" };

describe("openPart", () => {
  it("opens the form asked for when the account may use it", () => {
    const both = { evaluation: EVERY_ROW, replacement: EVERY_ROW };

    expect(openPart("replacement", both)).toBe("replacement");
    expect(openPart("evaluation", both)).toBe("evaluation");
  });

  it("opens the other form when the one asked for is not for the account", () => {
    const onlyEvaluates = { evaluation: EVERY_ROW, replacement: null };
    const onlyReplaces = { evaluation: null, replacement: EVERY_ROW };

    expect(openPart("replacement", onlyEvaluates)).toBe("evaluation");
    expect(openPart("evaluation", onlyReplaces)).toBe("replacement");
  });

  it("opens no form for an account that only reads", () => {
    const reads = { evaluation: null, replacement: null };

    expect(openPart("replacement", reads)).toBeNull();
  });
});
