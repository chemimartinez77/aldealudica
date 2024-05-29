// src/app/partidas/page.tsx
"use client"

import React, { useState, ChangeEvent } from 'react'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Image from 'next/image'
import { styled } from '@mui/material/styles'



interface GameResult {
    id: string;
    name: string;
    yearPublished: number;
    imageUrl?: string;
}

// Ajusta el estilo de la miniatura
const Thumbnail = styled('img')({
    height: '100px', // Ajusta esta altura según el alto del cuadro de texto
    width: '100px', // Ajusta el ancho según sea necesario
    borderRadius: '6px',
    objectFit: 'contain'
});

const PartidasPage = () => {
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const [gameResults, setGameResults] = useState<GameResult[]>([])
    const [selectedGameImage, setSelectedGameImage] = useState<string | null>(null)

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: type === 'checkbox' ? checked : value
        }))
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);
    
        console.log('Form data being submitted:', formData);
    
        try {
            const response = await fetch('/api/saveGame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ formData })
            });
    
            if (!response.ok) {
                throw new Error('Error saving game');
            }
    
            const result = await response.json();
            setSuccessMessage('Game saved successfully');
            console.log(result.message);
        } catch (error) {
            setErrorMessage('Error saving game');
            console.error('Error:', error);
        }
    };

    

    const handleSearch = async () => {
        const response = await fetch(`/api/search?query=${encodeURIComponent(formData.game)}`);
        if (!response.ok) {
            console.error('Error fetching search results');
            return;
        }
        const data = await response.json();
        setGameResults(data.items); // Asegúrate de que esto corresponde a la estructura de tu respuesta
        openDialog(); // Abrir el diálogo después de obtener los resultados
    }
    

    const [dialogOpen, setDialogOpen] = useState(false)
    const openDialog = () => setDialogOpen(true)
    const closeDialog = () => setDialogOpen(false)

    const fieldWidth = { width: '4cm' }

    const handleGameClick = (gameId: string, gameName: string, gameImage: string) => {
        setFormData(prevFormData => ({
            ...prevFormData,
            gameId: gameId, // Guardar el ID del juego
            game: gameName
        }));
        setSelectedGameImage(gameImage); // Actualiza la URL de la imagen seleccionada
        closeDialog();
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
                                style={fieldWidth}
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
                                style={fieldWidth}
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
                                style={fieldWidth}
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
                                style={fieldWidth}
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
                                backgroundColor: 'lightblue !important', // Cambiado a azul claro
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
                                <Box mb={2} key={index} onClick={() => handleGameClick(game.id, game.name, game.imageUrl ? game.imageUrl : '/noimg.jpg')} style={{ cursor: 'pointer' }}>
                                    <Grid container key={index} spacing={2} alignItems="center">
                                        <Grid item>
                                            <Image 
                                                src={game.imageUrl ? game.imageUrl : '/noimg.jpg'} 
                                                alt={game.name || "No image available"} // Gestión adecuada de alt en caso de que game.name no esté disponible
                                                width={60} // Ancho de la imagen
                                                height={100} // Altura de la imagen
                                                objectFit="contain"
                                                className="game-image" // Utilice className para estilos en lugar de inline styles
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
    )
}

export default PartidasPage
