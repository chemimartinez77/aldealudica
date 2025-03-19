import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import nodemailer from "nodemailer";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * 1) signIn:
     *    - Se ejecuta al hacer login con Google (u otro proveedor).
     *    - Normalmente se devuelve `true` o `false` para permitir o denegar el acceso.
     *    - Aquí aprovechamos para crear o actualizar el usuario en nuestra BD
     *      y sobrescribir user.id con doc._id.toString().
     */
    async signIn({ user }) {
      // user => { id (googleId), name, email, image, ... }

      await dbConnect();

      // Buscar por googleId
      let doc = await User.findOne({ googleId: user.id });
      if (!doc) {
        // Si no existe por googleId, buscar por email
        doc = await User.findOne({ email: user.email });
        if (!doc) {
          // No existe => crear
          doc = await User.create({
            email: user.email,
            name: user.name,
            password: null,
            verified: true,
            googleId: user.id, // asignar googleId
          });
          await sendWelcomeEmail(user.email, user.name);
        } else {
          // Existe por email => asignar googleId
          doc.googleId = user.id;
          await doc.save();
        }
      }

      // Sobrescribimos user.id con el _id de Mongo (string)
      user.id = doc._id.toString();

      // Opcionalmente, también podemos actualizar user.name / user.email 
      // con lo que haya en doc
      user.name = doc.name;
      user.email = doc.email;

      // Retornamos `true` para permitir el login
      return true;
    },

    /**
     * 2) jwt:
     *    - Se llama cada vez que se crea o actualiza el token JWT en el servidor.
     *    - 'user' solo estará definido la primera vez que el usuario se loguea.
     *      Después vendrá undefined, y solo tendremos 'token'.
     *    - Copiamos lo que nos interese (id, name, email...) del 'user' al 'token'.
     */
    async jwt({ token, user }) {
      // Si user existe, significa que es la primera vez (login o refresh tras signIn)
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    /**
     * 3) session:
     *    - Se llama cada vez que se consulta la sesión (useSession() o getSession()).
     *    - Copiamos del token a session.user para que en el front tengamos session.user.id.
     */
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      }
      if (token?.name) {
        session.user.name = token.name;
      }
      if (token?.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
});

/**
 * Envía un email de bienvenida cuando creamos un nuevo usuario.
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Aldea Lúdica" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "¡Bienvenido a Aldea Lúdica!",
      html: `
        <p>Hola, ${name}.</p>
        <p>Te has registrado correctamente con Google.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>¡Bienvenido a la comunidad!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error al enviar correo de bienvenida:", error);
  }
};
