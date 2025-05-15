// pages/api/partidas/join.js
import dbConnect from "../../../lib/dbConnect";
import Partida from "../../../models/Partida";

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { partidaId, userId } = req.body;

    if (!partidaId || !userId) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
        const partida = await Partida.findOne({ id: partidaId });

        if (!partida) {
            return res.status(404).json({ error: "Partida no encontrada" });
        }

        const userIdStr = userId.toString();

        const index = partida.participants.findIndex(p => {
            const id = p._id?.toString?.() ?? p?.toString?.();
            return id === userIdStr;
        });

        if (index === -1) {
            // Usuario no está apuntado: lo apuntamos
            if (partida.participants.length >= partida.playerLimit) {
                return res.status(400).json({ error: "La partida ya está completa" });
            }

            partida.participants.push(userIdStr);
        } else {
            // Usuario ya está apuntado: lo quitamos
            partida.participants.splice(index, 1);
        }

        await partida.save();

        const partidaPopulada = await Partida.findOne({ id: partidaId })
            .populate("participants")
            .populate("gameDetails");

        return res.status(200).json({ partida: partidaPopulada });

    } catch (error) {
        console.error("Error en /api/partidas/join:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
}
