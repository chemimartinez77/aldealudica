// pages/partidas/[id]/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getSession } from 'next-auth/react';
import { Eye, Trash2 } from 'lucide-react'; // <-- Importamos iconos
import styles from '../../../styles/PartidaDetails.module.css';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Layout from '../../../components/Layout'; // Importamos el componente Layout
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaUser, FaDice } from "react-icons/fa";

export default function PartidaPage() {
    const router = useRouter();
    const { id } = router.query;

    const [partida, setPartida] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [scores, setScores] = useState([]);
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [imageToDelete, setImageToDelete] = useState(null);
    const [highlightedInputs, setHighlightedInputs] = useState(false);
    const [fadeInputs, setFadeInputs] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success"); // "success" | "error"


    useEffect(() => {
        if (id) fetchPartida();
    }, [id]);

    const fetchPartida = async () => {
        try {
            const res = await fetch(`/api/partidas/${id}`, {
                credentials: 'include',
            });
            const data = await res.json();

            if (!data.partida) {
                router.push('/');
                return;
            }

            setPartida(data.partida);
            setScores(data.partida.scores || []);
            setHours(data.partida.realDuration?.hours || 0);
            setMinutes(data.partida.realDuration?.minutes || 0);
            setImages(data.partida.images || []);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        setUploading(true);

        try {
            // Subimos cada archivo a /api/upload
            const uploadedImages = await Promise.all(
                files.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('partidaId', id);

                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                        headers: {
                            "X-CSRF-Token": document.cookie
                                .split("; ")
                                .find((row) => row.startsWith("__Host-next-auth.csrf-token"))
                                ?.split("=")[1] || "",
                        },
                    });
                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.error || "Error al subir la imagen");
                    }
                    return await res.json();
                })
            );

            if (uploadedImages.length > 0) {
                // Creamos el array de { url, publicId }
                const newImages = uploadedImages.map((img) => ({
                    url: img.url,
                    publicId: img.public_id || img.publicId,
                }));

                // POST a /api/partidas/[id]/images para guardarlas en la partida
                const updateRes = await fetch(`/api/partidas/${id}/images`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": document.cookie
                            .split("; ")
                            .find((row) => row.startsWith("__Host-next-auth.csrf-token"))
                            ?.split("=")[1] || "",
                    },
                    credentials: 'include',
                    body: JSON.stringify({ images: newImages }),
                });
                const result = await updateRes.json();
                if (result.success) {
                    setImages(result.images);
                }
            }
        } catch (error) {
            console.error('Error uploading images:', error);
        } finally {
            setUploading(false);
        }
    };

    // Eliminar imagen (marcar isDeleted = true) con confirmación
    // Añade un estado para controlar qué imagen está en proceso de eliminación
    const [fadingImageId, setFadingImageId] = useState(null);

    // Modifica la función handleDeleteImage para incluir el efecto de fundido
    const handleDeleteImage = async (publicId) => {
        // Ya no aplicamos el fundido aquí, solo mostramos el diálogo
        setImageToDelete(publicId);
        setShowConfirmDialog(true);
    };

    const confirmDeleteImage = async () => {
        if (!imageToDelete) return;

        // Aplicamos el fundido después de la confirmación
        setFadingImageId(imageToDelete);
        setShowConfirmDialog(false);

        try {
            const res = await fetch(`/api/partidas/${id}/images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ publicId: imageToDelete }),
            });
            const updateResult = await res.json();

            if (updateResult.error) {
                alert('Error al eliminar la imagen: ' + updateResult.error);
                setFadingImageId(null); // Restaura la opacidad si hay error
            } else {
                // Espera a que la transición termine completamente antes de actualizar el estado
                setTimeout(() => {
                    setImages(updateResult.images);
                    setFadingImageId(null);
                }, 1800); // Asegúrate de que este tiempo sea mayor que la duración de la transición CSS
            }
        } catch (err) {
            console.error(err);
            alert('Error interno al eliminar la imagen.');
            setFadingImageId(null);
        } finally {
            setImageToDelete(null);
        }
    };

    const handleSave = async () => {
        try {
            const dataToSend = {
                realDuration: {
                    hours: parseInt(hours) || 0,
                    minutes: parseInt(minutes) || 0,
                },
                scores: scores.map(score => ({
                    player: score.player,
                    score: parseInt(score.score) || 0
                })),
                winner:
                    scores.length > 0
                        ? scores.reduce((prev, current) =>
                            (prev.score > current.score) ? prev : current
                        ).player
                        : null,
            };

            const res = await fetch(`/api/partidas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dataToSend),
            });

            if (res.ok) {
                await fetchPartida(); // recarga sin redirigir
                setHighlightedInputs(true);
                setFadeInputs(false);
                setTimeout(() => {
                    setFadeInputs(true); // lanza animación
                }, 2000);
                setTimeout(() => {
                    setHighlightedInputs(false); // limpia
                    setFadeInputs(false);
                }, 4000);
                setToastMessage("✅ Resultados guardados correctamente");
                setToastType("success");
                setTimeout(() => setToastMessage(""), 4000);

            } else {
                const errorData = await res.json().catch(() => ({}));
                setToastMessage("❌ " + (errorData.error || 'Error al guardar los resultados'));
                setToastType("error");
                setTimeout(() => setToastMessage(""), 4000);

            }
        } catch (error) {
            setToastMessage("❌ " + 'Error al guardar los resultados: ' + (error.message || 'Error desconocido'));
            setToastType("error");
            setTimeout(() => setToastMessage(""), 4000);
        }
    };

    if (loading)
        return (
            <div className={styles.spinner}>
                <div className={styles.spinnerCircle}></div>
            </div>
        );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Layout>
            {toastMessage && (
                <div className={`${styles.toast} ${styles[toastType]}`}>
                    {toastMessage}
                </div>
            )}
            <div className={styles.container}>
                {/* Nueva sección de Detalles */}
                <div className={styles.card}>
                    <div className={styles.gameImageBackground} 
                        style={{
                            backgroundImage: partida.gameDetails?.image
                                ? `url('${partida.gameDetails.image}')`
                                : "none"
                        }}>
                    </div>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Detalles</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <h1 className={styles.gameTitle}>{partida.title}</h1>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <FaCalendarAlt className={styles.icon} />
                                <span className={styles.detailLabel}>Fecha:</span>
                                <span className={styles.detailValue}>{formatDate(partida.date)}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <FaClock className={styles.icon} />
                                <span className={styles.detailLabel}>Horario:</span>
                                <span className={styles.detailValue}>
                                    {partida.startTime} - {partida.endTime}
                                </span>
                            </div>
                            <div className={styles.detailItem}>
                                <FaMapMarkerAlt className={styles.icon} />
                                <span className={styles.detailLabel}>Ubicación:</span>
                                <span className={styles.detailValue}>{partida.location}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <FaUser className={styles.icon} />
                                <span className={styles.detailLabel}>Límite:</span>
                                <span className={styles.detailValue}>{partida.playerLimit}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <FaUsers className={styles.icon} />
                                <span className={styles.detailLabel}>Participantes:</span>
                                <span className={styles.chipList}>
                                    {partida.participants.map((participant) => (
                                        <span key={participant._id} className={styles.chip}>
                                            {participant.name}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        </div>
                        <div className={styles.saveButtonContainer}>
                            <button
                                onClick={handleSave}
                                className={styles.saveButton}
                            >
                                Guardar resultados
                            </button>
                        </div>
                    </div>
                </div>
            
                {partida.description && (
                    <div className={styles.card}>
                        <div className={styles.cardBody}>
                            <div className={styles.detailLabel} style={{ marginBottom: 4 }}>Descripción:</div>
                            <div>{partida.description}</div>
                        </div>
                    </div>
                )}
                
                {/* Duración real */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Duración real</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.inputGroup}>
                            <div>
                                <label className={styles.detailLabel}>Horas</label>
                                <input
                                    type="number"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className={`
                                        ${styles.input}
                                        ${styles.numberInput}
                                        ${highlightedInputs ? styles.highlighted : ""}
                                        ${fadeInputs ? styles.fadeout : ""}
                                      `}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className={styles.detailLabel}>Minutos</label>
                                <input
                                    type="number"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className={`
                                        ${styles.input}
                                        ${styles.numberInput}
                                        ${highlightedInputs ? styles.highlighted : ""}
                                        ${fadeInputs ? styles.fadeout : ""}
                                      `}
                                    min="0"
                                    max="59"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Puntuaciones */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Puntuaciones</h2>
                    </div>
                    <div className={styles.cardBody}>
                        {scores.length === 0 ? (
                            <p>No hay puntuaciones registradas.</p>
                        ) : (
                            <div className={styles.scoresContainer}>
                                {scores.map((score, index) => (
                                    <div key={index} className={styles.scoreItem}>
                                        <div className={styles.playerName}>{score.player.name}</div>
                                        <input
                                            type="number"
                                            value={score.score}
                                            onChange={(e) => {
                                                const newScores = [...scores];
                                                newScores[index].score = e.target.value;
                                                setScores(newScores);
                                            }}
                                            className={`
                                                ${styles.input}
                                                ${styles.scoreInput}
                                                ${highlightedInputs ? styles.highlighted : ""}
                                                ${fadeInputs ? styles.fadeout : ""}
                                            `}
                                            min="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Imágenes */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Imágenes</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.imagesGrid}>
                            {images.filter(img => !img.isDeleted).map((image) => (
                                <div
                                    key={image.publicId}
                                    className={`${styles.imageContainer} ${fadingImageId === image.publicId ? styles.fadingImage : ''}`}
                                >
                                    <div className={styles.imageWrapper}>
                                        <img
                                            src={image.url}
                                            alt="Imagen de la partida"
                                            className={styles.image}
                                        />
                                        <div className={styles.imageActions}>
                                            <a
                                                href={image.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.imageActionButton}
                                            >
                                                <Eye size={16} />
                                            </a>
                                            <button
                                                onClick={() => handleDeleteImage(image.publicId)}
                                                className={styles.imageActionButton}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.uploadContainer}>
                            <label htmlFor="file-upload" className={styles.uploadButton} disabled={uploading}>
                                <span className={styles.uploadIcon}>📷</span>
                                {uploading ? 'Subiendo...' : 'Subir imágenes'}
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className={styles.hiddenFileInput}
                                disabled={uploading}
                            />
                        </div>
                    </div>
                </div>
            </div>

        <ConfirmDialog
            isOpen={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            onCancel={() => setShowConfirmDialog(false)}
            onConfirm={confirmDeleteImage}
            title="Confirmar eliminación"
            description="¿Estás seguro de que deseas eliminar esta imagen?"
        />
    </Layout>
);
}

export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
}
