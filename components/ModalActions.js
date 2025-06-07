import { Button, IconButton } from "@chakra-ui/react";
import { FaThumbsUp, FaThumbsDown, FaTrash } from "react-icons/fa";
import styles from "../styles/ModalPartida.module.css";

export default function ModalActions({
    mode,
    isAdmin,
    isCreator,
    isLoggedIn,
    isFull,
    isParticipant,
    handleJoinPartida,
    handleSaveClick,
    handleDeleteClick,
    handleGoToDetails,
}) {
    return (
        <div className={styles["modal-actions"]}>
            {(mode === "join" || (mode === "edit" && isAdmin && !isCreator)) &&
                isLoggedIn &&
                !isFull &&
                (isParticipant ? (
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
    );
}
