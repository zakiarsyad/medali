/** A day as the screens show it, such as 11 Okt 2026, in campus time. */
export const DAY = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** A stored day as the screens show it, such as 1 Agu 2026. */
export function shownDay(day: string): string {
  return DAY.format(new Date(`${day}T00:00:00+07:00`));
}
