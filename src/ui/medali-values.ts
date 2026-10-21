/** The six MEDALI values, in the order of the word, each with its letter. */
export const MEDALI_VALUES = [
  { key: "M", name: "Mandiri" },
  { key: "E", name: "Empati" },
  { key: "D", name: "Disiplin" },
  { key: "A", name: "Adaptif" },
  { key: "L", name: "Loyal" },
  { key: "I", name: "Integritas" },
] as const;

export type ValueKey = (typeof MEDALI_VALUES)[number]["key"];

/** The name of a value, such as Mandiri for M. */
export function valueNameOf(key: ValueKey): string {
  for (const value of MEDALI_VALUES) {
    if (value.key === key) return value.name;
  }
  throw new Error("Every value key has a name.");
}
