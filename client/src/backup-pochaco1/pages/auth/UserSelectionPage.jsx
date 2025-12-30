import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { Plus, User } from 'lucide-react';

const UserSelectionPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                setUsers(res.data || []);
            } catch (error) {
                console.error("Error loading users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleUserSelect = (userId, firstName) => {
        navigate('/pin', { state: { userId, firstName } });
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-text">Cargando...</div>;

    return (
        <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-text mb-8 text-center">Administrador de Finanzas</h1>
            <p className="text-textSecondary mb-8">¿Quién eres?</p>

            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                {users.map(user => (
                    <button
                        key={user.id}
                        onClick={() => handleUserSelect(user.id, user.firstName)}
                        className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-opacity-80 transition-all border border-border shadow-lg active:scale-95"
                    >
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-background font-bold text-2xl">
                            {user.firstName[0]}
                        </div>
                        <span className="text-text font-medium text-lg">{user.firstName}</span>
                    </button>
                ))}

                <button
                    onClick={() => navigate('/create-user')}
                    className="bg-surface p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-opacity-80 transition-all border border-dashed border-textSecondary opacity-70 hover:opacity-100 active:scale-95"
                >
                    <div className="w-16 h-16 bg-transparent border-2 border-textSecondary rounded-full flex items-center justify-center text-textSecondary">
                        <Plus size={32} />
                    </div>
                    <span className="text-textSecondary font-medium text-lg">Nuevo</span>
                </button>
            </div>
        </div>
    );
};

export default UserSelectionPage;
