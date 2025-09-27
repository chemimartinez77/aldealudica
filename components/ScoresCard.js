// components/ScoresCard.js
import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, Text, useToast,
} from "@chakra-ui/react";

/**
 * Scores editor for a Partida:
 * - Any participant, the creator, or an admin can edit everyone's scores.
 * - PUT replaces the entire score table (simple last-write-wins).
 */
export default function ScoresCard({
  partidaId,
  participants,       // ids or populated docs {_id, name, email}
  currentUserId,
  isEditable,         // participant || creator || admin
  isAdmin = false,    // optional: pass true if current user is admin
}) {
  const toast = useToast();

  // Normalize participants to [{ player, name }]
  const normParticipants = useMemo(() => {
    return (participants || []).map((p) => {
      if (typeof p === "string") {
        return { player: p, name: `Usuario ${p.substring(0, 6)}…` };
      }
      const id = String(p?._id || p?.id);
      return { player: id, name: p?.name || p?.email || `Usuario ${id.substring(0, 6)}…` };
    });
  }, [participants]);

  // UI rows: [{ player, name, score: number|string }]
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [winner, setWinner] = useState(null);

  // Load persisted scores
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/partidas/${partidaId}/scores`);
        const data = await res.json();
        const scoreMap = new Map((data?.scores || []).map(s => [String(s.player), Number(s.score)]));
        const merged = normParticipants.map((p) => ({
          player: p.player,
          name: p.name,
          score: scoreMap.has(p.player) ? scoreMap.get(p.player) : "",
        }));
        if (mounted) {
          setRows(merged);
          setWinner(data?.winner || null);
        }
      } catch {
        if (mounted) {
          setRows(normParticipants.map(p => ({ ...p, score: "" })));
          setWinner(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (partidaId) load();
    return () => { mounted = false; };
  }, [partidaId, normParticipants]);

  function setScore(playerId, value) {
    setRows(prev => prev.map(r => (r.player === playerId ? { ...r, score: value } : r)));
  }

  async function handleSave() {
    try {
      setSaving(true);
      const payload = {
        userId: currentUserId,
        isAdmin,
        scores: rows
          .filter(r => r.score !== "" && !Number.isNaN(Number(r.score)))
          .map(r => ({ player: r.player, score: Number(r.score) })),
      };
      const res = await fetch(`/api/partidas/${partidaId}/scores`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "Save error");
      setWinner(data.winner || null);
      toast({ status: "success", title: "Puntuaciones guardadas" });
    } catch {
      toast({ status: "error", title: "No se han podido guardar" });
    } finally {
      setSaving(false);
    }
  }

  const hasAnyScore = rows.some(r => r.score !== "" && !Number.isNaN(Number(r.score)));

  return (
    <Box mt={6} borderRadius="lg" overflow="hidden" boxShadow="sm" borderWidth="1px">
      {/* Blue bar header */}
      <Box bg="#0f2a66" color="white" px={4} py={2}>
        <Heading size="sm">Puntuaciones</Heading>
      </Box>

      <Box p={4}>
        {loading ? (
          <Text>Cargando…</Text>
        ) : rows.length === 0 ? (
          <Text>No hay participantes.</Text>
        ) : (
          <>
            {!hasAnyScore && (
              <Text color="gray.600" mb={3}>
                No hay puntuaciones registradas.
              </Text>
            )}

            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Jugador</Th>
                  <Th isNumeric>Puntuación</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((r) => (
                  <Tr key={r.player}>
                    <Td>{r.name}</Td>
                    <Td isNumeric>
                      <Input
                        type="number"
                        step="1"
                        // Do not force min; some games allow negative scores
                        value={r.score}
                        onChange={(e) => setScore(r.player, e.target.value)}
                        isDisabled={!isEditable}
                        width="120px"
                        textAlign="right"
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {winner && (
              <Text mt={3}>
                <b>Ganador:</b> {(() => {
                  const w = rows.find(x => String(x.player) === String(winner));
                  return w?.name || "—";
                })()}
              </Text>
            )}

            {isEditable && (
              <Button colorScheme="blue" mt={4} onClick={handleSave} isLoading={saving} loadingText="Guardando">
                Guardar puntuaciones
              </Button>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
