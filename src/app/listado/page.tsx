"use client"

import React, { useEffect, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import Image from 'next/image'
import { styled } from '@mui/material/styles'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format, isSameDay } from 'date-fns'
import Button from '@mui/material/Button'
import { useSession } from 'next-auth/react'
import { makeStyles } from '@mui/styles'

interface Game {
    id: string;
    game: string;
    title: string;
    participants: number;
    participantCount: number;
    gameId: string;
    imageUrl: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location: string;
    players?: string[];
    creatorId?: string;
}

const useStyles = makeStyles({
    customButton: {
        backgroundColor: '#ADD8E6', // Azul claro
        color: '#000', // Letras negras
        '&:hover': {
            backgroundColor: '#007bff', // Color azul al pasar el ratón
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
    }
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
    const classes = useStyles();
    const [games, setGames] = useState<Game[]>([]);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [showAll, setShowAll] = useState<boolean>(false);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

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
                    return { ...game, imageUrl: detailsData.imageUrl, players: game.players || [] };
                }));

                setGames(gamesWithImages);
                filterGames(gamesWithImages, selectedDate);
            } catch (error: any) {
                setError(error.message);
            }
        };

        fetchGames();
    }, []);

    useEffect(() => {
        filterGames(games, selectedDate);
    }, [selectedDate, showAll, games]);

    const filterGames = useCallback((games: Game[], date: Date | null) => {
        if (showAll) {
            setFilteredGames(games);
        } else if (date) {
            const filtered = games.filter(game => isSameDay(new Date(game.startDate), date));
            setFilteredGames(filtered);
        }
    }, [showAll]);

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
        setShowAll(false); // Reset showAll when a date is selected
    };

    const handleShowAll = () => {
        setShowAll(true);
    };

    const handleOpenModal = async (game: Game) => {
        // Fetch detailed game info including players
        try {
            const response = await fetch(`/api/getGameDetails?id=${game.id}`);
            if (!response.ok) {
                throw new Error('Error fetching game details');
            }
            const detailedGame = await response.json();
            console.log('Detailed game -> ', JSON.stringify(detailedGame, null, 2));
            setSelectedGame({
                ...game,
                players: detailedGame.participants.map((p: any) => p.users.name),
                creatorId: detailedGame.creator_id,
            });
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleJoinGame = async () => {
        if (selectedGame && session?.user?.id) {
            try {
                const response = await fetch('/api/joinGame', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ gameId: selectedGame.id, userId: session.user.id }),
                });

                if (!response.ok) {
                    throw new Error('Error joining game');
                }

                setSuccessMessage('Apuntado correctamente a la partida');
                setIsSuccessModalOpen(true);

                // Refresh game details to show the updated participant list
                await handleOpenModal(selectedGame);
            } catch (error: any) {
                setError(error.message);
            }
        }
    };

    const handleLeaveGame = async () => {
        if (selectedGame && session?.user?.id) {
            try {
                const response = await fetch('/api/leaveGame', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ gameId: selectedGame.id, userId: session.user.id }),
                });

                if (!response.ok) {
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
                    <Button className={classes.customButton} variant="contained" onClick={handleShowAll}>Mostrar Todas</Button>
                </Box>
            </Box>
            <Box width="80%" maxWidth={1200} mx="auto">
                {error && <Typography color="error">{error}</Typography>}
                <Grid container spacing={2}>
                    {filteredGames.map((game) => (
                        <Grid item xs={12} sm={6} md={4} key={game.id}>
                            <Box onClick={() => handleOpenModal(game)}>
                                <GameCard>
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex="1">
                                        <Thumbnail
                                            src={game.imageUrl || '/noimg.jpg'} // Usa la URL de la imagen obtenida
                                            alt={game.game}
                                        />
                                        <Typography variant="h6">{game.game}</Typography>
                                        <Typography variant="body1">Nº Jugadores: {game.participantCount}/{game.participants}</Typography>
                                        <Typography variant="body2">Inicio: {game.startDate} {game.startTime}</Typography>
                                        <Typography variant="body2">Fin: {game.endDate} {game.endTime}</Typography>
                                        {game.participantCount >= game.participants && (
                                            <Typography sx={fullGameTextStyle}>
                                                Partida completa
                                            </Typography>
                                        )}
                                    </Box>
                                </GameCard>
                            </Box>
                        </Grid>
                    ))}
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
                                {selectedGame.players?.length ? selectedGame.players.map((player, index) => (
                                    <li key={index}>{player}</li>
                                )) : 'N/A'}
                            </ul>
                            {selectedGame.players?.length >= selectedGame.participants && (
                                <Typography sx={fullGameTextStyle}>
                                    Partida completa
                                </Typography>
                            )}
                            {session?.user?.id !== selectedGame.creatorId && !selectedGame.players?.includes(session?.user?.name) && selectedGame.players?.length < selectedGame.participants && (
                                <Box display="flex" justifyContent="center" mt={2}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleJoinGame}
                                    >
                                        QUIERO JUGAR
                                    </Button>
                                </Box>
                            )}

                            {session?.user?.id !== selectedGame.creatorId && selectedGame.players?.includes(session?.user?.name) && (
                                <Box display="flex" justifyContent="center" mt={2}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleLeaveGame}
                                    >
                                        DARSE DE BAJA
                                    </Button>
                                </Box>
                            )}
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
        </Box>
    );
}

export default GamesPage;
