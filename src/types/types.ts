// src/types/types.ts

export interface Game {
    id?: string;
    game: string;
    gameId: string;
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    participantes: string[];
    participants: string | number;
    participantCount?: number; // Número de participantes actuales
    participate: boolean;
    location: string;
    address: string;
    authorization: boolean;
    players?: string[]; // Lista de jugadores, puede ser opcional
    imageUrl?: string; // URL de la imagen, puede ser opcional
    creatorId?: string; // ID del creador de la partida
}


export interface GameResponse {
    game: string;
    title: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    participants: string | number;
    location: string;
    address: string;
}

export interface Participant {
    user_id: string;
    users: {
        name: string;
    };
}