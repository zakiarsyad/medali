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

/** Each dorm without the word Asrama, where its name stands beside others. */
export const DORM_SHORT_NAMES: Record<DormId, string> = {
  wismantara_putra: "Wismantara Putra",
  wismantara_putri: "Wismantara Putri",
  dana_rakca: "Dana Rakca",
  cipta_bakti: "Cipta Bakti",
};

/** Who lives in each dorm, as the screens say it. */
export const DORM_RESIDENTS: Record<DormId, string> = {
  wismantara_putra: "mahasiswa laki-laki",
  wismantara_putri: "mahasiswa perempuan",
  dana_rakca: "mahasiswa perempuan",
  cipta_bakti: "mahasiswa laki-laki",
};

/** The jenis kelamin of the residents of each dorm. */
export const DORM_SEXES: Record<DormId, "male" | "female"> = {
  wismantara_putra: "male",
  wismantara_putri: "female",
  dana_rakca: "female",
  cipta_bakti: "male",
};
