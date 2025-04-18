import { parseStringPromise } from "xml2js";
import { MongoClient } from "mongodb";

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
  const { query } = req.query;
  try {
    // 1) Llamada a la API de BGG
    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}`,
      {
        credentials: 'include' // Añadir esta línea
      }
    );
    const text = await response.text();
    let results = await parseBGGXML(text);

    // 2) Conectar a MongoDB para ver si tenemos imagen guardada
    const { db } = await connectToDatabase();
    const collection = db.collection("bggGames");

    // 3) Para cada resultado, si existe en la BD, añadimos la imagen
    const updatedResults = [];
    for (const r of results) {
      const existing = await collection.findOne({ bggId: r.id });
      if (existing && existing.image) {
        updatedResults.push({ ...r, image: existing.image });
      } else {
        updatedResults.push(r);
      }
    }

    return res.status(200).json({ results: updatedResults });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function parseBGGXML(xml) {
  try {
    const result = await parseStringPromise(xml);
    if (!result.items || !result.items.item) return [];
    return result.items.item.map((item) => ({
      id: item.$.id,
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
    }));
  } catch (err) {
    throw new Error("Error parsing XML");
  }
}
