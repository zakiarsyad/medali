import { cache } from "react";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { database } from "@/db/database";

/**
 * The academic period that runs today, read once for each request: the
 * list and the detail open over it both need it.
 */
export const runningPeriodNow = cache(() => readRunningPeriod(database()));
