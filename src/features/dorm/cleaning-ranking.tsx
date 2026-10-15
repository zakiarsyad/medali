import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./cleaning.module.css";
import { type CleaningParams, cleaningAddress } from "./cleaning-address";
import { rankNumber, scoreOf, scoreWords } from "./cleaning-assessment";
import { RANKING_PAGE_SIZE } from "./cleaning-ids";
import { roomWords } from "./cleaning-rows";
import type { RankingPage, RoomScore } from "./cleaning-scores";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** How a Skor looks: good above 0, bad below it. */
function scoreLook(score: number): string | undefined {
  if (score > 0) return styles.good;
  if (score < 0) return styles.poor;
  return undefined;
}

function ScoreRow({ room, rank }: { room: RoomScore; rank: number }) {
  const score = scoreOf(room.plus, room.minus);
  return (
    <tr>
      <td data-title="No">{shown(rank)}</td>
      <td className={shared.rowHeading} data-title="Kamar">
        {roomWords(room.number)} · {DORM_SHORT_NAMES[room.dorm]}
      </td>
      <td data-title="+">{shown(room.plus)}</td>
      <td data-title="−">{shown(room.minus)}</td>
      <td data-title="Skor">
        <b className={scoreLook(score)}>{scoreWords(score)}</b>
      </td>
    </tr>
  );
}

/**
 * "Skor kebersihan kamar": the rooms of the dorms shown with a validated
 * result, best first, a page at a time. It shows rooms by number only,
 * never a student.
 */
export function CleaningRanking({
  ranking,
  params,
  today,
}: {
  ranking: RankingPage;
  params: CleaningParams;
  today: string;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <h2 className={`${shared.heading} ${styles.title}`}>
          Skor kebersihan kamar
        </h2>
        <span className={styles.sub}>+1 memenuhi, −1 tidak memenuhi</span>
      </div>
      {ranking.matching === 0 ? (
        <p className={shared.empty}>Belum ada penilaian yang divalidasi.</p>
      ) : (
        <>
          <div className={shared.tableWrap}>
            <table className={`${shared.table} ${shared.stacked}`}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kamar</th>
                  <th>+</th>
                  <th>−</th>
                  <th>Skor</th>
                </tr>
              </thead>
              <tbody>
                {ranking.rooms.map((room, index) => (
                  <ScoreRow
                    key={room.roomId}
                    room={room}
                    rank={rankNumber(ranking.page, RANKING_PAGE_SIZE, index)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <ListPager
            page={ranking.page}
            matching={ranking.matching}
            pageSize={RANKING_PAGE_SIZE}
            noun="kamar"
            keepsPlace
            stepsOnOnePage={false}
            addressOf={(scorePage) =>
              cleaningAddress({ ...params, scorePage }, today)
            }
          />
        </>
      )}
    </section>
  );
}
