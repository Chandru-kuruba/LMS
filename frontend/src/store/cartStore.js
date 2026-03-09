import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            total: 0,
            isLoading: false,
            error: null,

            fetchCart: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.get(`${API}/cart`);
                    set({
                        items: response.data.items,
                        total: response.data.total,
                        isLoading: false
                    });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
            },

            addToCart: async (courseId) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${API}/cart`, { course_id: courseId });
                    await get().fetchCart();
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to add to cart';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            removeFromCart: async (itemId) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.delete(`${API}/cart/${itemId}`);
                    await get().fetchCart();
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to remove from cart';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            clearCart: () => set({ items: [], total: 0 }),

            getCartCount: () => get().items.length
        }),
        {
            name: 'lumina-cart',
            partialize: (state) => ({
                items: state.items,
                total: state.total
            })
        }
    )
);

export const useWishlistStore = create(
    persist(
        (set, get) => ({
            items: [],
            isLoading: false,
            error: null,

            fetchWishlist: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.get(`${API}/wishlist`);
                    set({ items: response.data.items, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
            },

            addToWishlist: async (courseId) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.post(`${API}/wishlist`, { course_id: courseId });
                    await get().fetchWishlist();
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to add to wishlist';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            removeFromWishlist: async (itemId) => {
                set({ isLoading: true, error: null });
                try {
                    await axios.delete(`${API}/wishlist/${itemId}`);
                    await get().fetchWishlist();
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to remove from wishlist';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                }
            },

            isInWishlist: (courseId) => {
                return get().items.some(item => item.course.id === courseId);
            }
        }),
        {
            name: 'lumina-wishlist',
            partialize: (state) => ({
                items: state.items
            })
        }
    )
);
