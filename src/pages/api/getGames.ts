import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('partidas')
                .select(`
                    *,
                    participantes:partidas_have_users (
                        user_id,
                        join_date,
                        leave_date
                    )
                `);

            if (error) {
                console.error('Error fetching games:', error);
                throw error;
            }

            const gamesWithParticipantCount = data.map(game => {
                const activeParticipants = game.participantes.filter((p: any) => p.join_date !== null && p.leave_date === null);
                return {
                    ...game,
                    participantCount: activeParticipants.length
                };
            });

            res.status(200).json(gamesWithParticipantCount);
        } catch (error) {
            console.error('Error in catch block:', error);
            const errorMessage = (error as Error).message; // Type assertion
            res.status(500).json({ error: errorMessage });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
