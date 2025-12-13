import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Delete } from 'lucide-react';
import API_URL from '../../config';

const PinEntryPage = () => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const { userId, firstName } = location.state || {};

    useEffect(() => {
        if (!userId) {
            navigate('/login');
        }
    }, [userId, navigate]);

    const handleNumberClick = (num) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                handleSubmit(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleSubmit = async (fullPin) => {
        try {
            const res = await axios.post(`${API_URL}/users/verify`, { userId, pin: fullPin });
            if (res.data.success) {
                login(res.data.user, res.data.token);
                navigate('/'); // Go to Dashboard
            }
        } catch (err) {
            setError('PIN incorrecto');
            setPin('');
        }
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col p-6">
            <button onClick={() => navigate(-1)} className="text-text mb-8 w-fit">
                <ChevronLeft size={28} />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl text-text font-medium mb-2">Hola, {firstName}</h2>
                    <p className="text-textSecondary">Ingresa tu PIN</p>
                </div>

                {/* PIN Dots */}
                <div className="flex gap-4 mb-12">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-primary scale-110' : 'bg-surface border border-textSecondary'
                                }`}
                        />
                    ))}
                </div>

                {error && <p className="text-red-500 mb-6 animate-pulse">{error}</p>}

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-6 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-20 w-20 mx-auto rounded-full bg-surface text-3xl font-medium text-text hover:bg-opacity-80 active:bg-primary active:text-background transition-all flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="col-start-2">
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="h-20 w-20 mx-auto rounded-full bg-surface text-3xl font-medium text-text hover:bg-opacity-80 active:bg-primary active:text-background transition-all flex items-center justify-center"
                        >
                            0
                        </button>
                    </div>
                    <div className="col-start-3 flex items-center justify-center">
                        <button
                            onClick={handleDelete}
                            className="h-20 w-20 rounded-full text-textSecondary hover:text-red-500 transition-colors flex items-center justify-center"
                        >
                            <Delete size={32} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PinEntryPage;
