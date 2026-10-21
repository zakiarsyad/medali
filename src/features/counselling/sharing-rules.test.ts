import { describe, expect, it } from "vitest";
import { SHARING_STATUSES, type SharingStatus } from "./sharing-ids";
import {
  counsellorSharingMoves,
  isCurrentSharing,
  isStop,
  recipientSees,
  sharingAfter,
  studentSharingMoves,
  wayOf,
} from "./sharing-rules";

const ENDED: SharingStatus[] = ["declined", "cancelled", "withdrawn"];

describe("what a sharing becomes after a move", () => {
  it("is asked for when there is none, or the last one ended", () => {
    expect(sharingAfter("ask", null)).toBe("waiting");
    for (const status of ENDED) {
      expect(sharingAfter("ask", status)).toBe("waiting");
    }
  });

  it("is never asked for twice while one is current", () => {
    for (const status of ["waiting", "approved", "published"] as const) {
      expect(sharingAfter("ask", status)).toBeNull();
    }
  });

  it("is approved online or on paper, or declined, only while it waits", () => {
    expect(sharingAfter("approve", "waiting")).toBe("approved");
    expect(sharingAfter("record_paper", "waiting")).toBe("approved");
    expect(sharingAfter("decline", "waiting")).toBe("declined");
    for (const status of SHARING_STATUSES.filter((one) => one !== "waiting")) {
      expect(sharingAfter("approve", status)).toBeNull();
      expect(sharingAfter("record_paper", status)).toBeNull();
      expect(sharingAfter("decline", status)).toBeNull();
    }
  });

  it("is published only once Disetujui", () => {
    expect(sharingAfter("publish", "approved")).toBe("published");
    for (const status of SHARING_STATUSES.filter((one) => one !== "approved")) {
      expect(sharingAfter("publish", status)).toBeNull();
    }
  });

  it("is Ditarik by Konselor from any current status", () => {
    expect(sharingAfter("cancel", "waiting")).toBe("cancelled");
    expect(sharingAfter("cancel", "approved")).toBe("cancelled");
    expect(sharingAfter("cancel", "published")).toBe("cancelled");
    for (const status of ENDED) {
      expect(sharingAfter("cancel", status)).toBeNull();
    }
  });

  it("is Dicabut by the student once approved or published", () => {
    expect(sharingAfter("withdraw", "approved")).toBe("withdrawn");
    expect(sharingAfter("withdraw", "published")).toBe("withdrawn");
    expect(sharingAfter("withdraw", "waiting")).toBeNull();
    for (const status of ENDED) {
      expect(sharingAfter("withdraw", status)).toBeNull();
    }
  });

  it("is Dicabut from any current status when the consent to counselling is withdrawn", () => {
    for (const status of ["waiting", "approved", "published"] as const) {
      expect(sharingAfter("consent_withdrawn", status)).toBe("withdrawn");
    }
    for (const status of ENDED) {
      expect(sharingAfter("consent_withdrawn", status)).toBeNull();
    }
  });
});

describe("how an approval was given", () => {
  it("is online for the student's own press and paper for a recorded form", () => {
    expect(wayOf("approve")).toBe("online");
    expect(wayOf("record_paper")).toBe("paper");
    expect(wayOf("publish")).toBeNull();
  });
});

describe("the stops", () => {
  it("are Konselor's cancel and the student's withdrawals", () => {
    expect(isStop("cancel")).toBe(true);
    expect(isStop("withdraw")).toBe(true);
    expect(isStop("consent_withdrawn")).toBe(true);
    expect(isStop("publish")).toBe(false);
    expect(isStop("approve")).toBe(false);
  });
});

describe("the current statuses", () => {
  it("are Menunggu persetujuan, Disetujui and Dipublikasikan", () => {
    const current = SHARING_STATUSES.filter(isCurrentSharing);
    expect(current).toEqual(["waiting", "approved", "published"]);
  });
});

describe("the buttons", () => {
  it("of Konselor follow the status", () => {
    expect(counsellorSharingMoves(null)).toEqual(["ask"]);
    expect(counsellorSharingMoves("declined")).toEqual(["ask"]);
    expect(counsellorSharingMoves("waiting")).toEqual([
      "record_paper",
      "cancel",
    ]);
    expect(counsellorSharingMoves("approved")).toEqual(["publish", "cancel"]);
    expect(counsellorSharingMoves("published")).toEqual(["cancel"]);
  });

  it("of the student follow the status", () => {
    expect(studentSharingMoves(null)).toEqual([]);
    expect(studentSharingMoves("waiting")).toEqual(["approve", "decline"]);
    expect(studentSharingMoves("approved")).toEqual(["withdraw"]);
    expect(studentSharingMoves("published")).toEqual(["withdraw"]);
    expect(studentSharingMoves("withdrawn")).toEqual([]);
  });
});

describe("what a recipient sees", () => {
  it("is a Dipublikasikan sharing only, and only by a recipient ticked on it", () => {
    const recipients = ["mentor", "head_of_unit"] as const;
    expect(recipientSees({ status: "published", recipients }, "mentor")).toBe(
      true,
    );
    expect(recipientSees({ status: "published", recipients }, "director")).toBe(
      false,
    );
    for (const status of SHARING_STATUSES.filter(
      (one) => one !== "published",
    )) {
      expect(recipientSees({ status, recipients }, "mentor")).toBe(false);
    }
  });
});
