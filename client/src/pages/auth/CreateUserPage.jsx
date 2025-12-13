import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

const CreateUserPage = () => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', pin: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Enforce numeric PIN logic if needed here or just basics
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.pin.length !== 4) {
            setError('El PIN debe tener 4 dígitos');
            return;
        }

        try {
            await axios.post(`${API_URL}/users`, formData);
            navigate('/'); // Back to selection
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear usuario');
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 flex flex-col">
            <button onClick={() => navigate(-1)} className="text-text mb-6 flex items-center gap-2">
                <ChevronLeft /> Volver
            </button>

            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <h1 className="text-3xl font-bold text-text mb-2">Crear Usuario</h1>
                <p className="text-textSecondary mb-8">Empieza tu viaje financiero.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-textSecondary mb-2 font-medium">Nombre</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full bg-surface border border-border rounded-xl p-4 text-text text-lg focus:outline-none focus:border-primary"
                            placeholder="Ej. Juan"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-textSecondary mb-2 font-medium">Apellido</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full bg-surface border border-border rounded-xl p-4 text-text text-lg focus:outline-none focus:border-primary"
                            placeholder="Ej. Pérez"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-textSecondary mb-2 font-medium">PIN de Seguridad (4 dígitos)</label>
                        <input
                            type="tel"
                            maxLength="4"
                            name="pin"
                            value={formData.pin}
                            onChange={handleChange}
                            className="w-full bg-surface border border-border rounded-xl p-4 text-text text-2xl tracking-widest text-center focus:outline-none focus:border-primary"
                            placeholder="••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-center">{error}</p>}

                    <button
                        type="submit"
                        className="bg-primary text-background font-bold text-lg p-4 rounded-xl mt-4 hover:opacity-90 transition-opacity"
                    >
                        Crear Perfil
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateUserPage;
