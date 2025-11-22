import { create } from 'zustand';
import api from '../api/axios';

interface User {
    _id: string;
    email: string;
    role: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    login: async (email,password) => {
        try {
            set({ loading: true, error: null });

            const { data } = await api.post('/auth/login', {email, password});
            localStorage.setItem('token', data.accessToken);

            set({
                token: data.accessToken,
                user: data.user,
                loading: false
            })

            return true
        } catch (err) {
            console.error(err)
            set({error: `Falha no login, tente novamente`, loading: false})
            return false
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        set({token: null, user: null})
    }
}))