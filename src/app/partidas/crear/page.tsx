"use client";

import React, { useState, ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';

interface GameResult {
  id: string;
  name: string;
  yearPublished: number;
  imageUrl?: string;
}

const Thumbnail = styled('img')({
  height: '100px',
  width: '100px',
  borderRadius: '6px',
  objectFit: 'contain',
});

const PartidasPage = () => {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    game: '',
    gameId: '',
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    participants: '',
    participate: false,
    location: '',
    address: '',
    authorization: false,
  });

  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [selectedGameImage, setSelectedGameImage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Submitting form with userId:', session?.user?.id);
    try {
        const response = await fetch('/api/saveGame', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ formData, userId: session?.user?.id })
        });

        if (!response.ok) {
            throw new Error('Error saving game');
        }

        const result = await response.json();
        console.log('Game saved:', result);
        } catch (error) {
            console.error('Error saving game:', error);
        }
    };

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/search?query=${formData.game}`);
      if (!response.ok) {
        throw new Error('Error fetching game data');
      }
      const result = await response.json();
      setGameResults(result.items);
      setDialogOpen(true);
    } catch (error) {
      setErrorMessage(`Error fetching game data: ${(error as Error).message}`);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleGameClick = (id: string, name: string, imageUrl: string) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      game: name,
      gameId: id,
    }));
    setSelectedGameImage(imageUrl);
    closeDialog();
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Box width="66.66%" maxWidth={600} mx="auto">
        <form onSubmit={handleSubmit}>
          <Box display="flex" alignItems="center">
            {selectedGameImage && (
              <Box mr={2}>
                <Thumbnail src={selectedGameImage} alt={formData.game} />
              </Box>
            )}
            <TextField
              name="game"
              label="Elige un juego (opcional)"
              variant="outlined"
              margin="normal"
              fullWidth
              value={formData.game}
              onChange={handleChange}
            />
            <Button onClick={handleSearch}>Buscar</Button>
          </Box>

          <TextField
            required
            name="title"
            label="Título de la partida"
            variant="outlined"
            margin="normal"
            fullWidth
            value={formData.title}
            onChange={handleChange}
          />

          <TextField
            name="description"
            label="Descripción de la partida"
            multiline
            rows={4}
            margin="normal"
            variant="outlined"
            fullWidth
            value={formData.description}
            onChange={handleChange}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                required
                name="startDate"
                label="Fecha de inicio"
                type="date"
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                value={formData.startDate}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                required
                name="startTime"
                label="Hora de inicio"
                type="time"
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                value={formData.startTime}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                required
                name="endDate"
                label="Fecha de finalización"
                type="date"
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                value={formData.endDate}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                required
                name="endTime"
                label="Hora de finalización"
                type="time"
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                value={formData.endTime}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          <TextField
            required
            name="participants"
            label="¿Cuántos jugadores necesitas para la partida?"
            type="number"
            margin="normal"
            fullWidth
            value={formData.participants}
            onChange={handleChange}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="participate"
                checked={formData.participate}
                onChange={handleChange}
              />
            }
            label="Voy a participar en la partida"
          />

          <TextField
            name="location"
            label="¿Dónde será la partida?"
            variant="outlined"
            margin="normal"
            fullWidth
            value={formData.location}
            onChange={handleChange}
          />

          <TextField
            name="address"
            label="Dirección"
            variant="outlined"
            margin="normal"
            fullWidth
            value={formData.address}
            onChange={handleChange}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="authorization"
                checked={formData.authorization}
                onChange={handleChange}
              />
            }
            label="¿Quieres validar a los asistentes de tu partida?"
          />

          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: 'lightblue !important',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'blue !important',
                  color: 'white',
                },
              }}
            >
              ENVIAR
            </Button>
          </Box>

          {successMessage && <Typography color="primary">{successMessage}</Typography>}
          {errorMessage && <Typography color="error">{errorMessage}</Typography>}
        </form>
      </Box>
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md">
        <DialogContent dividers style={{ height: '400px', overflowY: 'auto' }}>
          {gameResults.length > 0 && (
            <Box>
              {gameResults.map((game, index) => (
                <Box
                  mb={2}
                  key={index}
                  onClick={() => handleGameClick(game.id, game.name, game.imageUrl ? game.imageUrl : '/noimg.jpg')}
                  style={{ cursor: 'pointer' }}
                >
                  <Grid container key={index} spacing={2} alignItems="center">
                    <Grid item>
                      <img
                        src={game.imageUrl || '/noimg.jpg'}
                        alt={game.name || "No image available"}
                        width={60}
                        height={100}
                        style={{ objectFit: 'contain' }}
                      />
                    </Grid>
                    <Grid item>
                      <Typography variant="body1" component="span" style={{ fontWeight: 'bold' }}>
                        {game.name}
                      </Typography>
                      <Typography variant="body1" component="span">
                        {` (${game.yearPublished})`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PartidasPage;
