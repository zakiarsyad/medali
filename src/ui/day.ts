/** A day as the screens show it, such as 11 Okt 2026, in campus time. */
export const DAY = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const MOMENT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/** A moment as a log shows it, such as 11 Okt 2026, 14.05, in campus time. */
export function shownMoment(at: Date): string {
  return MOMENT.format(at);
}

/** A stored day as the screens show it, such as 1 Agu 2026. */
export function shownDay(day: string): string {
  return DAY.format(new Date(`${day}T00:00:00+07:00`));
}
