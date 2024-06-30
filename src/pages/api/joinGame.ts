// src/pages/api/joinGame.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { gameId, userId } = req.body;

        try {
            // Verificar si el usuario ya está inscrito en la partida y se ha dado de baja
            const { data: existingEntry, error: selectError } = await supabase
                .from('partidas_have_users')
                .select('*')
                .eq('partida_id', gameId)
                .eq('user_id', userId)
                .single();

            if (selectError && selectError.code !== 'PGRST116') {
                console.error('Select Error:', selectError);
                throw selectError;
            }

            if (existingEntry) {
                return res.status(400).json({ message: 'Ya estás inscrito en la partida o te borraste de ella, contacta con un administrador' });
            }

            // Crear un nuevo registro
            const { error: insertError } = await supabase
                .from('partidas_have_users')
                .insert({ partida_id: gameId, user_id: userId, join_date: new Date() });

            if (insertError) {
                console.error('Insert Error:', insertError);
                throw insertError;
            }

            res.status(200).json({ message: 'Joined game successfully' });
        } catch (error) {
            console.error('Error joining game:', error);
            res.status(500).json({ error: 'Failed to join game' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
