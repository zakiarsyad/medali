"use client";

import { type FormEvent, useState, useTransition } from "react";
import { DORM_NAMES, type DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { ChangeButton } from "./change-button";
import styles from "./cleaning.module.css";
import {
  removeCleaningPlaceAction,
  renameCleaningPlaceAction,
  restoreCleaningPlaceAction,
} from "./cleaning-actions";
import { PLACE_NAME_MAX_LENGTH } from "./cleaning-ids";
import { AddPlaceForm } from "./cleaning-place-form";
import type { CleaningPlace } from "./cleaning-place-list";

/** The places of one dorm, with the number of its rooms with residents. */
export interface DormPlaces {
  dorm: DormId;
  places: CleaningPlace[];
  rooms: number;
}

/** What the board says after a change. */
interface Said {
  text: string;
  /** The place "Urungkan" brings back, after a removal only. */
  removedId: string | null;
}

function RenameForm({
  place,
  onClose,
  onSaid,
}: {
  place: CleaningPlace;
  onClose: () => void;
  onSaid: (said: Said) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    startSending(async () => {
      const after = await renameCleaningPlaceAction(
        place.id,
        typeof name === "string" ? name : "",
      );
      setError(after.error);
      if (!after.done) return;
      onSaid({ text: after.done, removedId: null });
      onClose();
    });
  }

  return (
    <form onSubmit={save} className={styles.renameForm} noValidate>
      <input
        name="name"
        className={shared.input}
        defaultValue={place.name}
        maxLength={PLACE_NAME_MAX_LENGTH}
        aria-label={`Nama baru ${place.name}`}
      />
      <button type="submit" className={shared.link} disabled={pending}>
        Simpan
      </button>
      <button type="button" className={shared.link} onClick={onClose}>
        Batal
      </button>
      <FormMessage state={{ error, done: null }} />
    </form>
  );
}

function PlaceItem({
  place,
  mayManage,
  onSaid,
}: {
  place: CleaningPlace;
  mayManage: boolean;
  onSaid: (said: Said) => void;
}) {
  const [isRenaming, setRenaming] = useState(false);
  if (isRenaming) {
    return (
      <li className={styles.place}>
        <RenameForm
          place={place}
          onClose={() => setRenaming(false)}
          onSaid={onSaid}
        />
      </li>
    );
  }
  return (
    <li className={styles.place}>
      <span>{place.name}</span>
      {mayManage && (
        <div className={styles.placeActions}>
          <button
            type="button"
            className={shared.link}
            onClick={() => setRenaming(true)}
          >
            Ubah
          </button>
          <ChangeButton
            send={() => removeCleaningPlaceAction(place.id)}
            question={`Hapus tempat ${place.name}? Jadwal sebelum hari ini tetap tersimpan.`}
            look={shared.danger}
            onDone={(text) => onSaid({ text, removedId: place.id })}
          >
            Hapus
          </ChangeButton>
        </div>
      )}
    </li>
  );
}

function DormBox({
  group,
  mayManage,
  onSaid,
}: {
  group: DormPlaces;
  mayManage: boolean;
  onSaid: (said: Said) => void;
}) {
  return (
    <li className={styles.box}>
      <b>{DORM_NAMES[group.dorm]}</b>
      <ul className={styles.places}>
        {group.places.map((place) => (
          <PlaceItem
            key={place.id}
            place={place}
            mayManage={mayManage}
            onSaid={onSaid}
          />
        ))}
        {group.places.length === 0 && (
          <li className={shared.emptySection}>Belum ada tempat.</li>
        )}
      </ul>
      <span className={styles.quiet}>
        + {group.rooms.toLocaleString("id-ID")} kamar penghuni
      </span>
    </li>
  );
}

/**
 * Tempat pembersihan: the places of each dorm shown, and for an account
 * that may change them "Ubah", "Hapus" and the form that adds one. The
 * message of a removal stays here with "Urungkan", as the place itself
 * leaves the list.
 */
export function CleaningPlacesBoard({
  groups,
  mayManage,
  formDorm,
}: {
  groups: DormPlaces[];
  /** Whether the account may change the places, or only see them. */
  mayManage: boolean;
  /** The dorm the form that adds a place starts on. */
  formDorm: DormId;
}) {
  const [said, setSaid] = useState<Said | null>(null);
  return (
    <>
      <ul className={styles.boxes}>
        {groups.map((group) => (
          <DormBox
            key={group.dorm}
            group={group}
            mayManage={mayManage}
            onSaid={setSaid}
          />
        ))}
      </ul>
      {said && (
        <div className={styles.said} role="status">
          <span className={shared.done}>{said.text}</span>
          {said.removedId && (
            <ChangeButton
              send={() => restoreCleaningPlaceAction(said.removedId ?? "")}
              question={null}
              look={shared.link}
              onDone={(text) => setSaid({ text, removedId: null })}
            >
              Urungkan
            </ChangeButton>
          )}
        </div>
      )}
      {mayManage && <AddPlaceForm formDorm={formDorm} />}
    </>
  );
}
