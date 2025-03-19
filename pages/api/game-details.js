// pages/api/game-details.js
import { MongoClient } from "mongodb";
import { parseStringPromise } from "xml2js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db(MONGODB_DB);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export default async function handler(req, res) {
  const { bggId } = req.query;
  if (!bggId) return res.status(400).json({ error: "Falta bggId" });
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("bggGames");

    // Consultar si el juego ya existe en la colección
    let game = await collection.findOne({ bggId });
    if (game) {
      return res.status(200).json({ details: game });
    } else {
      // Si no existe, llamamos a la API de BGG
      const response = await fetch(
        `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`
      );
      const xml = await response.text();
      const details = await parseBGGThingXML(xml);
      // Incluimos el bggId en los detalles
      details.bggId = bggId;
      // Guardar en MongoDB
      await collection.insertOne(details);
      return res.status(200).json({ details });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function parseBGGThingXML(xml) {
  try {
    const result = await parseStringPromise(xml);
    if (result.items && result.items.item && result.items.item.length > 0) {
      const item = result.items.item[0];
      return {
        name:
          item.name && item.name[0] && item.name[0].$.value
            ? item.name[0].$.value
            : "Sin nombre",
        year:
          item.yearpublished &&
          item.yearpublished[0] &&
          item.yearpublished[0].$.value
            ? item.yearpublished[0].$.value
            : "Desconocido",
        image: item.image ? item.image[0] : null,
        // Ejemplo: extraer "weight" del objeto ratings
        weight:
          item.statistics &&
          item.statistics[0] &&
          item.statistics[0].ratings &&
          item.statistics[0].ratings[0] &&
          item.statistics[0].ratings[0].average &&
          item.statistics[0].ratings[0].average[0]
            ? item.statistics[0].ratings[0].average[0]
            : null,
        // Puedes incluir más propiedades según necesites
      };
    }
    return {};
  } catch (err) {
    return {};
  }
}
