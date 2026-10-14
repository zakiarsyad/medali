import { parseAccountEmail } from "@/auth/account-email";
import { isAccountId } from "@/auth/accounts";
import type { Parsed } from "@/parsed";
import {
  NAME_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  UNIT_MAX_LENGTH,
} from "./account-limits";
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

const NIP = /^\d{1,18}$/;
const PROGRAM_ID = /^[1-9]\d*$/;
/** The largest id the database can hold. */
const MAX_ID = 2_147_483_647;

const SHORTEST_NAME = 3;

/** Whether a name, without spaces around it, is long enough to be one. */
export function isFullName(name: string): boolean {
  return name.length >= SHORTEST_NAME;
}

function optional(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

function parseName(text: string): Parsed<string> {
  const name = text.trim();
  if (!isFullName(name)) return { ok: false, error: "Isi nama lengkap." };
  if (name.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Nama paling banyak ${NAME_MAX_LENGTH} karakter.`,
    };
  }
  return { ok: true, value: name };
}

function parseTitle(text: string): Parsed<string | null> {
  const title = optional(text);
  if (title !== null && title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Gelar paling banyak ${TITLE_MAX_LENGTH} karakter.`,
    };
  }
  return { ok: true, value: title };
}

function parseUnit(text: string): Parsed<string | null> {
  const unit = optional(text);
  if (unit !== null && unit.length > UNIT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Unit atau jabatan paling banyak ${UNIT_MAX_LENGTH} karakter.`,
    };
  }
  return { ok: true, value: unit };
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

/**
 * Checks a new account. `campusEnding` is the campus address ending from
 * the settings: once it is set the email must end with it, because no
 * other address can sign in. While it is empty any address is taken.
 */
export function parseNewAccount(
  fields: NewAccountFields,
  campusEnding: string,
): Parsed<NewAccount> {
  const name = parseName(fields.name);
  if (!name.ok) return name;
  const title = parseTitle(fields.title);
  if (!title.ok) return title;
  const email = parseAccountEmail(
    fields.email,
    campusEnding,
    "Isi email kedinasan yang benar.",
  );
  if (!email.ok) return email;
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
  const unit = parseUnit(fields.unit);
  if (!unit.ok) return unit;

  return {
    ok: true,
    value: {
      name: name.value,
      title: title.value,
      nip,
      email: email.value,
      roles: roles.value,
      studyProgramId: program.value,
      unit: unit.value,
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
  const unit = parseUnit(fields.unit);
  if (!unit.ok) return unit;

  return {
    ok: true,
    value: {
      accountId: fields.accountId,
      roles: roles.value,
      studyProgramId: program.value,
      unit: unit.value,
    },
  };
}
