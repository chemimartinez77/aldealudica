// models/Partida.js
import mongoose from "mongoose";

const PartidaSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  title: String,
  game: String,
  gameDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
    default: null,
  },
  description: String,
  date: String,
  startTime: String,
  endTime: String,
  playerLimit: Number,
  creatorParticipates: Boolean,
  location: String,
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  
  // Nuevos campos
  realDuration: {
    hours: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 }
  },
  scores: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number
  }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [{
    url: String,
    publicId: String
  }],
  completed: { type: Boolean, default: false }
});

PartidaSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString();
  }
  next();
});

export default mongoose.models.Partida || mongoose.model("Partida", PartidaSchema);
