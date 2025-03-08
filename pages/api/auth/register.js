import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { email, name } = req.body;
  // Generar contraseña temporal
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  try {
    const user = await User.create({ email, name, password: hashedPassword, temporaryPassword: true });
    // Envío de correo con Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Tu contraseña temporal',
      text: `Tu contraseña temporal es: ${tempPassword}`
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para la contraseña temporal.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
