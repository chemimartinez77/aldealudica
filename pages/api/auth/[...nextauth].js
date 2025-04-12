import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Correo electrónico", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();
        const { email, password } = credentials;
        const user = await User.findOne({ email });
        if (!user || !user.password) throw new Error("Credenciales inválidas");
        if (!user.verified) throw new Error("Tu cuenta aún no está verificada");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Credenciales inválidas");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  // Configuración explícita de las cookies para entornos de desarrollo
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        //secure: process.env.NODE_ENV === "production", // secure false en dev
        secure: false,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        await dbConnect();

        let doc = await User.findOne({ googleId: user.id });
        if (!doc) {
          doc = await User.findOne({ email: user.email });
          if (!doc) {
            doc = await User.create({
              email: user.email,
              name: user.name,
              password: null,
              verified: true,
              googleId: user.id,
              role: "usuario",
            });
            await sendWelcomeEmail(user.email, user.name);
          } else {
            doc.googleId = user.id;
            await doc.save();
          }
        }
        user.id = doc._id.toString();
        user.name = doc.name;
        user.email = doc.email;
        user.role = doc.role; // Esta línea es crucial para propagar el role
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
        session.user.role = token.role;
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
