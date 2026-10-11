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
