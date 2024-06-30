"use client"

// src/app/partidas/[id]/page.tsx
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface GameDetails {
    id: string;
    game: string;
    imageUrl: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    participants: number;
    location: string;
}

interface Participant {
    user_id: string;
    users: {
        name: string;
    };
}

const GameDetailPage = () => {
    const { id } = useParams();
    const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGameDetails = async () => {
            try {
                const response = await fetch(`/api/getGameDetails?id=${id}`);
                if (!response.ok) {
                    throw new Error('Error fetching game details');
                }
                const data = await response.json();
                setGameDetails(data);
                setParticipants(data.participants);
            } catch (error) {
                setError((error as Error).message);
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
        <Box>
            <Typography variant="h4">{gameDetails.game}</Typography>
            <Image
                src={partida.imageUrl || '/noimg.jpg'}
                alt={partida.title}
                width={200}
                height={200}
                style={{ borderRadius: '10px' }}
            />
            <Typography variant="body1">Inicio: {gameDetails.startDate} {gameDetails.startTime}</Typography>
            <Typography variant="body1">Fin: {gameDetails.endDate} {gameDetails.endTime}</Typography>
            <Typography variant="body1">Nº Jugadores: {gameDetails.participants}</Typography>
            <Typography variant="body1">Lugar: {gameDetails.location}</Typography>
            <Typography variant="body1">Jugadores:</Typography>
            <ul>
                {participants.map((participant) => (
                    <li key={participant.user_id}>{participant.users.name}</li>
                ))}
            </ul>
        </Box>
    );
};

export default GameDetailPage;
