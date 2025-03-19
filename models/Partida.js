// models/Partida.js
import mongoose from "mongoose";

const PartidaSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  title: String,
  game: String,
  description: String,
  date: String, // "YYYY-MM-DD"
  startTime: String, // "HH:mm"
  endTime: String,
  playerLimit: Number,
  creatorParticipates: Boolean,
  location: String,
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // participants es un array de ObjectIds que referencian a la colección "User"
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// Generar un ID único si no existe
PartidaSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString();
  }
  next();
});

export default mongoose.models.Partida ||
  mongoose.model("Partida", PartidaSchema);
