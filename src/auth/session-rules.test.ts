import { describe, expect, it } from "vitest";
import {
  expiredBefore,
  lastSeenNeedsWriting,
  sessionExpired,
} from "./session-rules";

const NOW = new Date("2026-10-12T16:00:00Z");

function ago(hours: number, minutes = 0): Date {
  const milliseconds = (hours * 60 + minutes) * 60 * 1000;
  return new Date(NOW.getTime() - milliseconds);
}

describe("sessionExpired", () => {
  it.each([
    ["just now", ago(0)],
    ["an hour ago", ago(1)],
    ["a minute short of 8 hours ago", ago(7, 59)],
  ])("keeps a session last used %s", (_when, lastSeen) => {
    expect(sessionExpired(lastSeen, NOW)).toBe(false);
  });

  it.each([
    ["8 hours ago", ago(8)],
    ["a minute over 8 hours ago", ago(8, 1)],
    ["a day ago", ago(24)],
  ])("ends a session last used %s", (_when, lastSeen) => {
    expect(sessionExpired(lastSeen, NOW)).toBe(true);
  });
});

describe("expiredBefore", () => {
  it("is the time 8 hours back, from which a session has expired", () => {
    expect(expiredBefore(NOW)).toEqual(ago(8));
    expect(sessionExpired(expiredBefore(NOW), NOW)).toBe(true);
  });
});

describe("lastSeenNeedsWriting", () => {
  it.each([
    ["just now", ago(0)],
    ["4 minutes ago", ago(0, 4)],
  ])("skips the write for a session last used %s", (_when, lastSeen) => {
    expect(lastSeenNeedsWriting(lastSeen, NOW)).toBe(false);
  });

  it.each([
    ["5 minutes ago", ago(0, 5)],
    ["an hour ago", ago(1)],
  ])("writes for a session last used %s", (_when, lastSeen) => {
    expect(lastSeenNeedsWriting(lastSeen, NOW)).toBe(true);
  });
});
