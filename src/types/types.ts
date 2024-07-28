// src/types/types.ts
export interface Game {
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
