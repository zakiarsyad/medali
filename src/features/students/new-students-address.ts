import { firstParam, type SearchParams } from "@/ui/search-params";

export const NEW_STUDENTS_ADDRESS = "/pengaturan/mahasiswa";

export interface NewStudentsParams {
  query: string;
}

export function readNewStudentsParams(params: SearchParams): NewStudentsParams {
  return { query: firstParam(params.q).trim() };
}
