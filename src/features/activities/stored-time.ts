/** The database gives an hour with its seconds; the app keeps none. */
export function hourAndMinute(time: string): string {
  return time.slice(0, 5);
}
