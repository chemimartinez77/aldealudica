// pages/api/partidas/[id].js
import dbConnect from "../../../lib/dbConnect";
import Partida from "../../../models/Partida";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const partida = await Partida.findOne({ id })
        .populate("participants")
        .populate("gameDetails")
        .lean();

      if (!partida) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }

      return res.status(200).json({ partida });
    } catch (error) {
      console.error("Error en GET /api/partidas/[id]:", error);
      return res.status(500).json({ error: "Error al obtener la partida" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { realDuration, scores, winner } = req.body;

      // Validaciones básicas
      if (
        !realDuration ||
        typeof realDuration.hours !== "number" ||
        typeof realDuration.minutes !== "number"
      ) {
        return res.status(400).json({ error: "Duración inválida" });
      }

      if (!Array.isArray(scores)) {
        return res.status(400).json({ error: "Formato de puntuaciones inválido" });
      }

      const partida = await Partida.findOne({ id });
      if (!partida) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }

      // Comprobamos que todos los player IDs estén entre los participantes
      const participantIds = partida.participants.map((p) => p.toString());
      for (const s of scores) {
        if (!s.player || !participantIds.includes(s.player.toString())) {
          return res.status(400).json({ error: `Participante inválido: ${s.player}` });
        }
      }

      partida.realDuration = realDuration;
      partida.scores = scores;
      partida.winner = winner;

      await partida.save();

      await partida.populate("participants");
      await partida.populate("gameDetails");

      return res.status(200).json({ success: true, partida });
    } catch (error) {
      console.error("Error en PUT /api/partidas/[id]:", error);
      return res.status(500).json({ error: "Error al guardar los resultados" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
