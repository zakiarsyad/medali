/**
 * The version of a schedule last changed at that moment. Every change
 * sets a new moment, so a form opened before a change holds an old one.
 */
export function versionOf(changedAt: Date): string {
  return changedAt.toISOString();
}

/**
 * The moment a sent version stands for, or null when what was sent is not
 * a version this app made.
 */
export function momentOf(version: string): Date | null {
  const moment = new Date(version);
  if (Number.isNaN(moment.getTime())) return null;
  return versionOf(moment) === version ? moment : null;
}
