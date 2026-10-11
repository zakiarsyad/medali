/** A day as the screens show it, such as 11 Okt 2026, in campus time. */
export const DAY = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
