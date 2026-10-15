/*
 * The kinds of proof file the app keeps, in the order the page lists
 * them. Read by the page in the browser, so nothing here may take from
 * the database code.
 */

export const PROOF_KINDS = [
  "attendance_photo",
  "siku_photo",
  "return_photo",
  "activity_clarification",
  "dorm_clarification",
  "appeal_proof",
] as const;

export type ProofKind = (typeof PROOF_KINDS)[number];

export const PROOF_KIND_TITLES: Record<ProofKind, string> = {
  attendance_photo: "Foto kehadiran kegiatan",
  siku_photo: "Foto bukti SIKU",
  return_photo: "Foto laporan kembali",
  activity_clarification: "Lampiran klarifikasi kegiatan karakter",
  dorm_clarification: "Lampiran klarifikasi asrama",
  appeal_proof: "Bukti advokasi pelanggaran",
};

/** A number for each kind of proof file. */
export type CountsByKind = Record<ProofKind, number>;

export function noCounts(): CountsByKind {
  return {
    attendance_photo: 0,
    siku_photo: 0,
    return_photo: 0,
    activity_clarification: 0,
    dorm_clarification: 0,
    appeal_proof: 0,
  };
}

export function totalOf(counts: CountsByKind): number {
  let total = 0;
  for (const kind of PROOF_KINDS) total += counts[kind];
  return total;
}
