import type {
  ActivityCategory,
  Audience,
  Organiser,
  RoutinePattern,
  RundownLine,
} from "./activity-ids";
import type { ActivityRow } from "./activity-row";

/** What the activity form holds when it opens. */
export interface FormStart {
  name: string;
  category: ActivityCategory;
  location: string;
  pattern: RoutinePattern;
  weekdays: number[];
  monthDay: number;
  startsOn: string;
  endsOn: string;
  /** Tanggal of a one-off activity. */
  day: string;
  startTime: string;
  endTime: string;
  organiser: Organiser;
  organiserName: string;
  audience: Audience;
  isRequired: boolean;
  daysOff: string[];
  rundown: RundownLine[];
}

/**
 * A new activity starts on the day that is open, from 16:00 to 17:30,
 * daily, for every resident, required, with one empty line of Rincian
 * kegiatan, as in the prototype.
 */
export function newStart(day: string): FormStart {
  return {
    name: "",
    category: "roll_call",
    location: "",
    pattern: "daily",
    weekdays: [],
    monthDay: 1,
    startsOn: day,
    endsOn: "",
    day,
    startTime: "16:00",
    endTime: "17:30",
    organiser: "upk",
    organiserName: "",
    audience: "all",
    isRequired: true,
    daysOff: [],
    rundown: [{ time: "", activity: "" }],
  };
}

/** A form opened for a change holds what the activity holds now. */
export function changeStart(activity: ActivityRow): FormStart {
  const pattern = activity.pattern === "once" ? "daily" : activity.pattern;
  return {
    name: activity.name,
    category: activity.category,
    location: activity.location,
    pattern,
    weekdays: activity.weekdays,
    monthDay: activity.monthDay ?? 1,
    startsOn: activity.startsOn,
    endsOn: activity.endsOn ?? "",
    day: activity.startsOn,
    startTime: activity.startTime,
    endTime: activity.endTime,
    organiser: activity.organiser,
    organiserName: activity.organiserName,
    audience: activity.audience,
    isRequired: activity.isRequired,
    daysOff: activity.daysOff,
    rundown: activity.rundown,
  };
}
