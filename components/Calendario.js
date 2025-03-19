// components/Calendario.js
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { parse, startOfWeek, getDay, format } from "date-fns";
import es from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

export default function Calendario({
    partidas,
    onDayClick,
    onEventClick,
    isLoggedIn,
}) {
    // Ejemplo: convertir tus partidas a `events`
    const events = partidas
    .filter((p) => p.date && p.startTime && p.endTime)
    .map((p) => ({
      ...p,
      start: new Date(`${p.date}T${p.startTime}`),
      end: new Date(`${p.date}T${p.endTime}`),
      title: `${p.title} - ${p.startTime}–${p.endTime}`,
    }));
  

    // Configurar props del calendario según el login
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
        formats: {
            // Nombres de los días en el encabezado de la vista Semana/Día
            weekdayFormat: (date, culture, loc) =>
                capitalizar(loc.format(date, "EEEE", culture)), // "lunes", "martes", etc.

            // Encabezado del mes (ej. "marzo 2025")
            monthHeaderFormat: (date, culture, loc) =>
                capitalizar(loc.format(date, "MMMM yyyy", culture)),

            // Formato de la columna de horas a la izquierda (gutter)
            timeGutterFormat: (date, culture, loc) =>
                loc.format(date, "HH:mm", culture),

            // Rango de horas de un evento (ej. "14:00 – 16:00")
            eventTimeRangeFormat: ({ start, end }, culture, loc) =>
                `${loc.format(start, "HH:mm", culture)} – ${loc.format(
                    end,
                    "HH:mm",
                    culture
                )}`,

            // Vista "Agenda": rango de cada evento
            agendaTimeRangeFormat: ({ start, end }, culture, loc) =>
                `${loc.format(start, "HH:mm", culture)} – ${loc.format(
                    end,
                    "HH:mm",
                    culture
                )}`,
            agendaDateFormat: (date, culture, loc) => {
                // Por ejemplo: "mié mar 19"
                // si quieres el día largo, usa "EEEE" en vez de "EEE"
                const raw = loc.format(date, "EEEE d MMMM", culture);
                // raw podría ser "mié mar 19"

                // Separamos en palabras ["mié", "mar", "19"]
                const partes = raw.split(" ");
                // Capitalizamos la primera letra de cada parte (excepto si es numérico)
                for (let i = 0; i < partes.length; i++) {
                    // Sólo capitalizamos si no es un número
                    if (isNaN(Number(partes[i]))) {
                        partes[i] = capitalizar(partes[i]);
                    }
                }
                // Unimos de nuevo => "Mié Mar 19"
                return partes.join(" ");
            },
        },

        // Permitir "selectable" (clic en día para crear) solo si está logado
        selectable: isLoggedIn,

        // Si está logado, llamamos a onDayClick para crear partida
        // Si no, no hacemos nada al clicar en un hueco
        onSelectSlot: isLoggedIn
            ? (slotInfo) => {
                  onDayClick(slotInfo.start);
              }
            : undefined,

        // onSelectEvent se ejecuta siempre, para abrir la modal
        // en modo view/edit según la lógica del padre
        onSelectEvent: (event) => {
            onEventClick(event);
        },
    };

    return <Calendar {...calendarProps} />;
}
