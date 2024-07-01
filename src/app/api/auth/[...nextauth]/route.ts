import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '../../../../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Extender el tipo DefaultUser para incluir `id` y `sessionId`
interface SessionUser extends DefaultUser {
    id: string;
    sessionId: string;
}

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                (session.user as SessionUser).id = token.sub ?? uuidv4();
                (session.user as SessionUser).sessionId = (token.sessionId as string) ?? uuidv4(); // Almacenar sessionId en el objeto de sesión
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = (user as SessionUser).id ?? uuidv4();
                token.sessionId = uuidv4(); // Generar y almacenar sessionId en el token
            }
            return token;
        },
        async signIn({ user, account, profile, ...context }) {
            const { req } = context as { req: any }; // Castear context a tipo que contiene req
            const { email, name } = user;
            let ipAddress = req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress || null;

            try {
                let userId = (user as SessionUser).id;

                // Intentar encontrar al usuario por su ID externo
                const { data: existingUser, error: userCheckError } = await supabase
                    .from('users')
                    .select('id, external_id')
                    .eq('external_id', user.id)
                    .single();

                if (userCheckError && userCheckError.code !== 'PGRST116') {
                    // Si ocurre un error distinto de no encontrar filas, lanzarlo
                    throw userCheckError;
                }

                if (!existingUser) {
                    // Si no se encuentra el usuario, crearlo
                    userId = uuidv4();
                    const { error: userInsertError } = await supabase
                        .from('users')
                        .insert({ id: userId, external_id: user.id, email, name });

                    if (userInsertError) {
                        throw userInsertError;
                    }
                } else {
                    userId = existingUser.id;
                }

                // Registrar el evento de login en la tabla user_login_history
                const sessionId = uuidv4(); // Generar sessionId para la sesión
                const { error: loginHistoryError } = await supabase
                    .from('user_login_history')
                    .insert({ user_id: userId, session_id: sessionId, ip_address: ipAddress, login_time: new Date() });

                if (loginHistoryError) {
                    throw loginHistoryError;
                }

                // Actualizar el token con el user_id y session_id real
                (user as SessionUser).id = userId;
                (user as SessionUser).sessionId = sessionId; // Almacenar sessionId en el user

                return true;
            } catch (error) {
                console.error('Error signing in:', error);
                return false;
            }
        },
        // async signOut({ token }) {
        //     // Registrar el evento de logout en la tabla user_login_history
        //     try {
        //         const { error: logoutHistoryError } = await supabase
        //             .from('user_login_history')
        //             .update({ logout_time: new Date() })
        //             .eq('session_id', token.sessionId as string) // Utilizar sessionId para actualizar logout_time
        //             .is('logout_time', null);

        //         if (logoutHistoryError) {
        //             console.error('Error updating logout time:', logoutHistoryError);
        //         }
        //         return true;
        //     } catch (error) {
        //         console.error('Error signing out:', error);
        //         return false;
        //     }
        // },
    },
});

export { handler as GET, handler as POST };
