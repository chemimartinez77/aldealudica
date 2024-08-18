// src\app\listado\page.tsx
"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Image from 'next/image';
import { styled } from '@mui/material/styles';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isSameDay } from 'date-fns';
import Button from '@mui/material/Button';
import { Game, Participant } from '../../types/types';
import GameForm from '../../components/GameForm';

// Define un botón personalizado
const CustomButton = styled(Button)({
    backgroundColor: '#A7C6FF', // Azul claro
    color: '#000', // Letras negras
    '&:hover': {
        backgroundColor: '#3572FF', // Color azul al pasar el ratón
        color: 'white',
    },
    '&:disabled': {
        backgroundColor: '#ccc', // Color gris medio cuando está desactivado
        color: '#666', // Color del texto gris oscuro
        cursor: 'not-allowed',
    },
    boxShadow: 'none', // Eliminar sombra
    border: 'none', // Eliminar borde
    textTransform: 'none', // Mantener el texto sin transformar
});

const Thumbnail = styled('img')({
    maxHeight: '100px',
    maxWidth: '100px',
    borderRadius: '10px', // Bordes redondeados para la imagen
    objectFit: 'contain',
    boxShadow: '0 0 8px #888', // Resplandor gris oscuro
});

const GameCard = styled(Box)({
    backgroundColor: '#f0f0f0', // Fondo gris claro
    borderRadius: '10px', // Bordes redondeados para la tarjeta
    padding: '16px', // Espaciado interno
    margin: '8px', // Espaciado externo
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '250px', // Altura fija para todas las tarjetas
});

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    backgroundColor: 'white',
    boxShadow: 24,
    padding: 4,
    borderRadius: '10px',
};

const successModalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 300,
    backgroundColor: 'white',
    boxShadow: 24,
    padding: 4,
    borderRadius: '10px',
    textAlign: 'center' as 'center',
};

const fullGameTextStyle = {
    color: 'black',
    backgroundColor: '#ccc',
    padding: '4px',
    borderRadius: '4px',
    fontWeight: 'bold' as 'bold',
    textAlign: 'center' as 'center',
    marginTop: '8px',
};

