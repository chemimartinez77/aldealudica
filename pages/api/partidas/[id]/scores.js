// pages/api/partidas/[id]/scores.js
import dbConnect from "../../../../lib/dbConnect";
import Partida from "../../../../models/Partida";

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  const partida = await Partida.findById(id);
  if (!partida) return res.status(404).json({ error: "Partida not found" });

  if (req.method === "GET") {
    return res.status(200).json({
      scores: partida.scores || [],
      winner: partida.winner || null,
    });
  }

  if (req.method === "PUT") {
    try {
      const { userId, isAdmin = false, scores } = req.body || {};

      // Authorization: creator, participant or admin
      const isCreator = String(partida.creatorId) === String(userId);
      const isParticipant = (partida.participants || []).some(
        (p) => String(p) === String(userId)
      );
      if (!(isAdmin || isCreator || isParticipant)) {
        return res.status(403).json({ error: "Not allowed to edit scores" });
      }

      if (!Array.isArray(scores)) {
        return res.status(400).json({ error: "Invalid payload: scores must be an array" });
      }

      // Allow scores only for current participants (defensive check)
      const participantIds = new Set((partida.participants || []).map((p) => String(p)));

      // Deduplicate by player (last-write-wins)
      const map = new Map();
      for (const s of scores) {
        const pid = String(s.player);
        if (!participantIds.has(pid)) continue;
        const val = Number(s.score);
        if (Number.isNaN(val)) continue;
        map.set(pid, { player: s.player, score: val });
      }
      const cleaned = Array.from(map.values());

      // Persist scores
      partida.scores = cleaned;

      // Compute winner (single highest; ties -> null)
      let max = -Infinity;
      let winners = [];
      for (const s of cleaned) {
        if (s.score > max) {
          max = s.score;
          winners = [s.player];
        } else if (s.score === max) {
          winners.push(s.player);
        }
      }
      partida.winner = winners.length === 1 ? winners[0] : null;

      await partida.save();

      return res.status(200).json({
        ok: true,
        scores: partida.scores,
        winner: partida.winner,
      });
    } catch (e) {
      return res.status(500).json({ error: "Unexpected error saving scores" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end("Method Not Allowed");
}
