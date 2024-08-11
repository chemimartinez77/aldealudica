import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '../../../../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface SessionUser {
    id?: string | null;
    sessionId?: string | null;
    email?: string | null;
    name?: string | null;
    image?: string | null;
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
                session.user.id = typeof token.sub === 'string' ? token.sub : ''; // Verifica si token.sub es un string
                session.user.sessionId = typeof token.sessionId === 'string' ? token.sessionId : ''; // Verifica si token.sessionId es un string
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id ?? uuidv4();
                token.sessionId = uuidv4();
            }
            return token;
        },
        async signIn({ user, account, profile, ...context }) {
            const { req } = context as { req: any };
            const { email, name, id: externalId } = user;
            let ipAddress = req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress || null;

            try {
                if (!externalId) {
                    console.error('External ID is null');
                    return false;
                }

                let userId: string | null = null;

                // Intentar encontrar al usuario por su ID externo
                const { data: existingUser, error: userCheckError } = await supabase
                    .from('users')
                    .select('id, external_id')
                    .eq('external_id', externalId)
                    .single();

                if (userCheckError && userCheckError.code !== 'PGRST116') {
                    throw userCheckError;
                }

                if (existingUser) {
                    userId = existingUser.id;
                } else {
                    // Si no se encuentra el usuario, crearlo
                    userId = uuidv4();
                    const { error: userInsertError } = await supabase
                        .from('users')
                        .insert({ id: userId, external_id: externalId, email, name });

                    if (userInsertError) {
                        throw userInsertError;
                    }
                }

                // Registrar el evento de login en la tabla user_login_history
                const sessionId = uuidv4();
                const { error: loginHistoryError } = await supabase
                    .from('user_login_history')
                    .insert({ user_id: userId, session_id: sessionId, ip_address: ipAddress, login_time: new Date() });

                if (loginHistoryError) {
                    throw loginHistoryError;
                }

                // Actualizar el token con el user_id y session_id real
                (user as SessionUser).id = userId ?? uuidv4();
                (user as SessionUser).sessionId = sessionId ?? uuidv4();

                return true;
            } catch (error) {
                console.error('Error signing in:', error);
                return false;
            }
        }

    },
});

export { handler as GET, handler as POST };
