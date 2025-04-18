import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/SessionTimeout.module.css';

export default function SessionTimeout() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>A la aldea no se viene a pasar el rato 😅</h1>
                <p className={styles.message}>
                    Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente para continuar.
                </p>
                <div className={styles.actions}>
                    <Link href="/login">
                        <span className={styles.loginButton}>Iniciar sesión</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}