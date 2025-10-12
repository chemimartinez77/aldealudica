import dbConnect from "../../../lib/dbConnect";
import Partida from "../../../models/Partida";

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === "PUT") {
    try {
      const { realDuration, scores, winner } = req.body;

      const updateData = {
        realDuration,
        scores,
        winner,
        completed: true,
      };

      // ✅ buscar por el campo "id", no por "_id"
      const updatedPartida = await Partida.findOneAndUpdate(
        { id },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("participants")
        .populate("scores.player")
        .populate("winner");

      if (!updatedPartida) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }

      return res.status(200).json({ success: true, partida: updatedPartida });

    } catch (err) {
      console.error("Error al actualizar la partida:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  if (req.method === "GET") {
    try {
      const partida = await Partida.findOne({ id })
        .populate("participants")
        .populate("scores.player")
        .populate("winner");

      if (!partida) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }

      return res.status(200).json({ partida });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
