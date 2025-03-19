// pages/api/partidas/join.js
import dbConnect from "../../../lib/dbConnect";
import Partida from "../../../models/Partida";
import mongoose from "mongoose";

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { partidaId, userId } = req.body;
    if (!partidaId || !userId) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    try {
        const partida = await Partida.findOne({ id: partidaId });
        if (!partida) {
            return res.status(404).json({ error: "Partida no encontrada" });
        }

        // Comprobar si la partida está llena
        if (partida.participants.length >= partida.playerLimit) {
            return res.status(400).json({ error: "La partida está llena" });
        }

        // Comprobar si ya está apuntado
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const yaEsta = partida.participants.some((p) => p.equals(userObjectId));
        if (yaEsta) {
            return res
                .status(400)
                .json({ error: "Ya estás apuntado a la partida" });
        }

        // Apuntar al usuario
        partida.participants.push(userObjectId);
        await partida.save();

        // Volver a buscar la partida, populando "participants"
        const updated = await Partida.findOne({ id: partidaId }).populate(
            "participants"
        );

        // Devolver la partida actualizada (con nombres en participants)
        return res.status(200).json({ partida: updated });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error en el servidor" });
    }
}
