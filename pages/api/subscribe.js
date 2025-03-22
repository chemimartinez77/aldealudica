// pages/api/subscribe.js
import dbConnect from '../../lib/dbConnect';
import Subscription from '../../models/Subscription';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === 'POST') {
    const subscription = req.body;
    // Aquí podrías asociar la suscripción al usuario autenticado (si lo tienes en sesión)
    try {
      // Guarda o actualiza la suscripción
      await Subscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        subscription,
        { upsert: true }
      );
      return res.status(200).json({ message: 'Suscripción guardada' });
    } catch (error) {
      return res.status(500).json({ error: 'Error guardando la suscripción' });
    }
  }
  return res.status(405).json({ error: 'Método no permitido' });
}
