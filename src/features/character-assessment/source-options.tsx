import { ASSESSMENT_SOURCES } from "./assessment-ids";
import { SOURCE_WORDS } from "./assessment-words";

/** The choices of "Sumber asesmen", in the prototype's order. */
export function SourceOptions() {
  return ASSESSMENT_SOURCES.map((each) => (
    <option key={each} value={each}>
      {SOURCE_WORDS[each]}
    </option>
  ));
}
