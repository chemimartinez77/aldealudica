// src/pages/api/getGames.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('partidas')
                .select('*');

            if (error) {
                console.error('Error fetching games:', error);
                throw error;
            }

            res.status(200).json(data);
        } catch (error) {
            console.error('Error in catch block:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
