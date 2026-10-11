import { isAccountId } from "@/auth/accounts";
import type { Parsed } from "@/parsed";
import { isManagedRole, type ManagedRole } from "./managed-roles";

export interface NewAccountFields {
  name: string;
  title: string;
  nip: string;
  email: string;
  roles: string[];
  studyProgramId: string;
  unit: string;
}

export interface NewAccount {
  name: string;
  title: string | null;
  nip: string | null;
  email: string;
  roles: ManagedRole[];
  studyProgramId: number | null;
  unit: string | null;
}

export interface RoleChangeFields {
  accountId: string;
  roles: string[];
  studyProgramId: string;
  unit: string;
}

export interface RoleChange {
  accountId: string;
  roles: ManagedRole[];
  studyProgramId: number | null;
  unit: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIP = /^\d{1,18}$/;
const PROGRAM_ID = /^[1-9]\d*$/;
/** The largest id the database can hold. */
const MAX_ID = 2_147_483_647;

function optional(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

function parseRoles(
  roles: string[],
  noneAllowed: boolean,
): Parsed<ManagedRole[]> {
  if (roles.length === 0 && !noneAllowed) {
    return { ok: false, error: "Pilih minimal satu peran." };
  }
  const managed = roles.filter(isManagedRole);
  if (managed.length !== roles.length) {
    return { ok: false, error: "Peran tidak dikenal." };
  }
  return { ok: true, value: [...new Set(managed)] };
}

function parseProgram(
  roles: ManagedRole[],
  studyProgramId: string,
): Parsed<number | null> {
  if (!roles.includes("head_of_program")) return { ok: true, value: null };
  if (!PROGRAM_ID.test(studyProgramId) || Number(studyProgramId) > MAX_ID) {
    return {
      ok: false,
      error: "Pilih program studi untuk Ketua Program Studi.",
    };
  }
  return { ok: true, value: Number(studyProgramId) };
}

export function parseNewAccount(fields: NewAccountFields): Parsed<NewAccount> {
  const name = fields.name.trim();
  if (name.length < 3) return { ok: false, error: "Isi nama lengkap." };
  const email = fields.email.trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return { ok: false, error: "Isi email kedinasan yang benar." };
  }
  const nip = optional(fields.nip);
  if (nip !== null && !NIP.test(nip)) {
    return {
      ok: false,
      error: "NIP hanya berisi angka, paling banyak 18 digit.",
    };
  }
  const roles = parseRoles(fields.roles, false);
  if (!roles.ok) return roles;
  const program = parseProgram(roles.value, fields.studyProgramId);
  if (!program.ok) return program;

  return {
    ok: true,
    value: {
      name,
      title: optional(fields.title),
      nip,
      email,
      roles: roles.value,
      studyProgramId: program.value,
      unit: optional(fields.unit),
    },
  };
}

export function parseRoleChange(fields: RoleChangeFields): Parsed<RoleChange> {
  if (!isAccountId(fields.accountId)) {
    return { ok: false, error: "Akun tidak ditemukan." };
  }
  // An account may keep only roles not managed here, such as Kepala Unit;
  // changeRoles refuses to leave it with none at all.
  const roles = parseRoles(fields.roles, true);
  if (!roles.ok) return roles;
  const program = parseProgram(roles.value, fields.studyProgramId);
  if (!program.ok) return program;

  return {
    ok: true,
    value: {
      accountId: fields.accountId,
      roles: roles.value,
      studyProgramId: program.value,
      unit: optional(fields.unit),
    },
  };
}
