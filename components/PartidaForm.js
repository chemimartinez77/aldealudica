import { FaSearch } from "react-icons/fa";
import styles from "../styles/ModalPartida.module.css";
import locations from "../data/locations.json";

export default function PartidaForm({
    gameSearch,
    setGameSearch,
    handleSearchClick,
    selectedGameDetails,
    setShowImagePreview,
    title,
    setTitle,
    description,
    setDescription,
    startHour,
    setStartHour,
    startMinute,
    setStartMinute,
    endHour,
    setEndHour,
    endMinute,
    setEndMinute,
    playerLimit,
    setPlayerLimit,
    isCreator,
    creatorParticipates,
    setCreatorParticipates,
    location,
    setLocation,
    isFull,
}) {
    return (
        <form>
            <div className={`${styles["form-group"]} ${styles["col-span-2"]}`}>
                <label>Elige un juego (opcional)</label>
                <div className={styles["search-input-wrapper"]}>
                    <div className={styles["search-input-container"]}>
                        <input
                            type="text"
                            placeholder="Escribe el nombre del juego"
                            value={gameSearch}
                            onChange={(e) => setGameSearch(e.target.value)}
                            disabled={isFull}
                            className={styles["search-input"]}
                        />
                        <FaSearch
                            className={styles["search-icon"]}
                            onClick={() => !isFull && handleSearchClick()}
                        />
                    </div>

                    {selectedGameDetails?.image && (
                        <img
                            src={selectedGameDetails.image}
                            alt={selectedGameDetails.name}
                            className={styles["selected-game-cover"]}
                            onClick={() => setShowImagePreview(true)}
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
                        onChange={(e) => setStartHour(e.target.value)}
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
                        onChange={(e) => setStartMinute(e.target.value)}
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
                        onChange={(e) => setEndMinute(e.target.value)}
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
    );
}
