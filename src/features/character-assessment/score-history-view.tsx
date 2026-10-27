import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { ValueSwatch } from "@/ui/value-swatch";
import styles from "./character-assessment.module.css";
import {
  AXIS_LEFT,
  AXIS_RIGHT,
  CHART_HEIGHT,
  CHART_WIDTH,
  GRID_SCORES,
  pathOf,
  SEMESTER_LABEL_Y,
  xAt,
  yAt,
} from "./history-chart";
import history from "./score-history.module.css";
import type { SemesterPoint } from "./semester-points";

const VIEW_BOX = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;

/** How far the numbers of the scale stand left of its lines. */
const GRID_LABEL_GAP = 6;

const VALUE_DOT_RADIUS = 2.5;
const RERATA_DOT_RADIUS = 3.5;

function semesterName(point: SemesterPoint): string {
  return `Smt ${point.semester}`;
}

function describedBy(points: readonly SemesterPoint[]): string {
  const each = points.map(
    (point) => `${semesterName(point)} Rerata ${shownRerata(point.rerata)}`,
  );
  return `Grafik riwayat nilai MEDALI per semester: ${each.join(", ")}`;
}

function Legend() {
  return (
    <ul className={history.legend}>
      <li>
        <i className={history.rerataSwatch} />
        Rerata
      </li>
      {MEDALI_VALUES.map(({ key, name }) => (
        <li key={key} title={name}>
          <ValueSwatch value={key} />
          {key}
        </li>
      ))}
    </ul>
  );
}

function Grid() {
  return GRID_SCORES.map((score) => (
    <g key={score}>
      <line
        className={history.gridLine}
        x1={AXIS_LEFT}
        x2={AXIS_RIGHT}
        y1={yAt(score)}
        y2={yAt(score)}
      />
      <text
        className={history.gridLabel}
        x={AXIS_LEFT - GRID_LABEL_GAP}
        y={yAt(score)}
        textAnchor="end"
        dominantBaseline="middle"
      >
        {score}
      </text>
    </g>
  ));
}

function SemesterLabels({ points }: { points: readonly SemesterPoint[] }) {
  return points.map((point, place) => (
    <text
      key={point.periodTitle}
      className={history.semesterLabel}
      x={xAt(place, points.length)}
      y={SEMESTER_LABEL_Y}
      textAnchor="middle"
    >
      {semesterName(point)}
    </text>
  ));
}

/**
 * A line and a dot per semester for each value. The dots keep a value
 * seen when only one semester was assessed, with no line to draw.
 */
function ValueLines({ points }: { points: readonly SemesterPoint[] }) {
  return MEDALI_VALUES.map(({ key }) => {
    const scores = points.map((point) => point.scores[key]);
    return (
      <g key={key} className={history[key]}>
        <path className={history.valueLine} d={pathOf(scores)} />
        {points.map((point, place) => (
          <circle
            key={point.periodTitle}
            className={history.valueDot}
            cx={xAt(place, points.length)}
            cy={yAt(point.scores[key])}
            r={VALUE_DOT_RADIUS}
          />
        ))}
      </g>
    );
  });
}

function RerataLine({ points }: { points: readonly SemesterPoint[] }) {
  const reratas = points.map((point) => point.rerata);
  return (
    <g>
      <path className={history.rerataLine} d={pathOf(reratas)} />
      {points.map((point, place) => (
        <circle
          key={point.periodTitle}
          className={history.rerataDot}
          cx={xAt(place, points.length)}
          cy={yAt(point.rerata)}
          r={RERATA_DOT_RADIUS}
        />
      ))}
    </g>
  );
}

/**
 * The line chart, from 40 at the bottom to 100 at the top. A score
 * below 40 stands at the bottom edge; the table gives its number.
 */
function HistoryChart({ points }: { points: readonly SemesterPoint[] }) {
  const words = describedBy(points);
  return (
    <svg
      className={history.chart}
      viewBox={VIEW_BOX}
      role="img"
      aria-label={words}
    >
      <title>{words}</title>
      <Grid />
      <SemesterLabels points={points} />
      <ValueLines points={points} />
      <RerataLine points={points} />
    </svg>
  );
}

/** The numbers of the chart, for a reader who cannot tell its colours. */
function HistoryTable({ points }: { points: readonly SemesterPoint[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Semester</th>
            <th>Rerata</th>
            {MEDALI_VALUES.map(({ key, name }) => (
              <th key={key} title={name}>
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.periodTitle}>
              <td className={shared.rowHeading} data-title="Semester">
                {semesterName(point)} · {point.periodTitle}
              </td>
              <td data-title="Rerata">{shownRerata(point.rerata)}</td>
              {MEDALI_VALUES.map(({ key, name }) => (
                <td key={key} data-title={name}>
                  {point.scores[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Riwayat per semester" in a student's detail: Rerata and the six
 * values of each assessed semester, the oldest first, as a line chart
 * and as a table of the same numbers. A student never assessed gets a
 * line saying so.
 */
export function ScoreHistoryView({
  points,
}: {
  points: readonly SemesterPoint[];
}) {
  if (points.length === 0) {
    return (
      <section className={shared.panel}>
        <h2 className={shared.heading}>Riwayat per semester</h2>
        <p className={shared.emptySection}>Belum ada riwayat.</p>
      </section>
    );
  }
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Riwayat per semester</h2>
        <Legend />
      </div>
      <HistoryChart points={points} />
      <HistoryTable points={points} />
    </section>
  );
}
