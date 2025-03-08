import dbConnect from '../../../lib/dbConnect';
import News from '../../../models/News';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  switch(method) {
    case 'GET':
      try {
        const news = await News.find({});
        res.status(200).json(news);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    case 'POST':
      try {
        const newsItem = await News.create(req.body);
        res.status(201).json(newsItem);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    default:
      res.status(405).json({ error: 'Método no permitido' });
  }
}
