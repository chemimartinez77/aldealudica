// src/pages/api/saveGame.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { formData, userId, session } = req.body;
        console.log('Received form data:', formData, 'UserId:', userId, 'Session:', session);

        try {
            // Verifica si el usuario ya existe en la tabla 'users'
            const { data: existingUser, error: userCheckError } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('external_id', userId)
                .single();

            console.log('User check result:', existingUser, 'Error:', userCheckError);

            let uuidUserId;
            if (userCheckError && userCheckError.code !== 'PGRST116') {
                // Si hay un error al verificar, registramos el error y devolvemos una respuesta
                console.error('Error checking user:', userCheckError);
                res.status(500).json({ error: 'Error checking user' });
                return;
            } else if (!existingUser) {
                const { name, email } = session.user;

                if (!name || !email) {
                    res.status(400).json({ error: 'Missing user information' });
                    return;
                }

                uuidUserId = uuidv4();
                const { error: userInsertError } = await supabase
                    .from('users')
                    .insert({ id: uuidUserId, external_id: userId, name, email });

                if (userInsertError) {
                    console.error('Error inserting user:', userInsertError);
                    res.status(500).json({ error: 'Error inserting user' });
                    return;
                }
                console.log('New user created with ID:', uuidUserId);
            } else {
                // Si el usuario ya existe, usamos su ID
                uuidUserId = existingUser.id;
                console.log('Existing user found with ID:', uuidUserId);
            }

            // Inserta los datos del formulario en la tabla 'partidas'
            const { data: partidaData, error: partidaInsertError } = await supabase
                .from('partidas')
                .insert([formData])
                .select('id')
                .single();

            if (partidaInsertError) {
                console.error('Error inserting partida:', partidaInsertError);
                throw partidaInsertError;
            }

            if (!partidaData || !partidaData.id) {
                throw new Error('Failed to retrieve partida ID after insert');
            }

            const partidaId = partidaData.id;
            console.log('Partida inserted with ID:', partidaId);

            const joinDate = new Date().toISOString();
            const { error: userPartidaInsertError } = await supabase
                .from('partidas_have_users')
                .insert({ user_id: uuidUserId, partida_id: partidaId, join_date: joinDate });

            if (userPartidaInsertError) {
                console.error('Error inserting user into partida:', userPartidaInsertError);
                throw userPartidaInsertError;
            }
            console.log('User inserted into partida with ID:', partidaId);

            console.log('Insert successful:', partidaData);
            res.status(200).json({ message: 'Game saved successfully', data: partidaData });
        } catch (error) {
            console.error('Error in catch block:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
