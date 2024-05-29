// src/utils/supabase-utils.ts

import { supabase } from './supabaseClient'

export const addUserIfNotExist = async (email: string, name: string) => {
    try {
        // Verificar si el usuario ya existe
        let { data: users, error: selectError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)

            if (selectError) {
                console.error('Error checking user:', selectError);
                return;
            }

        // Si no se encontraron usuarios con ese email, insertar uno nuevo
        if (!users || users.length === 0) {
            const { data, error: insertError } = await supabase
                .from('users')
                .insert([{ email, name }]);

            if (insertError) {
                console.error('Error adding user:', insertError);
            } else {
                console.log('User added:', email);
            }
        } else {
            console.log('User already exists with email:', email);
        }
    } catch (error) {
        console.error('Error in addUserIfNotExist:', error)
    }
}
