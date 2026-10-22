import type {
  LoggedSession,
  LoggedSessionAfter,
  NotesStep,
  SessionContent,
} from "./session-ids";

/** The before and after of a session's log line. */
export interface SessionLogLine {
  before: LoggedSession | null;
  after: LoggedSessionAfter;
}

/** Every part of a session but the words of its notes. */
function loggedOf(content: SessionContent): LoggedSession {
  return {
    day: content.day,
    kind: content.kind,
    topic: content.topic,
    followUp: content.followUp,
    nextDay: content.nextDay,
  };
}

function afterOf(content: SessionContent, notes: NotesStep) {
  return { ...loggedOf(content), notes };
}

/** The log line of a session written, which says its notes were written. */
export function writeLine(content: SessionContent): SessionLogLine {
  return { before: null, after: afterOf(content, "written") };
}

/** The log line of a session changed, which says whether its notes changed. */
export function changeLine(
  before: SessionContent,
  after: SessionContent,
): SessionLogLine {
  const notes = before.notes === after.notes ? "unchanged" : "changed";
  return { before: loggedOf(before), after: afterOf(after, notes) };
}
