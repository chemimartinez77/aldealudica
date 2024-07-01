import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { gameId, userId } = req.body;
        try {
            const { data, error } = await supabase
                .from('partidas_have_users')
                .update({
                    leave_date: new Date()
                })
                .eq('partida_id', gameId)
                .eq('user_id', userId)
                .is('leave_date', null);

            if (error) {
                console.error('Error leaving game:', error);
                throw error;
            }

            res.status(200).json(data);
        } catch (error) {
            console.error('Error in catch block:', error);
            const errorMessage = (error as Error).message; // Type assertion
            res.status(500).json({ error: errorMessage });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
