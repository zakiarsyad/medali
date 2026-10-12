import { STAGES } from "@/academic-periods/stages";

/** Semester ganjil or semester genap. */
export type Parity = "odd" | "even";

export interface Tahap {
  /** 1 to 4. The tingkat and the indicator level have the same number. */
  no: number;
  name: string;
  description: string;
}

/** What each tahap is for, from the prototype, from tahap 1 to tahap 4. */
const DESCRIPTIONS: readonly [string, string, string, string] = [
  "Menanamkan nilai MEDALI dan membangun kebiasaan dasar kehidupan kampus kedinasan pada tingkat pertama.",
  "Menumbuhkan nilai melalui organisasi, kerja kelompok, dan tanggung jawab yang lebih besar.",
  "Mengembangkan nilai dalam praktik kerja lapangan, kepemimpinan, dan pelayanan masyarakat.",
  "Mematangkan integritas dan etos kerja menjelang penempatan sebagai aparatur sipil negara.",
];

export const TAHAP: Tahap[] = STAGES.map((name, place) => ({
  no: place + 1,
  name,
  description: DESCRIPTIONS[place] ?? "",
}));

/** The semester of a tahap: its first one when ganjil, its second when genap. */
export function semesterOf(tahapNo: number, parity: Parity): number {
  const second = tahapNo * 2;
  return parity === "even" ? second : second - 1;
}
