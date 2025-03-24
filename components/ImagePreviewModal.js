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
                <button
                    className={styles["close-button"]}
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    ×
                </button>
                <img
                    src={image}
                    alt="Vista previa"
                    className={styles["preview-image"]}
                />
            </div>
        </div>
    );
}
