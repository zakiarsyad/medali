import { cache } from "react";
import { database } from "@/db/database";
import type { DormId } from "./dorms";
import { readStudentDorm } from "./student-dorm";

/**
 * The dorm the student of an account lives in today, asked once for each
 * request. An account that is not a student lives in none.
 */
export const currentDorm = cache(
  async (studentId: string | null): Promise<DormId | null> => {
    if (studentId === null) return null;
    return readStudentDorm(database(), studentId);
  },
);
