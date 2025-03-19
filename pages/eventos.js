// pages/eventos.js
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import ModalPartida from "../components/ModalPartida";
import { useSession } from "next-auth/react";
import Layout from "../components/Layout";

const Calendario = dynamic(() => import("../components/Calendario"), {
    ssr: false,
});

export default function Eventos() {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id; // Aquí obtienes el ID
    const [partidas, setPartidas] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create" o "edit" o "view"
    const [selectedPartida, setSelectedPartida] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    // Cargar las partidas desde la BD
    useEffect(() => {
        // (NUEVO) Ahora /api/partidas (GET) devuelve { partidas: [...] }
        fetch("/api/partidas")
            .then((res) => res.json())
            .then((data) => {
                // data = { partidas: [...] }
                setPartidas(data.partidas); // Ojo, data.partidas es el array real
            })
            .catch((err) => console.error(err));
    }, []);

    // Al hacer clic en un día para crear
    const handleDayClick = (date) => {
        if (date < new Date().setHours(0, 0, 0, 0)) {
            alert("No puedes crear partidas en fechas pasadas");
            return;
        }
        if (!currentUserId) {
            alert("Inicia sesión para crear partidas.");
            return;
        }
        // Extraer hora y minuto de la 'date'
        const hour = date.getHours();
        const minute = date.getMinutes();

        // Calcular hora de fin: +3 horas
        let endH = hour + 3;
        // Si no quieres pasarte de la medianoche, clamp a 23
        if (endH > 23) endH = 23;
        setSelectedDate(date);
        setSelectedPartida({
            startHour: String(hour),
            startMinute: String(minute).padStart(2, "0"),
            endHour: String(endH),
            endMinute: String(minute).padStart(2, "0"),
            // ... lo que necesites
        });
        setModalMode("create");
        setModalOpen(true);
    };

    // Al hacer clic en un evento (partida)
    const handleEventClick = (partida) => {
        console.log("-> partida.creatorId: " + partida.creatorId);
        console.log("-> currentUserId: " + currentUserId);
        if (!currentUserId) {
            // No logado => solo ver
            setModalMode("view");
        } else if (partida.creatorId === currentUserId) {
            // Eres el creador => modo edit
            setModalMode("edit");
        } else {
            // Logado pero no eres creador => modo join
            setModalMode("join");
        }
        console.log("-> Mode: " + modalMode);
        setSelectedPartida(partida);
        setModalOpen(true);
    };

    // Al guardar la partida en la modal
    const handleSavePartida = (newPartida) => {
        // Llamada al backend para crear o editar
        // Si newPartida tiene un id, es edición; si no, es creación
        const method = newPartida.id ? "PUT" : "POST";
        fetch("/api/partidas", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPartida),
        })
            .then((res) => res.json())
            .then((saved) => {
                const updatedPartida = saved.partida;

                if (method === "POST") {
                    // Crear
                    setPartidas((prev) => [...prev, updatedPartida]);
                } else {
                    // Editar
                    setPartidas((prev) =>
                        prev.map((p) =>
                            p.id === updatedPartida.id ? updatedPartida : p
                        )
                    );
                }
                setModalOpen(false);
            })
            .catch((err) => {
                console.error("Error guardando partida:", err);
                alert("No se pudo guardar la partida. Inténtalo de nuevo.");
            });
    };

    // Al eliminar la partida
    function handleDeletePartida(id) {
        fetch(`/api/partidas?id=${id}`, { method: "DELETE" })
            .then((res) => {
                if (!res.ok) throw new Error("Error al eliminar");
                // Actualizar estado local
                setPartidas((prev) => prev.filter((p) => p.id !== id));
                setModalOpen(false);
            })
            .catch((err) => {
                console.error("Error eliminando partida:", err);
                alert("No se pudo eliminar la partida. Inténtalo de nuevo.");
            });
    }

    return (
        <Layout>
            <div>
                <Calendario
                    partidas={partidas}
                    onDayClick={handleDayClick}
                    onEventClick={handleEventClick}
                    isLoggedIn={!!session}
                />

                {modalOpen && (
                    <ModalPartida
                        mode={modalMode}
                        partida={selectedPartida}
                        currentUserId={currentUserId}
                        date={selectedDate}
                        onClose={() => setModalOpen(false)}
                        onSave={handleSavePartida}
                        onDelete={handleDeletePartida}
                        isLoggedIn={!!session}
                    />
                )}
            </div>
        </Layout>
    );
}
