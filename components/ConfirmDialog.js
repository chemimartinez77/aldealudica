import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../styles/ConfirmDialog.module.css';

export default function ConfirmDialog({ isOpen, title = 'Confirmar', message = '', confirmText = 'Sí', cancelText = 'Cancelar', onConfirm, onCancel }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`}>
            <div className={styles.dialog}>
                <h2>{title}</h2>
                <p>{message}</p>
                <div style={{ marginTop: '1.5rem' }}>
                    <button className={`${styles.cancel}`} onClick={onCancel}>{cancelText}</button>
                    <button className={`${styles.confirm}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>,
        document.body
    );
}