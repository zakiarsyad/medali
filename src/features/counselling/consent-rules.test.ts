import { describe, expect, it } from "vitest";
import {
  type ConsentMove,
  consentAfter,
  counsellorMoves,
  studentMoves,
} from "./consent-rules";

describe("consentAfter", () => {
  it.each([null, "declined", "withdrawn"] as const)(
    "lets Konselor ask when the consent is %s, which makes it Menunggu",
    (current) => {
      expect(consentAfter("ask", current)).toEqual({
        status: "waiting",
        way: null,
      });
    },
  );

  it.each(["waiting", "approved"] as const)(
    "refuses a request when the consent is %s",
    (current) => {
      expect(consentAfter("ask", current)).toBeNull();
    },
  );

  it.each([null, "waiting", "declined", "withdrawn"] as const)(
    "lets Konselor record a paper form when the consent is %s, which makes it Disetujui on paper",
    (current) => {
      expect(consentAfter("record_paper", current)).toEqual({
        status: "approved",
        way: "paper",
      });
    },
  );

  it("refuses a paper form for a consent that is Disetujui already", () => {
    expect(consentAfter("record_paper", "approved")).toBeNull();
  });

  it("turns a waiting request into Disetujui online or Ditolak", () => {
    expect(consentAfter("approve", "waiting")).toEqual({
      status: "approved",
      way: "online",
    });
    expect(consentAfter("decline", "waiting")).toEqual({
      status: "declined",
      way: null,
    });
  });

  it.each([null, "approved", "declined", "withdrawn"] as const)(
    "refuses an answer when the consent is %s, which is not waiting",
    (current) => {
      expect(consentAfter("approve", current)).toBeNull();
      expect(consentAfter("decline", current)).toBeNull();
    },
  );

  it("withdraws only a consent that is Disetujui", () => {
    expect(consentAfter("withdraw", "approved")).toEqual({
      status: "withdrawn",
      way: null,
    });
    for (const current of [null, "waiting", "declined", "withdrawn"] as const) {
      expect(consentAfter("withdraw", current)).toBeNull();
    }
  });
});

describe("the buttons each status offers", () => {
  const offered: [
    Parameters<typeof counsellorMoves>[0],
    ConsentMove[],
    ConsentMove[],
  ][] = [
    [null, ["ask", "record_paper"], []],
    ["waiting", ["record_paper"], ["approve", "decline"]],
    ["approved", [], ["withdraw"]],
    ["declined", ["ask", "record_paper"], []],
    ["withdrawn", ["ask", "record_paper"], []],
  ];

  it.each(offered)(
    "for %s: Konselor %j, the student %j",
    (current, counsellor, student) => {
      expect(counsellorMoves(current)).toEqual(counsellor);
      expect(studentMoves(current)).toEqual(student);
    },
  );
});
