import styles from "./own-room-line.module.css";

/**
 * Where a resident lives, at the top of an Asrama tab's content. It is not
 * the tab's description, so it does not move the tab bar.
 */
export function OwnRoomLine({ room }: { room: string | null }) {
  if (room === null) return null;
  return <p className={styles.ownRoom}>{room}</p>;
}
