import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '../../../../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      session.user.id = token.sub ?? uuidv4();
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? uuidv4();
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      const { email, name } = user;
      try {
        // Intentar encontrar al usuario por su ID externo
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('external_id', user.id)
          .single();

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          // Si ocurre un error distinto de no encontrar filas, lanzarlo
          throw userCheckError;
        }

        if (!existingUser) {
          // Si no se encuentra el usuario, crearlo
          const uuidUserId = uuidv4();
          const { error: userInsertError } = await supabase
            .from('users')
            .insert({ id: uuidUserId, external_id: user.id, email, name });

          if (userInsertError) {
            throw userInsertError;
          }
        }

        return true;
      } catch (error) {
        console.error('Error signing in:', error);
        return false;
      }
    }
  }
});

export { handler as GET, handler as POST };
