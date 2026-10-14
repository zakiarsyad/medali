import { describe, expect, it } from "vitest";
import { activityClarificationReason } from "@/db/schema";
import {
  acceptedNote,
  CLARIFICATION_REASONS,
  REASON_WORDS,
  reasonOf,
} from "./clarification-reasons";

describe("the reasons of a clarification", () => {
  it("are the six of the form, in its order", () => {
    expect(CLARIFICATION_REASONS.map((reason) => REASON_WORDS[reason])).toEqual(
      [
        "Sakit",
        "Urusan keluarga mendesak",
        "Tugas institusi atau lomba",
        "Kendala teknis presensi",
        "Sudah hadir tetapi tidak tercatat",
        "Lainnya",
      ],
    );
  });

  it("are the ones the table keeps", () => {
    expect(CLARIFICATION_REASONS).toEqual(
      activityClarificationReason.enumValues,
    );
  });
});

describe("reasonOf", () => {
  it("takes a reason of the list", () => {
    expect(reasonOf("sick")).toBe("sick");
    expect(reasonOf("other")).toBe("other");
  });

  it.each(["", "Sakit", "SICK", "toString", "sick "])(
    "takes nothing else: %j",
    (sent) => {
      expect(reasonOf(sent)).toBeNull();
    },
  );
});

describe("acceptedNote", () => {
  it("is the Keterangan of the prototype, with the reason in words", () => {
    expect(acceptedNote("technical_trouble")).toBe(
      "Klarifikasi: Kendala teknis presensi",
    );
  });
});
