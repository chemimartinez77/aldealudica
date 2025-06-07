import styles from "../styles/ModalPartida.module.css";

export default function ReadOnlyInfo({
    title,
    description,
    partida,
    playerLimit,
    location,
    selectedGameDetails,
    setShowImagePreview,
}) {
    return (
        <div className={styles["read-only-info"]}>
            {selectedGameDetails?.image && (
                <img
                    src={selectedGameDetails.image}
                    alt={selectedGameDetails.name}
                    onClick={() => setShowImagePreview(true)}
                />
            )}
            <p>
                <strong>Título:</strong> {title}
            </p>
            <p>
                <strong>Descripción:</strong> {description}
            </p>
            <p>
                <strong>Fecha:</strong> {partida?.date}
            </p>
            <p>
                <strong>Horario:</strong> {partida?.startTime} – {partida?.endTime}
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
