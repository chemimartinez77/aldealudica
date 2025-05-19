import dbConnect from '../../../../lib/dbConnect';
import Partida from '../../../../models/Partida';

export default async function handler(req, res) {
  await dbConnect();
  const { userId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Popula gameDetails e info básica de participantes
    const partidas = await Partida.find({ participants: userId })
      .populate('gameDetails', 'image name')
      .populate('participants', 'name _id')
      .sort({ date: -1 })
      .lean();

    res.status(200).json({ partidas });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las partidas del usuario' });
  }
}