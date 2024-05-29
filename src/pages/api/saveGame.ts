// src/pages/api/saveGame.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { formData } = req.body;
        console.log('Received form data:', formData);
        try {
            const { data, error } = await supabase
                .from('partidas')
                .insert([formData]);

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Insert successful:', data);
            res.status(200).json({ message: 'Game saved successfully', data });
        } catch (error) {
            console.error('Error in catch block:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
