// pages/api/partidas/index.js
import dbConnect from "../../../lib/dbConnect";
import Partida from "../../../models/partida";
import mongoose from "mongoose";
import webpush from "web-push";
import Subscription from "../../../models/Subscription";
import Game from "../../../models/Game";

// Configurar VAPID (asegúrate de tener las variables definidas en tu .env)
webpush.setVapidDetails(
  "mailto:aldealudica2023@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  await dbConnect();
  console.log("✅ Conectado correctamente a MongoDB");

  if (req.method === "GET") {
    try {
      const partidas = await Partida.find({}).populate("gameDetails");

      console.log("✅ Partidas encontradas:", partidas.length);
      console.log(partidas);

      return res.status(200).json({ partidas: partidas || [] });
    } catch (error) {
      console.error("❌ Error en GET /api/partidas:", error);
      return res.status(200).json({ partidas: [] });
    }
  }

  if (req.method === "PUT") {
    try {
      const {
        id,
        title,
        game,
        gameDetails,
        description,
        date,
        startTime,
        endTime,
        playerLimit,
        creatorParticipates,
        location,
        creatorId,
        participants,
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
      partida.gameDetails = gameDetails?._id || null;
      partida.description = description;
      partida.date = date;
      partida.startTime = startTime;
      partida.endTime = endTime;
      partida.playerLimit = playerLimit;
      partida.creatorParticipates = creatorParticipates;
      partida.location = location;
      partida.creatorId = creatorObjectId;

      if (Array.isArray(participants)) {
        partida.participants = participants
          .map((p) => {
            if (p instanceof mongoose.Types.ObjectId) return p;
            if (p && typeof p === "object") {
              const idStr = p._id?.toString?.() ?? p.toString();
              return mongoose.Types.ObjectId(idStr);
            }
            if (typeof p === "string") return mongoose.Types.ObjectId(p);
            return null;
          })
          .filter(Boolean);
      }

      await partida.save();
      const partidaActualizada = await Partida.findOne({ id: partida.id }).populate("gameDetails");

      const subscriptions = await Subscription.find({});
      const payload = JSON.stringify({
        title: "Partida actualizada",
        body: `La partida "${partida.title}" ha sido actualizada.`,
      });

      subscriptions.forEach(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (error) {
          console.error("Error enviando notificación push", error);
        }
      });

      return res.status(200).json({ partida: partidaActualizada });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al actualizar la partida" });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        title,
        game,
        gameDetails,
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
        gameDetails: gameDetails?._id || null,
        description,
        date,
        startTime,
        endTime,
        playerLimit,
        creatorParticipates,
        location,
        creatorId: creatorObjectId,
      });

      if (creatorParticipates) {
        nuevaPartida.participants.push(creatorObjectId);
      }

      await nuevaPartida.save();
      const partidaGuardada = await Partida.findOne({ id: nuevaPartida.id }).populate("gameDetails");

      const subscriptions = await Subscription.find({});
      const payload = JSON.stringify({
        title: "Nueva partida creada",
        body: `Se ha creado la partida "${nuevaPartida.title}".`,
      });

      subscriptions.forEach(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (error) {
          console.error("Error enviando notificación push", error);
        }
      });

      return res.status(200).json({ partida: partidaGuardada });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al crear la partida" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "No se ha proporcionado un id" });
      }

      const partida = await Partida.findOne({ id });
      if (!partida) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }

      await Partida.deleteOne({ id });

      return res.status(200).json({ message: "Partida eliminada" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al eliminar la partida" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
