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
    return res.redirect('/verify-invalid');
  }

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.redirect('/verify-invalid');
    }

    if (user.verified) {
      return res.redirect('/verify-already');
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.redirect('/verify-success');
  } catch (error) {
    console.error("Error al verificar usuario:", error);
    return res.redirect('/verify-error');
  }
}
