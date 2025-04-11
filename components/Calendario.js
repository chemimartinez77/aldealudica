// components/Calendario.js
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { parse, startOfWeek, getDay, format } from "date-fns";
import es from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Icon } from "@chakra-ui/react";
import { FaWhatsapp, FaInfoCircle } from "react-icons/fa";
import { useState } from "react";
import styles from "../styles/Calendario.module.css";

const locales = { es };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

// Componente personalizado para renderizar cada evento
const EventWithWhatsApp = ({ event, view }) => {
    const { id, title, start, end, location, gameDetails } = event;

    if (view !== "agenda") {
        return <span>{title}</span>;
    }

    const dateStr = format(start, "dd 'de' MMMM 'de' yyyy", { locale: es });
    const startTime = format(start, "HH:mm", { locale: es });
    const endTime = format(end, "HH:mm", { locale: es });

    // Enlace personalizado a la vista de agenda con la modal abierta
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const partidaLink = `${baseUrl}/eventos?id=${id}`;

    const message =
        `¡Hola! ¿Te unes a la partida?%0A` +
        `Nombre: ${encodeURIComponent(title.split(" - ")[0])}%0A` +
        `Fecha: ${encodeURIComponent(dateStr)}%0A` +
        `Hora: ${encodeURIComponent(`${startTime}–${endTime}`)}%0A` +
        `Lugar: ${encodeURIComponent(location || "No especificado")}%0A` +
        `+info: ${encodeURIComponent(partidaLink)}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${message}`;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {gameDetails?.image && (
                <img
                    src={gameDetails.image}
                    alt="Portada del juego"
                    className={styles.gameThumbnail}
                    style={{
                        width: "64px",
                        height: "auto",
                        borderRadius: "4px",
                        objectFit: "cover",
                    }}
                />
            )}
            <span style={{ fontWeight: 500 }}>{title}</span>
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir por WhatsApp"
            >
                <Icon as={FaWhatsapp} color="green.500" boxSize={5} />
            </a>
            <span
                title="Más info"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#3182ce",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                }}
            >
                <FaInfoCircle style={{ fontSize: "0.9rem" }} />
                +info
            </span>
        </div>
    );
};

const CustomAgendaDateCell = ({ day }) => {
    if (!(day instanceof Date) || isNaN(day.getTime())) {
        return <span>Fecha inválida</span>;
    }

    const capitalizar = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const raw = format(day, "EEEE d MMMM", { locale: es });
    const partes = raw.split(" ");
    const capitalizadas = partes.map((p) =>
        isNaN(Number(p)) ? capitalizar(p) : p
    );
    const [diaSemana, diaMes, nombreMes] = capitalizadas;

    // Usar window solo si está definido
    if (typeof window !== "undefined" && window.innerWidth > 500) {
        return <span>{`${diaSemana} ${diaMes} ${nombreMes}`}</span>;
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: "1.2",
                fontSize: "0.8rem",
            }}
        >
            <span>{`${diaSemana} ${diaMes}`}</span>
            <span>{nombreMes}</span>
        </div>
    );
};

const CustomAgendaTimeCell = ({ event }) => {
    const { start, end } = event;
    const desde = format(start, "HH:mm", { locale: es });
    const hasta = format(end, "HH:mm", { locale: es });

    if (typeof window !== "undefined" && window.innerWidth <= 500) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: "0.8rem",
                    lineHeight: "1.2",
                }}
            >
                <span style={{ backgroundColor: "#007700", color: "#FFFFFF" }}>
                    &nbsp;{desde}&nbsp;
                </span>
                <span style={{ backgroundColor: "#FF0000" }}>
                    &nbsp;{hasta}&nbsp;
                </span>
            </div>
        );
    }

    return `De ${desde} a ${hasta}`;
};

export default function Calendario({
    partidas,
    onDayClick,
    onEventClick,
    isLoggedIn,
}) {
    // Inicializar currentView de forma condicional según la URL
    const [currentView, setCurrentView] = useState(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            return params.has("id") ? "agenda" : "month";
        }
        return "month";
    });

    // Convertir partidas a events
    const events = partidas
    .filter((p) => p.date && p.startTime && p.endTime)
    .map((p) => ({
        ...p,
        id: p.id || p._id, // 🔥 asegúrate de que esté
        start: new Date(`${p.date}T${p.startTime}`),
        end: new Date(`${p.date}T${p.endTime}`),
        title: p.title,
    }));

    const capitalizar = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const calendarProps = {
        culture: "es",
        localizer,
        events,
        startAccessor: "start",
        endAccessor: "end",
        style: { height: "80vh" },
        messages: {
            next: "Sig.",
            previous: "Ant.",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
        },
        onView: (view) => setCurrentView(view),
        formats: {
            weekdayFormat: (date, culture, loc) =>
                capitalizar(loc.format(date, "EEEE", culture)),
            monthHeaderFormat: (date, culture, loc) =>
                capitalizar(loc.format(date, "MMMM yyyy", culture)),
            timeGutterFormat: (date, culture, loc) =>
                loc.format(date, "HH:mm", culture),
            eventTimeRangeFormat: ({ start, end }, culture, loc) =>
                `${loc.format(start, "HH:mm", culture)} – ${loc.format(
                    end,
                    "HH:mm",
                    culture
                )}`,
        },
        selectable: isLoggedIn,
        onSelectSlot: isLoggedIn
            ? (slotInfo) => {
                  onDayClick(slotInfo.start);
              }
            : undefined,
        onSelectEvent: (event) => {
            onEventClick(event);
        },
        components: {
            event: (props) => (
                <EventWithWhatsApp {...props} view={currentView} />
            ),
            agenda: {
                date: CustomAgendaDateCell,
                time: CustomAgendaTimeCell,
            },
        },
    };
    return (
        <div className={styles.calendarContainer}>
            <Calendar {...calendarProps} defaultView={currentView} view={currentView} />
        </div>
    );
}
