import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${API}/auth/login`, { email, password });
                    const { access_token, refresh_token, user } = response.data;
                    
                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    
                    // Set default auth header
                    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                    
                    return { success: true, user };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Login failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`${API}/auth/register`, data);
                    set({ isLoading: false });
                    return { success: true, email: response.data.email };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Registration failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            verifyOTP: async (email, otp) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${API}/auth/verify-otp`, { email, otp });
                    set({ isLoading: false });
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'OTP verification failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            resendOTP: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${API}/auth/resend-otp`, { email });
                    set({ isLoading: false });
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to resend OTP';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            forgotPassword: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${API}/auth/forgot-password`, { email });
                    set({ isLoading: false });
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to send reset email';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            resetPassword: async (token, newPassword) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${API}/auth/reset-password`, { token, new_password: newPassword });
                    set({ isLoading: false });
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Password reset failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            updateProfile: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.put(`${API}/auth/profile`, data, {
                        headers: { Authorization: `Bearer ${get().accessToken}` }
                    });
                    set((state) => ({
                        user: { ...state.user, ...data },
                        isLoading: false
                    }));
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Update failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            refreshAccessToken: async () => {
                const { refreshToken } = get();
                if (!refreshToken) return false;

                try {
                    const response = await axios.post(`${API}/auth/refresh`, null, {
                        params: { refresh_token: refreshToken }
                    });
                    const { access_token } = response.data;
                    set({ accessToken: access_token });
                    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                    return true;
                } catch (error) {
                    get().logout();
                    return false;
                }
            },

            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    error: null
                });
                delete axios.defaults.headers.common['Authorization'];
            },

            clearError: () => set({ error: null }),

            initializeAuth: () => {
                const { accessToken } = get();
                if (accessToken) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                }
            }
        }),
        {
            name: 'lumina-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);

// Axios interceptor for token refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const success = await useAuthStore.getState().refreshAccessToken();
            
            if (success) {
                const { accessToken } = useAuthStore.getState();
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return axios(originalRequest);
            }
        }
        
        return Promise.reject(error);
    }
);
