// pages/api/auth/register.js
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res
            .status(400)
            .json({ error: "Faltan datos requeridos o son incorrectos." });
    }

    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "El usuario ya existe." });
        }

        // Generar una contraseña temporal (opcional)
        // const tempPassword = Math.random().toString(36).slice(-8);
        // const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generar un token de verificación seguro
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Crear usuario en la base de datos
        const user = await User.create({
            email,
            name,
            password: hashedPassword,
            temporaryPassword: false,
            verified: false,
            verificationToken,
        });

        // Construir URL de verificación
        if (!process.env.NEXT_PUBLIC_APP_URL) {
            throw new Error("NEXT_PUBLIC_APP_URL no está configurado");
        }
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${verificationToken}`;

        // Verificar que las variables de entorno están definidas
        if (
            !process.env.EMAIL_HOST ||
            !process.env.EMAIL_USER ||
            !process.env.EMAIL_PASS
        ) {
            console.error(
                "Error: Variables de entorno de correo no configuradas"
            );
            return res.status(500).json({
                error: "Error en la configuración del servidor de correo",
            });
        }

        // Configurar transporte de Nodemailer (SMTP)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587, // Puerto 587 para STARTTLS o 465 para SSL/TLS
            secure: Number(process.env.EMAIL_PORT) === 465, // True si se usa SSL/TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Opciones del correo
        const mailOptions = {
            from: `"Aldea Lúdica" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Confirma tu registro en Aldea Lúdica",
            html: `
        <p>Hola, ${name}.</p>
        <p>¡Gracias por registrarte en Aldea Lúdica!</p>
        <p>Para completar tu registro, confirma tu cuenta haciendo clic en el siguiente enlace:</p>
        <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
        <p>Si no solicitaste este registro, puedes ignorar este mensaje.</p>
        <p>Saludos,<br>El equipo de Aldea Lúdica</p>
      `,
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message:
                "Usuario registrado. Revisa tu correo para confirmar tu cuenta.",
        });
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({
            error: "Error en el servidor. Intenta más tarde.",
        });
    }
}
