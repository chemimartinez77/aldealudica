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
    participants: string | number;
    participate: boolean;
    location: string;
    address: string;
    authorization: boolean;
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
