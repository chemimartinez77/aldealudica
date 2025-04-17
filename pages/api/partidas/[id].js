// pages/api/partidas/[id].js
import dbConnect from "../../../lib/dbConnect";
import Partida from "../../../models/Partida";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      // Buscamos la partida por su campo "id" (no _id) y hacemos populate de "participants"
      const partida = await Partida.findOne({ id }).populate("participants").populate("gameDetails").lean();
      if (!partida) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }
      return res.status(200).json({ partida });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al obtener la partida" });
    }
  }

  // Otros métodos (PUT, DELETE, etc.) si los necesitas
  return res.status(405).json({ error: "Método no permitido" });
}
