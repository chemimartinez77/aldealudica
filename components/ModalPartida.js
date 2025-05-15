// components/ModalPartida.js
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    useDisclosure
} from "@chakra-ui/react";
import { useRef } from "react";

import { useState, useEffect } from "react";
import { FaTrash, FaSearch } from "react-icons/fa";
import locations from "../data/locations.json"; // ["Aldea Lúdica"]
import styles from "../styles/ModalPartida.module.css";
import SearchResultsModal from "./SearchResultsModal";
import ImagePreviewModal from "./ImagePreviewModal";
import { useRouter } from 'next/router'; // Importar useRouter
import { toast } from "react-toastify";
import { Button, HStack } from "@chakra-ui/react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { IconButton } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";


export default function ModalPartida({
    mode, // "create", "edit", "view", "join"
    partida,
    currentUserId,
    date,
    onClose,
    onSave,
    onDelete,
    isLoggedIn,
    isAdmin, // <- Añadido
}) {
    const router = useRouter(); // Usar useRouter para la navegación
    // Define the handleGoToDetails function
    const handleGoToDetails = () => {
        if (partida && partida.id) {
            router.push(`/partidas/${partida.id}`); // Redirigir a la página de detalles
        }
    };
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
    const [isSearching, setIsSearching] = useState(false);

    // Juego seleccionado
    const [selectedGame, setSelectedGame] = useState("");
    const [selectedGameDetails, setSelectedGameDetails] = useState(null);
    const [showImagePreview, setShowImagePreview] = useState(false);

    // Lista de participantes
    const [participants, setParticipants] = useState([]);

    // Popover para confirmar borrar partida
    const {
        isOpen: isAlertOpen,
        onOpen: openAlert,
        onClose: closeAlert
    } = useDisclosure();

    const cancelRef = useRef();
    const modalRef = useRef(); // <- Añadido para referenciar el contenedor modal

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
        setGameSearch(partida.game || "");
        if (partida.gameDetails) {
            setSelectedGameDetails(partida.gameDetails);
        } else if (partida.game && partida.game.trim() !== "") {
            // Si tenemos el nombre del juego pero no los detalles, intentamos buscarlos
            console.log("Buscando detalles para el juego:", partida.game);
            fetch(`/api/search-game-by-name?name=${encodeURIComponent(partida.game)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.game) {
                        console.log("Encontrados detalles del juego:", data.game);
                        setSelectedGameDetails(data.game);
                    }
                })
                .catch(err => console.error("Error al buscar detalles del juego:", err));
        }

        setParticipants(partida.participants || []);
    }, [partida]);

    useEffect(() => {
        // Si modo = edit/view/join y hay un ID, populamos
        if (
            (mode === "edit" || mode === "view" || mode === "join") &&
            partida?.id
        ) {
            fetch(`/api/partidas/${partida.id}`, {
                credentials: 'include' // Añadir esta línea
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.partida) {
                        setParticipants(data.partida.participants);
                        if (data.partida.gameDetails) {
                            setSelectedGameDetails(data.partida.gameDetails);
                        }
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
        setIsSearching(true); // Spinner ON
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
            );

            setSearchResults(uniqueResults);
            setShowSearchModal(true);
        } catch (err) {
            console.error(err);
            setSearchResults([]);
        } finally {
            setIsSearching(false); // Spinner OFF
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

        const action = isParticipant ? "leave" : "join";

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
                toast.error(`❌ Error al ${action === "join" ? "apuntarte" : "salirte"}: ${data.error}`);
            } else {
                setParticipants(data.partida.participants || []);
                toast.success(
                    action === "join"
                        ? `✅ Te has apuntado a "${partida.title}" el día ${partida.date} a las ${partida.startTime}.`
                        : `👋 Has salido de la partida "${partida.title}".`
                );
            }

        } catch (err) {
            console.error(err);
            toast.error("❌ Error interno al gestionar la participación.");
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

        // Copia de participantes
        let updatedParticipants = [...participants];

        // Buscar si el usuario actual ya está en la lista
        const currentIndex = updatedParticipants.findIndex((p) => {
            const id = p._id?.toString?.() ?? p?.toString?.();
            return id === currentUserId;
        });

        const isAlreadyIn = currentIndex !== -1;

        // Si el checkbox está marcado y el usuario no está, lo añadimos
        if ((isCreator || isAdmin) && creatorParticipates && !isAlreadyIn) {
            updatedParticipants.push(currentUserId);
        }

        // Si el checkbox está desmarcado y el usuario está, lo eliminamos
        if ((isCreator || isAdmin) && !creatorParticipates && isAlreadyIn) {
            updatedParticipants.splice(currentIndex, 1);
        }

        // Limpieza adicional: si el creador ha desmarcado el check, asegúrate de que no quede en la lista
        const creatorId = partida?.creatorId?.toString?.() ?? currentUserId?.toString?.();
        const cleanParticipants = updatedParticipants.filter((p) => {
            const id = p._id?.toString?.() ?? p?.toString?.();
            if (!creatorParticipates && id === creatorId) {
                return false;
            }
            return true;
        });


        const newPartida = {
            id: partida?.id,
            title,
            game: selectedGame || "",
            gameDetails: selectedGameDetails || null,
            description,
            date: formatDate(date || new Date(partida?.date)),
            startTime: `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`,
            endTime: `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`,
            playerLimit: pl,
            creatorParticipates,
            location,
            creatorId: currentUserId,
            participants: cleanParticipants,
        };

        onSave(newPartida);
    }

    function handleDeleteClick() {
        openAlert(); // Chakra se encarga de abrir el diálogo
    }

    // 3) Función que se llama al pulsar “Aceptar”
    function handleConfirmDelete() {
        if (!partida?.id) return;
        onDelete(partida.id);
        closeAlert(); // <-- ¡Este es el importante!
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

    return (
        <div className={styles["modal-overlay"]}>
            <div ref={modalRef} className={styles["modal-content"]}>
                {/* Botón de cierre (aspa) */}
                <IconButton
                    icon={<CloseIcon />}
                    aria-label="Cerrar"
                    onClick={onClose}
                    size="sm"
                    position="absolute"
                    top="10px"
                    right="10px"
                    borderRadius="full"
                    bg="gray.500"
                    color="white"
                    _hover={{ bg: "gray.700" }}
                    zIndex={10}
                />

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

                <div className={styles["modal-body"]}>
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
                                {isCreator && (
                                    <div className={styles["form-group"]}>
                                        <label>&nbsp;</label>
                                        <div>
                                            <input
                                                type="checkbox"
                                                id="creatorParticipates"
                                                checked={creatorParticipates}
                                                onChange={(e) => setCreatorParticipates(e.target.checked)}
                                                disabled={isFull}
                                            />
                                            <label htmlFor="creatorParticipates">
                                                Participaré en la partida
                                            </label>
                                        </div>
                                    </div>
                                )}

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
                        {/* Botón verde para unirse o cancelar inscripción */}
                        {(mode === "join" || (mode === "edit" && isAdmin && !isCreator)) &&
                            isLoggedIn &&
                            !isFull && (
                                isParticipant ? (
                                    <Button
                                        colorScheme="red"
                                        onClick={handleJoinPartida}
                                        rightIcon={<FaThumbsDown />}
                                        mr={2}
                                    >
                                        Ya no quiero jugar
                                    </Button>
                                ) : (
                                    <Button
                                        colorScheme="green"
                                        onClick={handleJoinPartida}
                                        rightIcon={<FaThumbsUp />}
                                        mr={2}
                                    >
                                        ¡Quiero jugar!
                                    </Button>
                                )
                            )}

                        {/* Botón "Cerrar" si view/join, "Cancelar" si create/edit
                        {mode === "view" || mode === "join" ? (
                            <Button onClick={onClose} colorScheme="gray" variant="outline">
                                Cerrar
                            </Button>
                        ) : (
                            <Button onClick={onClose} colorScheme="gray" variant="solid">
                                Cancelar
                            </Button>
                        )} */}

                        {/* Botón "Guardar" => create/edit */}
                        {(mode === "create" || mode === "edit") && (
                            <Button onClick={handleSaveClick} colorScheme="blue">
                                Guardar
                            </Button>
                        )}

                        {/* Botón eliminar => solo edit + eres el creador o admin */}
                        {mode === "edit" && (isCreator || isAdmin) && (
                            <IconButton
                                aria-label="Eliminar partida"
                                icon={<FaTrash />}
                                onClick={handleDeleteClick}
                                colorScheme="red"
                            />
                        )}
                        {/* Botón para ir a la página de detalles */}
                        <Button
                            onClick={handleGoToDetails}
                            colorScheme="blue"
                            mt={4}
                        >
                            Ver Detalles de la Partida
                        </Button>
                    </div>
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

                {isSearching && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-blue-100 p-6 rounded-lg text-center shadow-lg">
                            <p className="text-lg font-semibold text-gray-800">
                                Accediendo a la biblioteca de juegos...
                            </p>
                            <div className="mt-4">
                                <svg
                                    className="animate-spin h-8 w-8 text-blue-600 mx-auto"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8H4z"
                                    ></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            {isAlertOpen && (
                <AlertDialog
                    isOpen={isAlertOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={closeAlert}
                    isCentered
                    portalProps={{ containerRef: modalRef }} // <-- Aquí le decimos que no use body
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                Eliminar partida
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                ¿Estás seguro de que deseas eliminar la partida?
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={closeAlert}>
                                    Cancelar
                                </Button>
                                <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                                    Aceptar
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            )}


        </div>
    );
}
