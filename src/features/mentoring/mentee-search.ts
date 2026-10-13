import type { Mentee } from "./mentees";

/**
 * The mentees whose name or NIM holds the text typed, in the order given.
 * Nothing typed finds nobody: the form offers a mentee only once the
 * mentor starts to type.
 */
export function matchingMentees(mentees: Mentee[], query: string): Mentee[] {
  const text = query.trim().toLowerCase();
  if (text === "") return [];
  return mentees.filter((mentee) => {
    const inName = mentee.name.toLowerCase().includes(text);
    return inName || mentee.nim.includes(text);
  });
}
