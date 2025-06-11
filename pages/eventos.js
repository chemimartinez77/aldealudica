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
    const currentUserId = session?.user?.id;
    const isAdmin = session?.user?.role === "admin";

    const [partidas, setPartidas] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedPartida, setSelectedPartida] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        fetch("/api/partidas", {
            credentials: 'include' // Añadir esta línea
        })
            .then((res) => res.json())
            .then((data) => {
                const partidas = data?.partidas || [];
                setPartidas(partidas);
            })
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const partidaIdFromUrl = params.get("id");

        if (partidaIdFromUrl && partidas.length > 0) {
            const partida = partidas.find((p) => p.id === partidaIdFromUrl);

            if (partida) {
                if (!currentUserId) {
                    setModalMode("view");
                } else if (partida.creatorId === currentUserId || isAdmin) {
                    setModalMode("edit");
                } else {
                    setModalMode("join");
                }

                setSelectedPartida(partida);
                setModalOpen(true);
            } else {
                console.warn("No se encontró la partida con ese ID");
            }
        }
    }, [partidas, currentUserId, isAdmin]);

    const handleDayClick = (date) => {
        if (date < new Date().setHours(0, 0, 0, 0)) {
            alert("No puedes crear partidas en fechas pasadas");
            return;
        }
        if (!currentUserId) {
            alert("Inicia sesión para crear partidas.");
            return;
        }

        const hour = date.getHours();
        const minute = date.getMinutes();
        let endH = hour + 3;
        if (endH > 23) endH = 23;

        setSelectedDate(date);
        setSelectedPartida({
            startHour: String(hour),
            startMinute: String(minute).padStart(2, "0"),
            endHour: String(endH),
            endMinute: String(minute).padStart(2, "0"),
        });
        setModalMode("create");
        setModalOpen(true);
    };

    const handleEventClick = (partida) => {
        if (!currentUserId) {
            setModalMode("view");
        } else if (partida.creatorId === currentUserId || isAdmin) {
            setModalMode("edit");
        } else {
            setModalMode("join");
        }
        setSelectedPartida(partida);
        setModalOpen(true);
    };

    const handleSavePartida = (newPartida) => {
        const method = newPartida.id ? "PUT" : "POST";
        const payload = { ...newPartida };
        if (!newPartida.id) {
            delete payload.id;
        }

        fetch("/api/partidas", {
            method,
            credentials: 'include', // Añadir esta línea
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((saved) => {
                const updatedPartida = saved.partida;

                if (method === "POST") {
                    setPartidas((prev) => [...prev, updatedPartida]);
                } else {
                    setPartidas((prev) =>
                        prev.map((p) =>
                            p.id === updatedPartida.id ? updatedPartida : p
                        )
                    );
                }
            })
            .catch((err) => {
                console.error("Error guardando partida:", err);
                alert("No se pudo guardar la partida. Inténtalo de nuevo.");
            });
    };

    function handleDeletePartida(id) {
        fetch(`/api/partidas?id=${id}`, {
            method: "DELETE",
            credentials: 'include' // Añadir esta línea
        })
            .then((res) => {
                if (!res.ok) throw new Error("Error al eliminar");
                setPartidas((prev) => prev.filter((p) => p.id !== id));
                setModalOpen(false);
            })
            .catch((err) => {
                console.error("Error eliminando partida:", err);
                alert("No se pudo eliminar la partida. Inténtalo de nuevo.");
            });
    }

    function handleCloseModal() {
        const url = new URL(window.location.href);
        url.searchParams.delete("id");
        window.history.replaceState({}, "", url.toString());
        setModalOpen(false);
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
                        isAdmin={isAdmin}
                        date={selectedDate}
                        onClose={handleCloseModal}
                        onSave={handleSavePartida}
                        onDelete={handleDeletePartida}
                        isLoggedIn={!!session}
                    />
                )}
            </div>
        </Layout>
    );
}
