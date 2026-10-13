import type { RoleId } from "@/auth/role-ids";

const REPLACE_FIRST =
  "Ganti pengasuh kelompok tersebut lebih dulu, lalu coba lagi.";

export const REMOVAL_REFUSED_FOR_GROUP = `Akun ini masih menjadi pengasuh sebuah kelompok pengasuhan, sehingga tidak bisa dihapus. ${REPLACE_FIRST}`;

export const ROLE_REFUSED_FOR_GROUP = `Akun ini masih menjadi pengasuh sebuah kelompok pengasuhan, sehingga peran Pengasuh tidak bisa dicabut. ${REPLACE_FIRST}`;

const CANCEL_FIRST =
  "Batalkan penggantian itu lebih dulu di Pengasuh, tab Evaluasi dan penggantian, lalu coba lagi.";

export const REMOVAL_REFUSED_FOR_REPLACEMENT = `Akun ini sudah ditetapkan sebagai pengasuh pengganti pada penggantian terjadwal, sehingga tidak bisa dihapus. ${CANCEL_FIRST}`;

export const ROLE_REFUSED_FOR_REPLACEMENT = `Akun ini sudah ditetapkan sebagai pengasuh pengganti pada penggantian terjadwal, sehingga peran Pengasuh tidak bisa dicabut. ${CANCEL_FIRST}`;

/** Whether a change of roles takes the Pengasuh role from an account. */
export function takesMentorRole(before: RoleId[], after: RoleId[]): boolean {
  return before.includes("mentor") && !after.includes("mentor");
}
