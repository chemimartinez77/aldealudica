// components/ModalPartida.js
import { useState, useEffect } from "react";
import { FaTrash, FaSearch } from "react-icons/fa";
import locations from "../data/locations.json"; // ["Aldea Lúdica"]
import styles from "../styles/ModalPartida.module.css";
import SearchResultsModal from "./SearchResultsModal";
import ImagePreviewModal from "./ImagePreviewModal";

export default function ModalPartida({
    mode, // "create", "edit", "view", "join"
    partida,
    currentUserId,
    date,
    onClose,
    onSave,
    onDelete,
    isLoggedIn,
}) {
    // Campos del formulario
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [playerLimit, setPlayerLimit] = useState(4);
    const [creatorParticipates, setCreatorParticipates] = useState(true);
    const [location, setLocation] = useState("Aldea Lúdica");
    const [startHour, setStartHour] = useState("14");
    const [startMinute, setStartMinute] = useState("00");
    const [endHour, setEndHour] = useState("16");
    const [endMinute, setEndMinute] = useState("00");

    // Búsqueda de juego
    const [gameSearch, setGameSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Juego seleccionado
    const [selectedGame, setSelectedGame] = useState("");
    const [selectedGameDetails, setSelectedGameDetails] = useState(null);
    const [showImagePreview, setShowImagePreview] = useState(false);

    // Lista de participantes
    const [participants, setParticipants] = useState([]);

    // Popover para confirmar apuntarse
    const [showJoinPopover, setShowJoinPopover] = useState(false);
    const [joinMessage, setJoinMessage] = useState("");

    // Popover para confirmar borrar partida
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!partida) {
            // Reset en modo create
            setTitle("");
            setDescription("");
            setPlayerLimit(4);
            setCreatorParticipates(true);
            setLocation("Aldea Lúdica");
            setStartHour("14");
            setStartMinute("00");
            setEndHour("16");
            setEndMinute("00");
            setSelectedGame("");
            setSelectedGameDetails(null);
            setParticipants([]);
            return;
        }

        setTitle(partida.title || "");
        setDescription(partida.description || "");
        setPlayerLimit(partida.playerLimit || 4);
        setCreatorParticipates(partida.creatorParticipates ?? true);
        setLocation(partida.location || "Aldea Lúdica");

        // Hora de inicio
        if (
            typeof partida.startHour === "string" &&
            typeof partida.startMinute === "string"
        ) {
            setStartHour(partida.startHour);
            setStartMinute(partida.startMinute);
        } else if (partida.startTime) {
            const [sh, sm] = partida.startTime.split(":");
            setStartHour(sh);
            setStartMinute(sm);
        } else {
            setStartHour("14");
            setStartMinute("00");
        }

        // Hora de fin
        if (
            typeof partida.endHour === "string" &&
            typeof partida.endMinute === "string"
        ) {
            setEndHour(partida.endHour);
            setEndMinute(partida.endMinute);
        } else if (partida.endTime) {
            const [eh, em] = partida.endTime.split(":");
            setEndHour(eh);
            setEndMinute(em);
        } else {
            setEndHour("16");
            setEndMinute("00");
        }

        // Juego
        setSelectedGame(partida.game || "");
        if (partida.gameDetails) {
            setSelectedGameDetails(partida.gameDetails);
        }

        setParticipants(partida.participants || []);
    }, [partida]);

    useEffect(() => {
        // Si modo = edit/view/join y hay un ID, populamos
        if (
            (mode === "edit" || mode === "view" || mode === "join") &&
            partida?.id
        ) {
            fetch(`/api/partidas/${partida.id}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.partida) {
                        setParticipants(data.partida.participants);
                    }
                })
                .catch((err) => console.error(err));
        }
    }, [mode, partida]);

    const isFull = participants.length >= playerLimit;
    const isCreator = partida?.creatorId === currentUserId;
    const isParticipant = participants.some((p) => {
        if (p._id) {
            return p._id.toString() === currentUserId;
        }
        return p.toString() === currentUserId;
    });

    // Búsqueda de juegos
    async function handleSearchClick() {
        if (!gameSearch || gameSearch.length < 3) {
            alert("Escribe al menos 3 caracteres para buscar.");
            return;
        }
        try {
            const res = await fetch(
                `/api/search-bgg?query=${encodeURIComponent(gameSearch)}`
            );
            const data = await res.json();
            if (data.error) {
                console.error("Error en la búsqueda:", data.error);
                setSearchResults([]);
                return;
            }
            const uniqueResults = Array.from(
                new Map(data.results.map((item) => [item.id, item])).values()
            ).slice(0, 15);

            setSearchResults(uniqueResults);
            setShowSearchModal(true);
        } catch (err) {
            console.error(err);
            setSearchResults([]);
        }
    }

    function handleSelectGame(game) {
        setGameSearch(game.name);
        setSelectedGame(game.name);
        setTitle(game.name);

        setShowSearchModal(false);
        loadGameDetails(game.id);
    }

    async function loadGameDetails(bggId) {
        try {
            const res = await fetch(`/api/game-details?bggId=${bggId}`);
            const data = await res.json();
            if (data.error) {
                console.error(
                    "Error al cargar detalles del juego:",
                    data.error
                );
                setSelectedGameDetails(null);
                return;
            }
            setSelectedGameDetails(data.details);
        } catch (err) {
            console.error(err);
            setSelectedGameDetails(null);
        }
    }

    // -- Manejar "Apuntarse a la partida" --
    async function handleJoinPartida() {
        if (!isLoggedIn) return;

        try {
            const res = await fetch("/api/partidas/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    partidaId: partida.id,
                    userId: currentUserId,
                }),
            });

            const data = await res.json();

            if (data.error) {
                // Si hay error, lo mostramos en el popover
                setJoinMessage("Error al apuntarse: " + data.error);
            } else {
                // 1) Se actualizan los participantes inmediatamente
                setParticipants(data.partida.participants || []);

                // 2) Se muestra el mensaje en el popover
                setJoinMessage(
                    `Acabas de apuntarte a "${partida.title}" el día ${partida.date} a las ${partida.startTime}.`
                );
            }

            // Abre el popover
            setShowJoinPopover(true);
        } catch (err) {
            console.error(err);
            setJoinMessage("Error interno al apuntarse.");
            setShowJoinPopover(true);
        }
    }

    // Guardar / Eliminar
    function handleSaveClick() {
        const errors = [];
        if (!title) errors.push("Título");

        const start = parseInt(startHour) * 60 + parseInt(startMinute);
        const end = parseInt(endHour) * 60 + parseInt(endMinute);
        if (end <= start) {
            errors.push("Hora fin <= Hora inicio");
        }

        const pl = parseInt(playerLimit);
        if (pl < 2 || pl > 50) {
            errors.push("Límite de jugadores fuera de rango");
        }

        if (!location) errors.push("Ubicación");

        if (errors.length > 0) {
            alert(
                "Faltan o son inválidos los siguientes campos: " +
                    errors.join(", ")
            );
            return;
        }

        const newPartida = {
            id: partida?.id,
            title,
            game: selectedGame || "",
            gameDetails: selectedGameDetails || null,
            description,
            date: formatDate(date || new Date(partida?.date)),
            startTime: `${startHour.padStart(2, "0")}:${startMinute.padStart(
                2,
                "0"
            )}`,
            endTime: `${endHour.padStart(2, "0")}:${endMinute.padStart(
                2,
                "0"
            )}`,
            playerLimit: pl,
            creatorParticipates,
            location,
            creatorId: currentUserId,
            participants,
        };
        onSave(newPartida);
    }

    function handleDeleteClick() {
        if (!partida?.id) return;
        setShowDeleteConfirm(true);
    }

    // 3) Función que se llama al pulsar “Aceptar”
    function handleConfirmDelete() {
        if (!partida?.id) return;
        onDelete(partida.id); // Llama a tu prop onDelete para eliminar
        setShowDeleteConfirm(false);
    }

    function formatDate(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    // Render de info en solo lectura (para view/join)
    function renderReadOnlyInfo() {
        return (
            <div className={styles["read-only-info"]}>
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
                    <strong>Horario:</strong> {partida?.startTime} –{" "}
                    {partida?.endTime}
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

    const isFormMode = mode === "create" || mode === "edit";
    const isReadOnlyMode = mode === "view" || mode === "join";

    // Debug: verifica el modo y condiciones
    useEffect(() => {
        console.log("ModalPartida debug =>", {
            mode,
            isLoggedIn,
            isCreator,
            isParticipant,
            isFull,
            creatorId: partida?.creatorId,
            currentUserId,
            participants,
        });
    }, [
        mode,
        isLoggedIn,
        isCreator,
        isParticipant,
        isFull,
        partida?.creatorId,
        currentUserId,
        participants,
    ]);

    return (
        <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
                {/* Encabezado: puedes eliminar o modificar según prefieras */}
                {/* Encabezado con franja azul */}
                <div className={styles["modal-header"]}>
                    {mode === "view" && (
                        <h2>
                            <b>Detalles de la partida</b>
                        </h2>
                    )}
                    {mode === "edit" && (
                        <h2>
                            <b>Editar Partida</b>
                        </h2>
                    )}
                    {mode === "create" && (
                        <h2>
                            <b>Crear Partida</b>
                        </h2>
                    )}
                    {
                        mode === "join" && (
                            <h2>
                                <b>Unirte a la partida</b>
                            </h2>
                        ) /* <-- */
                    }
                </div>

                {/* PARTICIPANTES */}
                <div className={styles["form-group"]}>
                    <p>
                        Participantes: {participants.length} / {playerLimit}
                    </p>
                    <ul>
                        {participants.map((p) => {
                            if (typeof p === "string") {
                                return <li key={p}>Usuario {p}</li>;
                            } else if (p?._id) {
                                return (
                                    <li key={p._id}>
                                        {p.name ||
                                            p.email ||
                                            `Usuario ${p._id}`}
                                    </li>
                                );
                            }
                            return <li key={"desconocido"}>Desconocido</li>;
                        })}
                    </ul>
                </div>

                {/* FORM (create/edit) */}
                {isFormMode && (
                    <form>
                        <div
                            className={`${styles["form-group"]} ${styles["col-span-2"]}`}
                        >
                            <label>Elige un juego (opcional)</label>
                            <div className={styles["search-input-wrapper"]}>
                                <div
                                    className={styles["search-input-container"]}
                                >
                                    <input
                                        type="text"
                                        placeholder="Escribe el nombre del juego"
                                        value={gameSearch}
                                        onChange={(e) =>
                                            setGameSearch(e.target.value)
                                        }
                                        disabled={isFull}
                                        className={styles["search-input"]}
                                    />
                                    <FaSearch
                                        className={styles["search-icon"]}
                                        onClick={() =>
                                            !isFull && handleSearchClick()
                                        }
                                    />
                                </div>

                                {selectedGameDetails?.image && (
                                    <img
                                        src={selectedGameDetails.image}
                                        alt={selectedGameDetails.name}
                                        className={
                                            styles["selected-game-cover"]
                                        }
                                        onClick={() =>
                                            setShowImagePreview(true)
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        <div className={styles["form-group"]}>
                            <label>Título de la partida</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isFull}
                            />
                        </div>

                        <div className={styles["form-group"]}>
                            <label>Descripción de la partida</label>
                            <textarea
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isFull}
                            />
                        </div>

                        <div className={styles["form-group"]}>
                            <label>Hora de inicio</label>
                            <div style={{ display: "flex", gap: "0.2rem" }}>
                                <select
                                    value={startHour}
                                    onChange={(e) =>
                                        setStartHour(e.target.value)
                                    }
                                    disabled={isFull}
                                >
                                    {Array.from({ length: 24 }).map((_, i) => {
                                        const val = String(i).padStart(2, "0");
                                        return (
                                            <option key={val} value={val}>
                                                {val}
                                            </option>
                                        );
                                    })}
                                </select>
                                :
                                <select
                                    value={startMinute}
                                    onChange={(e) =>
                                        setStartMinute(e.target.value)
                                    }
                                    disabled={isFull}
                                >
                                    {["00", "15", "30", "45"].map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles["form-group"]}>
                            <label>Hora de fin</label>
                            <div style={{ display: "flex", gap: "0.2rem" }}>
                                <select
                                    value={endHour}
                                    onChange={(e) => setEndHour(e.target.value)}
                                    disabled={isFull}
                                >
                                    {Array.from({ length: 24 }).map((_, i) => {
                                        const val = String(i).padStart(2, "0");
                                        return (
                                            <option key={val} value={val}>
                                                {val}
                                            </option>
                                        );
                                    })}
                                </select>
                                :
                                <select
                                    value={endMinute}
                                    onChange={(e) =>
                                        setEndMinute(e.target.value)
                                    }
                                    disabled={isFull}
                                >
                                    {["00", "15", "30", "45"].map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles["form-group"]}>
                            <label>Límite de jugadores</label>
                            <input
                                type="number"
                                min="2"
                                max="50"
                                value={playerLimit}
                                onChange={(e) => setPlayerLimit(e.target.value)}
                                disabled={isFull}
                            />
                        </div>

                        <div className={styles["form-group"]}>
                            <label>&nbsp;</label>
                            <div>
                                <input
                                    type="checkbox"
                                    id="creatorParticipates"
                                    checked={creatorParticipates}
                                    onChange={(e) =>
                                        setCreatorParticipates(e.target.checked)
                                    }
                                    disabled={isFull}
                                />
                                <label htmlFor="creatorParticipates">
                                    Participaré en la partida
                                </label>
                            </div>
                        </div>

                        <div className={styles["form-group"]}>
                            <label>Dónde será la partida</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={isFull}
                            >
                                {locations.map((loc) => (
                                    <option key={loc} value={loc}>
                                        {loc}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </form>
                )}

                {/* Modo solo lectura (view/join) */}
                {isReadOnlyMode && renderReadOnlyInfo()}

                {/* BOTONES */}
                <div className={styles["modal-actions"]}>
                    {/* Botón verde para unirse => SOLO modo "join" */}
                    {mode === "join" &&
                        isLoggedIn &&
                        !isCreator &&
                        !isParticipant &&
                        !isFull && (
                            <button
                                type="button"
                                onClick={handleJoinPartida}
                                style={{
                                    backgroundColor: "#28a745",
                                    color: "#fff",
                                    border: "none",
                                    padding: "8px 12px",
                                    marginRight: "8px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                ¡Apúntame a la partida!
                            </button>
                        )}

                    {/* Botón "Cerrar" si view/join, "Cancelar" si create/edit */}
                    {mode === "view" || mode === "join" ? (
                        <button
                            type="button"
                            className={styles["cancel-button"]}
                            onClick={onClose}
                        >
                            Cerrar
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles["cancel-button"]}
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                    )}

                    {/* Botón "Guardar" => create/edit */}
                    {(mode === "create" || mode === "edit") && (
                        <button type="button" onClick={handleSaveClick}>
                            Guardar
                        </button>
                    )}

                    {/* Botón eliminar => solo edit + eres el creador */}
                    {mode === "edit" && isCreator && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className={styles["delete-button"]}
                        >
                            <FaTrash />
                        </button>
                    )}
                </div>

                {/* Modal con resultados de búsqueda */}
                {showSearchModal && (
                    <SearchResultsModal
                        results={searchResults}
                        onSelectGame={handleSelectGame}
                        onClose={() => setShowSearchModal(false)}
                    />
                )}

                {/* Popup para ver la imagen en grande */}
                {showImagePreview && selectedGameDetails?.image && (
                    <ImagePreviewModal
                        image={selectedGameDetails.image}
                        onClose={() => setShowImagePreview(false)}
                    />
                )}

                {/* Popover tras unirse */}
                {showJoinPopover && (
                    <div className={styles["popover-overlay"]}>
                        <div className={styles["popover-content"]}>
                            <p>{joinMessage}</p>
                            <button
                                className={styles["cancel-button"]} // <--- Usa la clase que quieras
                                onClick={() => setShowJoinPopover(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className={styles["delete-overlay"]}>
                        <div className={styles["delete-content"]}>
                            <p>
                                ¿Estás seguro de que deseas eliminar la partida?
                            </p>
                            <div className={styles["delete-buttons"]}>
                                <button
                                    className={styles["delete-confirm-button"]}
                                    onClick={handleConfirmDelete}
                                >
                                    Aceptar
                                </button>
                                <button
                                    className={styles["delete-cancel-button"]}
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
