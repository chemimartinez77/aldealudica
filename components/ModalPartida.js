// components/ModalPartida.js
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Button,
  IconButton,
  Icon,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { FaTrash, FaSearch, FaThumbsUp, FaThumbsDown, FaWhatsapp } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import styles from "../styles/ModalPartida.module.css";
import locations from "../data/locations.json";
import SearchResultsModal from "./SearchResultsModal";
import ImagePreviewModal from "./ImagePreviewModal";

// New child components
import ModalPartidaForm from "./ModalPartidaForm";
import ModalPartidaReadOnly from "./ModalPartidaReadOnly";

export default function ModalPartida({
  mode,             // "create" | "edit" | "view" | "join"
  partida,
  currentUserId,
  date,
  onClose,
  onSave,
  onDelete,
  isLoggedIn,
  isAdmin,
}) {
  // Router
  const router = useRouter();
  const handleGoToDetails = () => {
    if (partida?.id) router.push(`/partidas/${partida.id}`);
  };

  // Modal container ref (used also as AlertDialog portal container)
  const modalRef = useRef();

  // Alert dialog (delete confirmation)
  const { isOpen: isAlertOpen, onOpen: openAlert, onClose: closeAlert } = useDisclosure();
  const cancelRef = useRef();

  // Body scroll lock while modal is mounted
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // -------- Form state (controlled in parent) --------------------------------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [playerLimit, setPlayerLimit] = useState(4);
  const [creatorParticipates, setCreatorParticipates] = useState(true);
  const [location, setLocation] = useState("Aldea Lúdica");
  const [startHour, setStartHour] = useState("14");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("16");
  const [endMinute, setEndMinute] = useState("00");

  // Game search
  const [gameSearch, setGameSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Selected game
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedGameDetails, setSelectedGameDetails] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Participants
  const [participants, setParticipants] = useState([]);

  // Success modal after save
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // -------- Populate state from `partida` and server -------------------------
  useEffect(() => {
    if (!partida) {
      // Reset for "create"
      setTitle("");
      setDescription("");
      setPlayerLimit(4);
      setCreatorParticipates(true);
      setLocation("Aldea Lúdica");
      setStartHour("14"); setStartMinute("00");
      setEndHour("16");   setEndMinute("00");
      setSelectedGame("");
      setSelectedGameDetails(null);
      setParticipants([]);
      setGameSearch("");
      return;
    }

    setTitle(partida.title || "");
    setDescription(partida.description || "");
    setPlayerLimit(partida.playerLimit || 4);
    setCreatorParticipates(partida.creatorParticipates ?? true);
    setLocation(partida.location || "Aldea Lúdica");

    // Start time
    if (typeof partida.startHour === "string" && typeof partida.startMinute === "string") {
      setStartHour(partida.startHour);
      setStartMinute(partida.startMinute);
    } else if (partida.startTime) {
      const [sh, sm] = partida.startTime.split(":");
      setStartHour(sh); setStartMinute(sm);
    } else {
      setStartHour("14"); setStartMinute("00");
    }

    // End time
    if (typeof partida.endHour === "string" && typeof partida.endMinute === "string") {
      setEndHour(partida.endHour);
      setEndMinute(partida.endMinute);
    } else if (partida.endTime) {
      const [eh, em] = partida.endTime.split(":");
      setEndHour(eh); setEndMinute(em);
    } else {
      setEndHour("16"); setEndMinute("00");
    }

    // Game
    setSelectedGame(partida.game || "");
    setGameSearch(partida.game || "");
    if (partida.gameDetails) {
      setSelectedGameDetails(partida.gameDetails);
    } else if (partida.game?.trim()) {
      // Try to resolve missing details by name
      fetch(`/api/search-game-by-name?name=${encodeURIComponent(partida.game)}`)
        .then(r => r.json())
        .then(d => d?.game && setSelectedGameDetails(d.game))
        .catch(() => {});
    }

    setParticipants(partida.participants || []);
  }, [partida]);

  // Fetch latest participants/gameDetails in edit/view/join
  useEffect(() => {
    if ((mode === "edit" || mode === "view" || mode === "join") && partida?.id) {
      fetch(`/api/partidas/${partida.id}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data?.partida) {
            setParticipants(data.partida.participants || []);
            if (data.partida.gameDetails) setSelectedGameDetails(data.partida.gameDetails);
          }
        })
        .catch(() => {});
    }
  }, [mode, partida]);

  // -------- Derived flags ----------------------------------------------------
  const isFormMode = mode === "create" || mode === "edit";
  const isReadOnlyMode = mode === "view" || mode === "join";

  const isCreator = useMemo(() => (partida?.creatorId === currentUserId), [partida, currentUserId]);
  const isParticipant = useMemo(() => {
    return participants.some(p => (p?._id?.toString?.() ?? p?.toString?.()) === currentUserId);
  }, [participants, currentUserId]);
  const isFull = participants.length >= Number(playerLimit || 0);

  // -------- Helpers ----------------------------------------------------------
  function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Precompute human labels for sharing
  let start = null, end = null, dateStr = "", startTimeLabel = "", endTimeLabel = "";
  try {
    start = (partida?.date && partida?.startTime) ? new Date(`${partida.date}T${partida.startTime}`) : null;
    end   = (partida?.date && partida?.endTime)   ? new Date(`${partida.date}T${partida.endTime}`)   : null;
    dateStr = start ? format(start, "dd 'de' MMMM 'de' yyyy", { locale: es }) : "";
    startTimeLabel = start ? format(start, "HH:mm", { locale: es }) : (partida?.startTime || "");
    endTimeLabel   = end   ? format(end, "HH:mm",   { locale: es }) : (partida?.endTime   || "");
  } catch { /* noop */ }

  const id = partida?.id || partida?._id || "";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const partidaLink = `${baseUrl}/eventos?id=${id}`;
  const message =
    `¡Hola! ¿Te unes a la partida?%0A` +
    `Nombre: ${encodeURIComponent((title || "").split(" - ")[0])}%0A` +
    `Fecha: ${encodeURIComponent(dateStr)}%0A` +
    `Hora: ${encodeURIComponent(`${startTimeLabel}–${endTimeLabel}`)}%0A` +
    `Lugar: ${encodeURIComponent(location || "No especificado")}%0A` +
    `+info: ${encodeURIComponent(partidaLink)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${message}`;

  // -------- Game search handlers --------------------------------------------
  async function handleSearchClick() {
    if (!gameSearch || gameSearch.length < 3) {
      alert("Escribe al menos 3 caracteres para buscar.");
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-bgg?query=${encodeURIComponent(gameSearch)}`);
      const data = await res.json();
      if (data.error) {
        setSearchResults([]);
      } else {
        const uniqueResults = Array.from(new Map(data.results.map(x => [x.id, x])).values());
        setSearchResults(uniqueResults);
      }
      setShowSearchModal(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
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
      if (data?.details) setSelectedGameDetails(data.details);
      else setSelectedGameDetails(null);
    } catch {
      setSelectedGameDetails(null);
    }
  }

  // -------- Join/Leave handlers ---------------------------------------------
  async function handleJoinPartida() {
    if (!isLoggedIn) return;
    const action = isParticipant ? "leave" : "join";
    try {
      const res = await fetch("/api/partidas/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partidaId: partida.id, userId: currentUserId }),
      });
      const data = await res.json();
      if (data?.error) {
        toast.error(`❌ Error al ${action === "join" ? "apuntarte" : "salirte"}: ${data.error}`);
      } else {
        setParticipants(data.partida?.participants || []);
        toast.success(
          action === "join"
            ? `✅ Te has apuntado a "${partida.title}" el día ${partida.date} a las ${partida.startTime}.`
            : `👋 Has salido de la partida "${partida.title}".`
        );
      }
    } catch {
      toast.error("❌ Error interno al gestionar la participación.");
    }
  }

  // -------- Save/Delete handlers --------------------------------------------
  function handleSaveClick() {
    const errors = [];

    if (!title) errors.push("Título");

    const startM = parseInt(startHour) * 60 + parseInt(startMinute);
    const endM = parseInt(endHour) * 60 + parseInt(endMinute);
    if (endM <= startM) errors.push("Hora fin <= Hora inicio");

    const pl = parseInt(playerLimit);
    if (pl < 2 || pl > 50) errors.push("Límite de jugadores fuera de rango");

    if (!location) errors.push("Ubicación");

    if (errors.length > 0) {
      alert("Faltan o son inválidos los siguientes campos: " + errors.join(", "));
      return;
    }

    // Participants copy/cleanup according to creatorParticipates
    let updatedParticipants = [...participants];
    const idx = updatedParticipants.findIndex(p => (p?._id?.toString?.() ?? p?.toString?.()) === currentUserId);
    const alreadyIn = idx !== -1;

    if ((isCreator || isAdmin) && creatorParticipates && !alreadyIn) {
      updatedParticipants.push(currentUserId);
    }
    if ((isCreator || isAdmin) && !creatorParticipates && alreadyIn) {
      updatedParticipants.splice(idx, 1);
    }

    const creatorId = partida?.creatorId?.toString?.() ?? currentUserId?.toString?.();
    const cleanParticipants = updatedParticipants.filter(p => {
      const id = p?._id?.toString?.() ?? p?.toString?.();
      return !(id === creatorId && !creatorParticipates);
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
    setShowSuccessModal(true);
  }

  function handleDeleteClick() {
    openAlert();
  }

  function handleConfirmDelete() {
    if (!partida?.id) return;
    onDelete(partida.id);
    closeAlert();
  }

  // -------- Render -----------------------------------------------------------
  return (
    <div className={styles["modal-overlay"]}>
      <div ref={modalRef} className={styles["modal-content"]}>
        {/* Close button (X) */}
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

        {/* Header */}
        <div className={styles["modal-header"]}>
          {mode === "view" && <h2><b>Detalles de la partida</b></h2>}
          {mode === "edit" && <h2><b>Editar Partida</b></h2>}
          {mode === "create" && <h2><b>Crear Partida</b></h2>}
          {mode === "join" && <h2><b>Unirte a la partida</b></h2>}
        </div>

        <div className={styles["modal-body"]}>
          {/* Participants and WhatsApp share */}
          <div className={styles["form-group"]}>
            {mode !== "create" && (
              <span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Compartir por WhatsApp"
                  style={{ marginRight: "8px" }}
                >
                  <Icon as={FaWhatsapp} color="green.500" boxSize={5} />
                </a>
                Compartir por WhatsApp
              </span>
            )}
            <p>Participantes: {participants.length} / {playerLimit}</p>
            <ul>
              {participants.map((p) => {
                if (typeof p === "string") return <li key={p}>Usuario {p}</li>;
                if (p?._id) return <li key={p._id}>{p.name || p.email || `Usuario ${p._id}`}</li>;
                return <li key={"desconocido"}>Desconocido</li>;
              })}
            </ul>
          </div>

          {/* Form (create/edit) */}
          {isFormMode && (
            <ModalPartidaForm
              // Game search
              gameSearch={gameSearch}
              setGameSearch={setGameSearch}
              onSearchClick={handleSearchClick}
              selectedGameDetails={selectedGameDetails}
              onShowImagePreview={() => setShowImagePreview(true)}
              // Basic fields
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              // Time
              startHour={startHour}
              setStartHour={setStartHour}
              startMinute={startMinute}
              setStartMinute={setStartMinute}
              endHour={endHour}
              setEndHour={setEndHour}
              endMinute={endMinute}
              setEndMinute={setEndMinute}
              // Players / creator
              playerLimit={playerLimit}
              setPlayerLimit={setPlayerLimit}
              isCreator={isCreator}
              creatorParticipates={creatorParticipates}
              setCreatorParticipates={setCreatorParticipates}
              // Location
              location={location}
              setLocation={setLocation}
              locations={locations}
              // Flags
              isFull={isFull}
              // Icon (imported here for Form)
              SearchIcon={FaSearch}
            />
          )}

          {/* Read-only (view/join) */}
          {isReadOnlyMode && (
            <ModalPartidaReadOnly
              selectedGameDetails={selectedGameDetails}
              title={title}
              description={description}
              dateLabel={partida?.date}
              startTimeLabel={partida?.startTime}
              endTimeLabel={partida?.endTime}
              playerLimit={playerLimit}
              location={location}
              onImageClick={() => setShowImagePreview(true)}
            />
          )}

          {/* Footer / Action buttons */}
          <div className={styles["modal-actions"]}>
            {(mode === "join" || (mode === "edit" && isAdmin && !isCreator)) &&
              isLoggedIn &&
              !isFull &&
              (isParticipant ? (
                <Button colorScheme="red" onClick={handleJoinPartida} rightIcon={<FaThumbsDown />} mr={2}>
                  Ya no quiero jugar
                </Button>
              ) : (
                <Button colorScheme="green" onClick={handleJoinPartida} rightIcon={<FaThumbsUp />} mr={2}>
                  ¡Quiero jugar!
                </Button>
              ))}

            {(mode === "create" || mode === "edit") && (
              <Button onClick={handleSaveClick} colorScheme="blue">
                Guardar
              </Button>
            )}

            {mode === "edit" && (isCreator || isAdmin) && (
              <IconButton
                aria-label="Eliminar partida"
                icon={<FaTrash />}
                onClick={handleDeleteClick}
                colorScheme="red"
              />
            )}

            <Button onClick={handleGoToDetails} colorScheme="blue" mt={4}>
              Ver Detalles de la Partida
            </Button>
          </div>
        </div>

        {/* Search results modal */}
        {showSearchModal && (
          <SearchResultsModal
            results={searchResults}
            onSelectGame={handleSelectGame}
            onClose={() => setShowSearchModal(false)}
          />
        )}

        {/* Full image preview */}
        {showImagePreview && selectedGameDetails?.image && (
          <ImagePreviewModal
            image={selectedGameDetails.image}
            onClose={() => setShowImagePreview(false)}
          />
        )}

        {/* Searching overlay */}
        {isSearching && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-blue-100 p-6 rounded-lg text-center shadow-lg">
              <p className="text-lg font-semibold text-gray-800">
                Accediendo a la biblioteca de juegos...
              </p>
              <div className="mt-4">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {isAlertOpen && (
        <AlertDialog
          isOpen={isAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={closeAlert}
          isCentered
          portalProps={{ containerRef: modalRef }}
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
                <Button ref={cancelRef} onClick={closeAlert}>Cancelar</Button>
                <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                  Aceptar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}

      {/* Success modal after save */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 99999
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 32,
              borderRadius: 12,
              minWidth: 320,
              textAlign: "center",
              boxShadow: "0 6px 32px #0002"
            }}
          >
            <h2 style={{ marginBottom: 16, color: "#2563eb", fontSize: 22 }}>
              Partida creada correctamente
            </h2>
            <div style={{ marginBottom: 20 }}>
              <p>Para compartirla por WhatsApp haz click en el icono</p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir por WhatsApp"
                style={{ display: "inline-block", marginTop: 16 }}
              >
                <Icon as={FaWhatsapp} color="green.500" boxSize={12} />
              </a>
            </div>
            <Button
              colorScheme="blue"
              onClick={() => { setShowSuccessModal(false); onClose(); }}
              mt={3}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
