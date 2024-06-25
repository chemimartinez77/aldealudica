// src/app/partidas/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../utils/supabaseClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

interface GameDetails {
    game: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location: string;
    participants: number;
    imageUrl: string;
}

const GameDetailPage = () => {
    const { id } = useParams();
    const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGameDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('partidas')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    setError(error.message);
                    return;
                }

                const detailsResponse = await fetch(`../api/getGameDetails?gameId=${data.gameId}`);
                const detailsData = await detailsResponse.json();

                setGameDetails({ ...data, imageUrl: detailsData.imageUrl });
            } catch (error) {
                setError('Failed to fetch game details');
            }
        };

        fetchGameDetails();
    }, [id]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!gameDetails) {
        return <div>Loading...</div>;
    }

    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
            <Box width="66.66%" maxWidth={600} mx="auto">
                <Image src={gameDetails.imageUrl} alt={gameDetails.game} width={200} height={200} />
                <Typography variant="h4">{gameDetails.game}</Typography>
                <Typography variant="body1">Inicio: {gameDetails.startDate} {gameDetails.startTime}</Typography>
                <Typography variant="body1">Fin: {gameDetails.endDate} {gameDetails.endTime}</Typography>
                <Typography variant="body1">Lugar: {gameDetails.location}</Typography>
                <Typography variant="body1">Número de jugadores: {gameDetails.participants}</Typography>
            </Box>
        </Box>
    );
};

export default GameDetailPage;
