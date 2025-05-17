// pages/partidas/[id]/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getSession } from 'next-auth/react';
import { Eye, Trash2 } from 'lucide-react'; // <-- Importamos iconos
import styles from '../../../styles/PartidaDetails.module.css';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Layout from '../../../components/Layout'; // Importamos el componente Layout

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
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h1 className={styles.cardTitle}>{partida.title}</h1>
                        <button
                            onClick={handleSave}
                            className={`${styles.button} ${styles.headerSaveButton}`}
                        >
                            Guardar resultados
                        </button>
                    </div>

                    {/* Info general */}
                    <div className={styles.cardBody}>
                        <div className={styles.detailsGrid}>
                            <div>
                                <h2 className={styles.sectionTitle}>Detalles de la partida</h2>
                                <div className={styles.detailItem}>
                                    <p className={styles.detailLabel}>Fecha:</p>
                                    <p>{formatDate(partida.date)}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <p className={styles.detailLabel}>Horario:</p>
                                    <p>
                                        {partida.startTime} - {partida.endTime}
                                    </p>
                                </div>
                                <div className={styles.detailItem}>
                                    <p className={styles.detailLabel}>Ubicación:</p>
                                    <p>{partida.location}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <p className={styles.detailLabel}>Límite de jugadores:</p>
                                    <p>{partida.playerLimit}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <p className={styles.detailLabel}>Participantes:</p>
                                    <p>
                                        {partida.participants.length} / {partida.playerLimit}
                                    </p>
                                    <ul className="list-disc pl-5 mt-1">
                                        {partida.participants.map((participant) => (
                                            <li key={participant._id}>{participant.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div>
                                {partida.gameDetails?.image && (
                                    <div
                                        className={styles.imageContainer}
                                        onClick={() => window.open(partida.gameDetails.image, '_blank')}
                                        style={{ cursor: 'pointer' }}
                                        title="Haz clic para ver la imagen completa"
                                    >
                                        <Image
                                            src={partida.gameDetails.image}
                                            alt={partida.title}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                )}

                                {partida.description && (
                                    <div className={styles.detailItem}>
                                        <p className={styles.detailLabel}>Descripción:</p>
                                        <p>{partida.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

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
                        {partida.participants.map((participant) => (
                            <div key={participant._id} className={styles.inputGroup}>
                                <span className={styles.detailLabel}>{participant.name}</span>
                                <input
                                    type="number"
                                    value={
                                        scores.find((s) => s.player === participant._id)?.score || 0
                                    }
                                    onChange={(e) => {
                                        const newScores = [...scores];
                                        const index = newScores.findIndex(
                                            (s) => s.player === participant._id
                                        );
                                        if (index >= 0) {
                                            newScores[index].score = e.target.value;
                                        } else {
                                            newScores.push({
                                                player: participant._id,
                                                score: e.target.value,
                                            });
                                        }
                                        setScores(newScores);
                                    }}
                                    className={`
                                        ${styles.input}
                                        ${styles.numberInput}
                                        ${highlightedInputs ? styles.highlighted : ""}
                                        ${fadeInputs ? styles.fadeout : ""}
                                      `}
                                      
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Imágenes */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Imágenes</h2>
                    </div>
                    <div className={styles.cardBody}>
                        {/* Mapeo de imágenes */}
                        <div className={styles.imagesGrid}>
                            {images && images.length > 0 ? (
                                images
                                    .filter((image) => !image.isDeleted) // ocultar las eliminadas
                                    .map((image, index) => {
                                        const imageUrl = typeof image === 'string' ? image : image.url;
                                        // Corrige esta línea - verifica si el publicId coincide con fadingImageId
                                        const isFading = fadingImageId && image.publicId === fadingImageId;

                                        return (
                                            <div key={index} className={styles.imageBox}>
                                                <div className={`${styles.imageWrapper} ${isFading ? styles.fadingImage : ''}`}>
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`Imagen ${index + 1}`}
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                    {/* Overlay con iconos */}
                                                    <div className={styles.imageOverlay}>
                                                        <button
                                                            className={styles.imageActionButton}
                                                            onClick={() => window.open(imageUrl, '_blank')}
                                                            title="Ver imagen en grande"
                                                        >
                                                            <Eye size={20} />
                                                        </button>
                                                        <button
                                                            className={styles.imageActionButton}
                                                            onClick={() => handleDeleteImage(image.publicId)}
                                                            title="Eliminar lógicamente la imagen"
                                                            disabled={isFading}
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <p className="text-gray-500">No hay imágenes para mostrar</p>
                            )}
                        </div>
                        <div className={styles.uploadContainer}>
                            <label htmlFor="image-upload" className={styles.uploadButton} disabled={uploading}>
                                <span className={styles.uploadIcon}>+</span>
                                Subir imágenes
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className={styles.hiddenFileInput}
                            />
                            {uploading && (
                                <div className={styles.uploadingIndicator}>
                                    <div className={styles.uploadingSpinner}></div>
                                    Subiendo imágenes...
                                </div>
                            )}
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
