import { sql } from "drizzle-orm";
import { students } from "@/db/schema";

/** Whether the student has an Instansi asal: one that is not only spaces. */
export const HAS_AGENCY = sql<boolean>`coalesce(btrim(${students.originAgency}), '') <> ''`;
