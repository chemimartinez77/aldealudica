import styles from "../styles/SearchResultsModal.module.css";

export default function SearchResultsModal({ results, onSelectGame, onClose }) {
  // Para cerrar si se hace click fuera del contenedor
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains(styles["modal-overlay"])) {
      onClose();
    }
  };

  return (
    <div className={styles["modal-overlay"]} onClick={handleOverlayClick}>
      <div className={styles["modal-content"]}>
        {/* Listado de resultados (sin título extra) */}
        <div className={styles["results-container"]}>
          {results.map((g) => (
            <div
              key={g.id}
              className={styles["result-item"]}
              onClick={() => onSelectGame(g)}
            >
              {g.image && (
                <img
                  src={g.image}
                  alt={g.name}
                  className={styles["result-image"]}
                />
              )}
              <span>
                {g.name} ({g.year})
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
