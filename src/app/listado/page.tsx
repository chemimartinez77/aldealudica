// src/app/listado/page.tsx
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

interface Game {
    id: string;
    game: string;
    title: string;
    participants: number;
    gameId: string;
    imageUrl: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location: string;
    players?: string[]; // Marcar players como opcional
}

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

const GamesPage = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [showAll, setShowAll] = useState<boolean>(false);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);

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

    const handleOpenModal = (game: Game) => {
        setSelectedGame(game);
    };

    const handleCloseModal = () => {
        setSelectedGame(null);
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
                    <Button variant="contained" onClick={handleShowAll}>Mostrar Todas</Button>
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
                                        <Typography variant="body1">Nº Jugadores: {game.participants}</Typography>
                                        <Typography variant="body2">Inicio: {game.startDate} {game.startTime}</Typography>
                                        <Typography variant="body2">Fin: {game.endDate} {game.endTime}</Typography>
                                    </Box>
                                </GameCard>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Modal
                open={!!selectedGame}
                onClose={handleCloseModal}
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
                            <Typography id="game-modal-description" sx={{ mt: 2 }}>
                                <strong>Jugadores:</strong> {selectedGame.players ? selectedGame.players.join(', ') : 'N/A'}
                            </Typography>
                        </>
                    )}
                </Box>
            </Modal>
        </Box>
    );
}

export default GamesPage;