const GamesPage = () => {
    const { data: session } = useSession();
    const [games, setGames] = useState<Game[]>([]);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [showAll, setShowAll] = useState<boolean>(false);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [showErrorMessage, setShowErrorMessage] = useState(true);

    const filterGames = useCallback((games: Game[], date: Date | null) => {
        if (showAll) {
            setFilteredGames(games);
        } else if (date) {
            const filtered = games.filter(game => isSameDay(new Date(game.startDate), date));
            setFilteredGames(filtered);
        }
    }, [showAll]);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch('../api/getGames');
                if (!response.ok) {
                    throw new Error('Error fetching games');
                }
                const data = await response.json();

                // Fetch game details including image URL
                const gamesWithImages = await Promise.all(data.map(async (game: Game) => {
                    const detailsResponse = await fetch(`../api/getGameDetails?gameId=${game.gameId}`);
                    const detailsData = await detailsResponse.json();
                    return {
                        ...game,
                        imageUrl: detailsData.imageUrl,
                        players: game.players || [],
                        participantCount: game.players?.length || 0 // Si necesitas contar los jugadores
                    };
                }));

                setGames(gamesWithImages);
                filterGames(gamesWithImages, selectedDate);
            } catch (error: any) {
                setError(error.message);
            }
        };

        fetchGames();
    }, [filterGames, selectedDate]);

    useEffect(() => {
        filterGames(games, selectedDate);
    }, [selectedDate, showAll, games, filterGames]);

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
        setShowAll(false); // Reset showAll when a date is selected
    };

    const handleShowAll = () => {
        setShowAll(true);
    };

    const handleOpenModal = async (game: Game) => {
        try {
            console.log('Cargamos la modal...');
            const response = await fetch(`/api/getGameDetails?id=${game.id}`);
            if (!response.ok) {
                throw new Error('Error fetching game details');
            }
            const detailedGame = await response.json();
            console.log('Detailed game:', detailedGame);

            const participants = detailedGame.participants || [];

            // Aquí asignamos el número de participantes al game
            setSelectedGame({
                ...game,
                participantCount: participants.length, // Establece el número de participantes
                players: participants.map((p: Participant) => p.users.name),
                creatorId: detailedGame.creatorid,
            });
        } catch (error: any) {
            setError(error.message);
        }
    };


    const handleJoinGame = async () => {
        // Restablecer la visibilidad del mensaje de error
        setShowErrorMessage(true);

        if (selectedGame && session && session.user && (session.user as any).id) {
            try {
                const response = await fetch('/api/joinGame', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ gameId: selectedGame.id, userId: (session.user as any).id }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (errorData.message === 'Ya estás inscrito en la partida o te borraste de ella, contacta con un administrador') {
                        throw new Error(errorData.message);
                    }
                    throw new Error('Error joining game');
                }

                setSuccessMessage('Apuntado correctamente a la partida');
                setIsSuccessModalOpen(true);

                // Refrescar los detalles del juego para mostrar la lista actualizada de participantes
                await handleOpenModal(selectedGame);
            } catch (error: any) {
                setError(error.message);
            }
        }
    };


    const handleLeaveGame = async () => {
        if (selectedGame && session && session.user && (session.user as any).id) {
            try {
                const response = await fetch('/api/leaveGame', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ gameId: selectedGame.id, userId: (session.user as any).id }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (errorData.message) {
                        throw new Error(errorData.message);
                    }
                    throw new Error('Error leaving game');
                }

                setSuccessMessage('Te has dado de baja de la partida');
                setIsSuccessModalOpen(true);

                // Refresh game details to show the updated participant list
                await handleOpenModal(selectedGame);
            } catch (error: any) {
                setError(error.message);
            }
        }
    };

    const handleCloseSuccessModal = () => {
        setIsSuccessModalOpen(false);
    };

    const handleUpdateGame = async (updatedData: Partial<Game>) => {
        if (!editingGame) {
            console.error('No game selected for editing');
            return;
        }

        try {
            // Combina datos de editingGame y updatedData para asegurarte de que estás enviando todo lo necesario
            const updatedGameData = { ...editingGame, ...updatedData };

            const response = await fetch('/api/updateGame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedGameData),
            });

            if (!response.ok) {
                throw new Error('Error updating game');
            }

            const updatedGame = await response.json();

            // Actualiza la lista de juegos con los datos actualizados
            setGames(games.map(game => (game.id === updatedGame.id ? updatedGame : game)));
            setEditingGame(null);

            // Opcional: puedes mostrar un mensaje de éxito aquí
        } catch (error: any) {
            console.error('Error updating game:', error);
            setError(error.message);
        }
    };


    return (
        <Box display="flex" minHeight="100vh" py={4}>
            <Box width="20%" maxWidth={300} mr={4} ml={4}>
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    inline
                    minDate={new Date('2024-01-01')}
                    maxDate={new Date('2050-12-31')}
                    todayButton="Hoy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                />
                <Box mt={2} display="flex" justifyContent="center">
                    <CustomButton variant="contained" onClick={handleShowAll}>Mostrar Todas</CustomButton>
                </Box>
            </Box>
            <Box width="80%" maxWidth={1200} mx="auto">
                {error && showErrorMessage && (
                    <Box display="flex" alignItems="center" bgcolor="#f8d7da" color="#721c24" p={2} mb={2} borderRadius={4}>
                        <Typography flex="1">
                            {error}
                        </Typography>
                        <Button
                            onClick={() => setShowErrorMessage(false)}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#721c24',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0',
                            }}
                        >
                            ×
                        </Button>
                    </Box>
                )}
                <Grid container spacing={2}>
                    {filteredGames.map((game) => {
                        console.log('Current game:', game); // <-- Añadir esta línea para imprimir cada 'game' en la consola

                        return (
                            <Grid item xs={12} sm={6} md={4} key={game.id}>
                                <Box onClick={() => handleOpenModal(game)}>
                                    <GameCard>
                                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex="1">
                                            <Image
                                                src={game.imageUrl || '/noimg.jpg'} // Usa la URL de la imagen obtenida
                                                alt={game.game}
                                                width={100}
                                                height={100}
                                                style={{ objectFit: 'contain' }}
                                            />
                                            <Typography variant="h6">{game.game}</Typography>
                                            <Typography variant="body1">Nº Jugadores: {game.participantes.length}/{game.participants}</Typography>
                                            <Typography variant="body2">Inicio: {game.startDate} {game.startTime}</Typography>
                                            <Typography variant="body2">Fin: {game.endDate} {game.endTime}</Typography>
                                            {
                                                Number(game.participantCount ?? 0) >= Number(game.participants) && (
                                                    <Typography sx={fullGameTextStyle}>
                                                        Partida completa
                                                    </Typography>
                                                )
                                            }
                                        </Box>
                                    </GameCard>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>

            </Box>
            <Modal
                open={!!selectedGame}
                onClose={() => setSelectedGame(null)}
                aria-labelledby="game-modal-title"
                aria-describedby="game-modal-description"
            >
                <Box sx={modalStyle}>
                    {selectedGame && (
                        <>
                            <Typography id="game-modal-title" variant="h6" component="h2">
                                {selectedGame.game}
                            </Typography>
                            {/* Aquí se imprime la URL de la imagen para depurar */}
                            {console.log('Image URL:', selectedGame.imageUrl)}
                            {console.log('Creator ID:', selectedGame.creatorId)}
                            {console.log('Session User ID:', session?.user?.id)}
                            <Box display="flex" justifyContent="center" mt={2} mb={2}>
                                <Image
                                    src={selectedGame.imageUrl || '/noimg.jpg'}
                                    alt={selectedGame.game}
                                    width={200}
                                    height={200}
                                    style={{ borderRadius: '10px' }}
                                />
                            </Box>
                            <Typography id="game-modal-description" sx={{ mt: 2 }}>
                                <strong>Inicio:</strong> {selectedGame.startDate} {selectedGame.startTime}
                            </Typography>
                            <Typography id="game-modal-description" sx={{ mt: 2 }}>
                                <strong>Fin:</strong> {selectedGame.endDate} {selectedGame.endTime}
                            </Typography>
                            <Typography id="game-modal-description" sx={{ mt: 2 }}>
                                <strong>Lugar:</strong> {selectedGame.location}
                            </Typography>
                            <Typography id="game-modal-description" sx={{ mt: 2, fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: '4px', borderRadius: '4px' }}>
                                Jugadores:
                            </Typography>
                            <ul>
                                {selectedGame.players?.length ? (
                                    selectedGame.players.map((player, index) => (
                                        <li key={index}>{player}</li>
                                    ))
                                ) : 'N/A'}
                            </ul>
                            {
                                (selectedGame.players?.length ?? 0) >= Number(selectedGame.participants ?? 0) && (
                                    <Typography sx={fullGameTextStyle}>
                                        Partida completa
                                    </Typography>
                                )
                            }


                            {console.log('Selected Game:', selectedGame)}
                            {session?.user?.id === selectedGame.creatorId ? (
                                <GameForm
                                    initialData={{
                                        startDate: selectedGame.startDate,
                                        startTime: selectedGame.startTime,
                                        endDate: selectedGame.endDate,
                                        endTime: selectedGame.endTime,
                                        participants: selectedGame.participants,
                                        location: selectedGame.location,
                                        address: selectedGame.address,
                                        description: selectedGame.description,
                                        gameId: selectedGame.gameId,
                                        title: selectedGame.game,
                                    }}
                                    onSubmit={handleUpdateGame} // Asegúrate de que handleUpdateGame maneje correctamente la actualización
                                />
                            ) : (
                                session?.user?.id !== selectedGame.creatorId &&
                                session?.user?.name &&
                                !selectedGame.players?.includes(session.user.name) &&
                                (selectedGame.players?.length ?? 0) < Number(selectedGame.participants ?? 0) && (
                                    <Box display="flex" justifyContent="center" mt={2}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleJoinGame}
                                        >
                                            QUIERO JUGAR
                                        </Button>
                                    </Box>
                                )
                            )}

                            {session?.user?.id !== selectedGame.creatorId &&
                                session?.user?.name &&
                                selectedGame.players?.includes(session.user.name) && (
                                    <Box display="flex" justifyContent="center" mt={2}>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={handleLeaveGame}
                                        >
                                            DARSE DE BAJA
                                        </Button>
                                    </Box>
                                )
                            }
                        </>
                    )}
                </Box>
            </Modal>


            <Modal
                open={isSuccessModalOpen}
                onClose={handleCloseSuccessModal}
                aria-labelledby="success-modal-title"
                aria-describedby="success-modal-description"
            >
                <Box sx={successModalStyle}>
                    <Typography id="success-modal-title" variant="h6" component="h2">
                        {successMessage}
                    </Typography>
                    <Button variant="contained" onClick={handleCloseSuccessModal} sx={{ mt: 2 }}>
                        Cerrar
                    </Button>
                </Box>
            </Modal>
            {editingGame && (
                <Modal
                    open={!!editingGame}
                    onClose={() => setEditingGame(null)}
                    aria-labelledby="edit-game-modal-title"
                    aria-describedby="edit-game-modal-description"
                >
                    <Box sx={modalStyle}>
                        <GameForm
                            initialData={editingGame}
                            onSubmit={handleUpdateGame}
                        />
                    </Box>
                </Modal>
            )}
        </Box>
    );

}

export default GamesPage;
