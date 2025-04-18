// models/Game.js
import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
  bggId: { type: String, unique: true },
  name: String,
  image: String,
  yearPublished: String,
  minPlayers: Number,
  maxPlayers: Number,
  playingTime: Number,
  description: String,
  categories: [String],
  mechanics: [String],
  url: String
});

export default mongoose.models.Game || mongoose.model("Game", GameSchema);
