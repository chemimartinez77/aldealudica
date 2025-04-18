// pages/api/game-details.js
import dbConnect from "../../lib/dbConnect";
import Game from "../../models/Game";
import { parseStringPromise } from "xml2js";

export default async function handler(req, res) {
  const { bggId } = req.query;
  if (!bggId) return res.status(400).json({ error: "Falta bggId" });

  try {
    await dbConnect();

    // Buscar en MongoDB por bggId
    let game = await Game.findOne({ bggId });
    if (game) {
      return res.status(200).json({ details: game });
    }

    // Si no existe, llamamos a la API de BGG
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`, {
        credentials: 'include' // Añadir esta línea
    });
    const xml = await response.text();
    const parsed = await parseBGGThingXML(xml);

    // Construimos el nuevo documento
    const newGame = new Game({
      bggId,
      name: parsed.name || "Sin nombre",
      image: parsed.image || null,
      yearPublished: parsed.year || "Desconocido",
      minPlayers: parsed.minPlayers || 2,
      maxPlayers: parsed.maxPlayers || 4,
      playingTime: parsed.playingTime || 60,
      description: parsed.description || "",
      categories: parsed.categories || [],
      mechanics: parsed.mechanics || [],
      url: `https://boardgamegeek.com/boardgame/${bggId}`,
    });

    await newGame.save();
    return res.status(200).json({ details: newGame });
  } catch (err) {
    console.error("Error al obtener/guardar juego:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function parseBGGThingXML(xml) {
  try {
    const result = await parseStringPromise(xml);
    const item = result?.items?.item?.[0];
    if (!item) return {};

    return {
      name: item.name?.[0]?.$?.value || "",
      year: item.yearpublished?.[0]?.$?.value || "",
      image: item.image?.[0] || "",
      description: item.description?.[0] || "",
      minPlayers: item.minplayers?.[0]?.$?.value
        ? parseInt(item.minplayers[0].$.value)
        : 2,
      maxPlayers: item.maxplayers?.[0]?.$?.value
        ? parseInt(item.maxplayers[0].$.value)
        : 4,
      playingTime: item.playingtime?.[0]?.$?.value
        ? parseInt(item.playingtime[0].$.value)
        : 60,
      categories: (item.link || [])
        .filter((l) => l.$.type === "boardgamecategory")
        .map((l) => l.$.value),
      mechanics: (item.link || [])
        .filter((l) => l.$.type === "boardgamemechanic")
        .map((l) => l.$.value),
    };
  } catch (err) {
    console.error("Error parseando XML BGG:", err);
    return {};
  }
}
