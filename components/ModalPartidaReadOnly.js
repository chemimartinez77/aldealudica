// components/ModalPartidaReadOnly.js
import React from "react";
import styles from "../styles/ModalPartida.module.css";

/**
 * Read-only view for "Partida" (used in "view" and "join" modes).
 * Shows game cover, key info and schedule.
 *
 * NOTE: All comments are in English as requested.
 */
export default function ModalPartidaReadOnly({
  selectedGameDetails,
  title,
  description,
  dateLabel,
  startTimeLabel,
  endTimeLabel,
  playerLimit,
  location,
  onImageClick,
}) {
  return (
    <div className={styles["read-only-info"]}>
      {selectedGameDetails?.image && (
        <img
          src={selectedGameDetails.image}
          alt={selectedGameDetails.name}
          onClick={onImageClick}
        />
      )}
      <p>
        <strong>Título:</strong> {title}
      </p>
      <p>
        <strong>Descripción:</strong> {description}
      </p>
      <p>
        <strong>Fecha:</strong> {dateLabel}
      </p>
      <p>
        <strong>Horario:</strong> {startTimeLabel} – {endTimeLabel}
      </p>
      <p>
        <strong>Límite de jugadores:</strong> {playerLimit}
      </p>
      <p>
        <strong>Ubicación:</strong> {location}
      </p>
    </div>
  );
}
