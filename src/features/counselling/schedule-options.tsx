/** The options of a choice of fixed values, each with its words when it has them. */
export function ChoiceOptions<T extends string>({
  choices,
  words,
}: {
  choices: readonly T[];
  words?: Record<T, string>;
}) {
  return choices.map((choice) => (
    <option key={choice} value={choice}>
      {words ? words[choice] : choice}
    </option>
  ));
}
