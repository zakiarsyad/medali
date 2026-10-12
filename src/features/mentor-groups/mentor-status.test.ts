import { describe, expect, it } from "vitest";
import {
  inactiveSince,
  MENTOR_STATUS_TITLES,
  MENTOR_STATUSES,
  mentorStatus,
} from "./mentor-status";

describe("mentorStatus", () => {
  it("is Mengasuh for a mentor who holds a group today", () => {
    expect(mentorStatus({ groupsHeld: 2, hasMentorRole: true })).toBe(
      "mentoring",
    );
  });

  it("is Cadangan for a mentor with the role and no group", () => {
    expect(mentorStatus({ groupsHeld: 0, hasMentorRole: true })).toBe(
      "reserve",
    );
  });

  it("is Tidak aktif for one who lost the role or was removed, and holds no group", () => {
    expect(mentorStatus({ groupsHeld: 0, hasMentorRole: false })).toBe(
      "inactive",
    );
  });

  it("stays Mengasuh while a group is held, whatever the account says", () => {
    expect(mentorStatus({ groupsHeld: 1, hasMentorRole: false })).toBe(
      "mentoring",
    );
  });

  it("names the statuses as the screen shows them, in the order of the list", () => {
    const titles = MENTOR_STATUSES.map(
      (status) => MENTOR_STATUS_TITLES[status],
    );

    expect(titles).toEqual(["Mengasuh", "Cadangan", "Tidak aktif"]);
  });
});

describe("inactiveSince", () => {
  const taken = new Date("2026-03-04T02:00:00Z");
  const removed = new Date("2026-05-06T02:00:00Z");

  it("is the day the Pengasuh role was taken", () => {
    expect(inactiveSince({ roleTakenAt: taken, deletedAt: removed })).toBe(
      "2026-03-04",
    );
  });

  it("is the day the account was removed when the log has no line", () => {
    expect(inactiveSince({ roleTakenAt: null, deletedAt: removed })).toBe(
      "2026-05-06",
    );
  });

  it("is the day on campus, not the day elsewhere", () => {
    const lateEvening = new Date("2026-03-04T18:30:00Z");

    expect(inactiveSince({ roleTakenAt: lateEvening, deletedAt: null })).toBe(
      "2026-03-05",
    );
  });

  it("is no day when neither is known", () => {
    expect(inactiveSince({ roleTakenAt: null, deletedAt: null })).toBeNull();
  });
});
