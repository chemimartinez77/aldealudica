// src\components\GameForm.tsx
"use client";

import React, { useState, ChangeEvent, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Modal from 'react-modal';
import { useSession } from 'next-auth/react';
import { Game, GameResponse } from '../types/types';

interface GameFormProps {
    initialData?: Partial<Game>;
    onSubmit: (data: Partial<Game>) => Promise<any>;
}

const GameForm: React.FC<GameFormProps> = ({ initialData, onSubmit }) => {
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [gameData, setGameData] = useState<any>(null);
    const [formData, setFormData] = useState({
        game: '',
        gameId: '',
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        participants: '' as string | number,
        participate: false,
        location: '',
        address: '',
        authorization: false,
        creatorId: session?.user?.id || '', // Incluye el creatorId
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prevFormData => ({
                ...prevFormData,
                ...initialData,
                participants: initialData.participants ?? prevFormData.participants
            }));
        }
    }, [initialData]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response: GameResponse = await onSubmit(formData);
            setGameData(response);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error al crear la partida:", error);
            // Manejo de errores, como mostrar un mensaje al usuario
        }
    };

    return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Box width="66.66%" maxWidth={600} mx="auto">
                    <form onSubmit={handleSubmit}>
                        <TextField
                            name="game"
                            label="Elige un juego (opcional)"
                            variant="outlined"
                            margin="normal"
                            fullWidth
                            value={formData.game}
                            onChange={handleChange}
                        />
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
                                GUARDAR CAMBIOS
                            </Button>
                        </Box>
                    </form>
                    <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
                        <h2>Partida creada</h2>
                        <pre>{JSON.stringify(gameData, null, 2)}</pre>
                        <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                    </Modal>
                </Box>
            </Box>
    );
};

export default GameForm;
