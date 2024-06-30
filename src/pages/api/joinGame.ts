import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { gameId, userId } = req.body;
        try {
            const { data, error } = await supabase
                .from('partidas_have_users')
                .insert({
                    partida_id: gameId,
                    user_id: userId,
                    join_date: new Date()
                });

            if (error) {
                console.error('Error joining game:', error);
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
