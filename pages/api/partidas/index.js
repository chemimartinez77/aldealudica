// pages/api/partidas/index.js
import dbConnect from "../../../lib/dbConnect";
import Partida from "../../../models/Partida";
import mongoose from "mongoose";

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === "GET") {
        // Ejemplo: listar partidas
        // Podrías hacer .populate("participants") si quieres traer los datos de usuario
        try {
            const partidas = await Partida.find({});
            return res.status(200).json({ partidas });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error al obtener partidas" });
        }
    }

    if (req.method === "PUT") {
        try {
            const {
                id,
                title,
                game,
                description,
                date,
                startTime,
                endTime,
                playerLimit,
                creatorParticipates,
                location,
                creatorId,
            } = req.body;

            if (!mongoose.isValidObjectId(creatorId)) {
                return res
                    .status(400)
                    .json({ error: "creatorId no es un ObjectId válido" });
            }
            const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

            const partida = await Partida.findOne({ id });
            if (!partida) {
                return res.status(404).json({ error: "Partida no encontrada" });
            }

            partida.title = title;
            partida.game = game;
            partida.description = description;
            partida.date = date;
            partida.startTime = startTime;
            partida.endTime = endTime;
            partida.playerLimit = playerLimit;
            partida.creatorParticipates = creatorParticipates;
            partida.location = location;
            partida.creatorId = creatorObjectId;

            await partida.save();

            return res.status(200).json({ partida });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ error: "Error al actualizar la partida" });
        }
    }

    if (req.method === "POST") {
        // Crear nueva partida
        try {
            const {
                title,
                game,
                description,
                date,
                startTime,
                endTime,
                playerLimit,
                creatorParticipates,
                location,
                creatorId,
            } = req.body;

            if (!mongoose.isValidObjectId(creatorId)) {
                return res
                    .status(400)
                    .json({ error: "creatorId no es un ObjectId válido" });
            }
            const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

            const nuevaPartida = new Partida({
                title,
                game,
                description,
                date,
                startTime,
                endTime,
                playerLimit,
                creatorParticipates,
                location,
                creatorId: creatorObjectId,
            });

            // Si el creador participa, lo añadimos al array participants
            if (creatorParticipates) {
                nuevaPartida.participants.push(creatorObjectId);
            }

            await nuevaPartida.save();

            return res.status(200).json({ partida: nuevaPartida });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error al crear la partida" });
        }
    }

    // AGREGAR ESTE BLOQUE:
    if (req.method === "DELETE") {
        try {
            const { id } = req.query; // /api/partidas?id=xxxx
            if (!id) {
                return res
                    .status(400)
                    .json({ error: "No se ha proporcionado un id" });
            }

            const partida = await Partida.findOne({ id });
            if (!partida) {
                return res.status(404).json({ error: "Partida no encontrada" });
            }

            // Eliminar la partida
            await Partida.deleteOne({ id });
            // o: await partida.remove(); // Ambas formas funcionan.

            return res.status(200).json({ message: "Partida eliminada" });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ error: "Error al eliminar la partida" });
        }
    }

    // Si llega otro método, no lo permitimos
    return res.status(405).json({ error: "Método no permitido" });
}
