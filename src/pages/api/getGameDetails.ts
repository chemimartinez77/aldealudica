// src\pages\api\getGameDetails.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';
import { parseString } from 'xml2js';

async function fetchGameDetailsFromBGG(gameId: string) {
    const detailsUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}`;
    const response = await fetch(detailsUrl);
    const xml = await response.text();

    return new Promise((resolve, reject) => {
        parseString(xml, (err, result) => {
            if (err) {
                reject(err);
            } else {
                const gameDetails = result.items.item[0];
                const imageUrl = gameDetails && gameDetails.image ? gameDetails.image[0] : '';
                resolve(imageUrl);
            }
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { gameId, id } = req.query;

    if (gameId) {
        try {
            const imageUrl = await fetchGameDetailsFromBGG(gameId as string);
            res.status(200).json({ imageUrl });
        } catch (error) {
            console.error('Error fetching game details:', error);
            res.status(500).json({ error: 'Failed to fetch game details' });
        }
    } else if (id) {
        try {
            // Fetch the game details from the database
            const { data, error } = await supabase
                .from('partidas')
                .select('*')  // Asegúrate de que 'creator_id' esté seleccionado
                .eq('id', id)
                .single();

            console.log('Game details from database:', data);

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            // Fetch the participants for the partida
            const { data: participants, error: participantsError } = await supabase
                .from('partidas_have_users')
                .select('user_id, users ( name )')  // Include the user name
                .eq('partida_id', id)
                .is('leave_date', null)
                .not('join_date', 'is', null);

            console.log('Participants from database:', participants);

            if (participantsError) {
                throw participantsError;
            }

            // Fetch the image URL from BoardGameGeek
            const imageUrl = await fetchGameDetailsFromBGG(data.gameId);

            // Return all the details together
            res.status(200).json({
                ...data,
                imageUrl,
                participants,
                creatorId: data.creatorId  // Ensure creatorId is included
            });
        } catch (error) {
            console.error('Error fetching partida details:', error);
            res.status(500).json({ error: 'Failed to fetch partida details' });
        }
    } else {
        res.status(400).json({ error: 'Missing query parameters' });
    }
}
