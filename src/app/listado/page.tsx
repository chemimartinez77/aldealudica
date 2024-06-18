"use client"

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import { styled } from '@mui/material/styles'

interface Game {
    id: string;
    game: string;
    title: string;
    participants: number;
    gameId: string;
    imageUrl: string;
}

const Thumbnail = styled('img')({
    height: '150px', // Ajusta la altura según sea necesario
    width: '150px', // Ajusta el ancho según sea necesario
    borderRadius: '6px',
    objectFit: 'contain',
    marginBottom: '8px' // Añade un margen inferior para separar la imagen del texto
});

const GamesPage = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [error, setError] = useState<string | null>(null);

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
                    return { ...game, imageUrl: detailsData.imageUrl };
                }));

                setGames(gamesWithImages);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchGames();
    }, []);

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" py={4}>
            <Box width="90%" maxWidth={1200} mx="auto">
                {error && <Typography color="error">{error}</Typography>}
                <Grid container spacing={4}>
                    {games.map((game) => (
                        <Grid item xs={12} sm={6} md={4} key={game.id}>
                            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                                <Thumbnail 
                                    src={game.imageUrl || '/noimg.jpg'} // Usa la URL de la imagen obtenida
                                    alt={game.game} 
                                />
                                <Typography variant="h6">{game.game}</Typography>
                                <Typography variant="body1">Participantes: {game.participants}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    )
}

export default GamesPage
