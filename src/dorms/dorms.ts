/** The four dorms, in the order the screens show them. */
export const DORM_IDS = [
  "wismantara_putra",
  "wismantara_putri",
  "dana_rakca",
  "cipta_bakti",
] as const;

export type DormId = (typeof DORM_IDS)[number];

export const DORM_NAMES: Record<DormId, string> = {
  wismantara_putra: "Asrama Wismantara Putra",
  wismantara_putri: "Asrama Wismantara Putri",
  dana_rakca: "Asrama Dana Rakca",
  cipta_bakti: "Asrama Cipta Bakti",
};

/** Who lives in each dorm, as the screens say it. */
export const DORM_RESIDENTS: Record<DormId, string> = {
  wismantara_putra: "mahasiswa laki-laki",
  wismantara_putri: "mahasiswa perempuan",
  dana_rakca: "mahasiswa perempuan",
  cipta_bakti: "mahasiswa laki-laki",
};
