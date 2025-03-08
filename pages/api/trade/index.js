import dbConnect from '../../../lib/dbConnect';
import Trade from '../../../models/Trade';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  switch(method) {
    case 'GET':
      try {
        const trades = await Trade.find({});
        res.status(200).json(trades);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    case 'POST':
      try {
        const trade = await Trade.create(req.body);
        res.status(201).json(trade);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    default:
      res.status(405).json({ error: 'Método no permitido' });
  }
}
