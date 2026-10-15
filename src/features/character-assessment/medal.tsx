import type { Scores } from "@/character-scores/assessment-score";
import { MEDALI_VALUES } from "@/ui/medali-values";
import styles from "./character-assessment.module.css";
import {
  axisEnd,
  CENTRE,
  LABEL_ROOM,
  labelAt,
  MEDAL_BOX,
  RIM_RADIUS,
  RINGS,
  ringOf,
  scorePoint,
  shapeOf,
} from "./medal-shape";

const VIEW_BOX = `${-LABEL_ROOM} 0 ${MEDAL_BOX + 2 * LABEL_ROOM} ${MEDAL_BOX}`;

function describedBy(scores: Scores): string {
  const each = MEDALI_VALUES.map(({ key, name }) => `${name} ${scores[key]}`);
  return `Grafik nilai MEDALI: ${each.join(", ")}`;
}

/**
 * "Pratinjau medali": the six scores as a shape on the medal, over the
 * shape of the last assessment as a dashed line when there is one. Each
 * corner carries the name of its value and its score.
 */
export function Medal({
  scores,
  last,
}: {
  scores: Scores;
  last: Scores | null;
}) {
  return (
    <svg className={styles.medal} viewBox={VIEW_BOX} role="img">
      <title>{describedBy(scores)}</title>
      <circle
        className={styles.medalRim}
        cx={CENTRE}
        cy={CENTRE}
        r={RIM_RADIUS}
      />
      {RINGS.map((score) => (
        <polygon
          key={score}
          className={score === 100 ? styles.medalFace : styles.medalRing}
          points={ringOf(score)}
        />
      ))}
      {MEDALI_VALUES.map(({ key }, place) => {
        const end = axisEnd(place);
        return (
          <line
            key={key}
            className={styles.medalRing}
            x1={CENTRE}
            y1={CENTRE}
            x2={end.x}
            y2={end.y}
          />
        );
      })}
      {last && <polygon className={styles.medalLast} points={shapeOf(last)} />}
      <polygon className={styles.medalShape} points={shapeOf(scores)} />
      {MEDALI_VALUES.map(({ key }, place) => {
        const point = scorePoint(place, scores[key]);
        return (
          <circle
            key={key}
            className={`${styles.medalDot} ${styles[`dot${key}`]}`}
            cx={point.x}
            cy={point.y}
            r={4}
          />
        );
      })}
      {MEDALI_VALUES.map(({ key, name }, place) => {
        const label = labelAt(place);
        return (
          <text
            key={key}
            className={styles.medalLabel}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor}
            dominantBaseline="middle"
          >
            {name}
            <tspan className={styles.medalScore} dx={5}>
              {scores[key]}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
