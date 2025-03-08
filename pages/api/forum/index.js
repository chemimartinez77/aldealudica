import dbConnect from '../../../lib/dbConnect';
import Forum from '../../../models/Forum';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  switch(method) {
    case 'GET':
      try {
        const threads = await Forum.find({});
        res.status(200).json(threads);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    case 'POST':
      try {
        const thread = await Forum.create(req.body);
        res.status(201).json(thread);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    default:
      res.status(405).json({ error: 'Método no permitido' });
  }
}
