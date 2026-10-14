/** Sweden writes the hour as 00 to 23 and the minute, with a colon. */
const HOUR_MINUTE = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** A moment on campus: the day, and the hour and minute, such as 07:30. */
export interface CampusMoment {
  day: string;
  time: string;
}

/** The hour and minute it is on campus at a moment, such as 07:30. */
export function campusTime(at: Date = new Date()): string {
  return HOUR_MINUTE.format(at);
}
