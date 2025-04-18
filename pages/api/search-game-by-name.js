// pages/api/search-game-by-name.js
import dbConnect from "../../lib/dbConnect";
import Game from "../../models/Game";

export default async function handler(req, res) {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({ error: "Falta el nombre del juego" });
  }
  
  try {
    await dbConnect();
    
    // Buscar el juego por nombre (usando una expresión regular para hacer la búsqueda insensible a mayúsculas/minúsculas)
    const game = await Game.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (game) {
      return res.status(200).json({ game });
    } else {
      return res.status(404).json({ message: "Juego no encontrado" });
    }
  } catch (err) {
    console.error("Error al buscar juego por nombre:", err);
    return res.status(500).json({ error: err.message });
  }
}