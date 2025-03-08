import dbConnect from '../../../lib/dbConnect';
import Event from '../../../models/Event';
import { sendPushNotification, sendWhatsAppNotification } from '../../../services/notifications/notifications';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  switch(method) {
    case 'GET':
      try {
        const events = await Event.find({});
        res.status(200).json(events);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    case 'POST':
      try {
        const event = await Event.create(req.body);
        // Enviar notificaciones (Push y WhatsApp)
        await sendPushNotification(event);
        await sendWhatsAppNotification(event);
        res.status(201).json(event);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    default:
      res.status(405).json({ error: 'Método no permitido' });
  }
}
