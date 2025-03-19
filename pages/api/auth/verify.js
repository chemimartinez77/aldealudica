// pages/api/auth/verify.js
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'No se proporcionó un token de verificación.' });
  }

  try {
    // Buscar al usuario con ese token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Token inválido o el usuario no existe.' });
    }

    // Marcar como verificado y limpiar el token
    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    // Redirigir a una página de "verificación exitosa"
    // Por ejemplo, /verify-success (puede ser una página de Next.js)
    return res.redirect('/verify-success');
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
