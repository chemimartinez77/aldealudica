import styles from "../styles/ImagePreviewModal.module.css";

export default function ImagePreviewModal({ image, onClose }) {
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains(styles["modal-overlay"])) {
      onClose();
    }
  };

  return (
    <div className={styles["modal-overlay"]} onClick={handleOverlayClick}>
      <div className={styles["modal-content"]}>
        <img
          src={image}
          alt="Vista previa"
          style={{ maxWidth: "90vw", maxHeight: "90vh" }}
        />
        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
