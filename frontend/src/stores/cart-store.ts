import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

interface CartItemData {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  sellingPrice: number;
  quantity: number;
}

interface CartState {
  items: CartItemData[];
  totalPrice: number;
  totalItems: number;
  loading: boolean;

  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setCartFromResponse: (data: { items: CartItemData[]; totalPrice: number; totalItems: number }) => void;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("cart_session_id");
  if (!sid) {
    sid = "guest_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("cart_session_id", sid);
  }
  return sid;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const sid = getSessionId();
  if (sid) headers["X-Session-Id"] = sid;
  return headers;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalPrice: 0,
      totalItems: 0,
      loading: false,

      setCartFromResponse: (data) => {
        const items = data.items || [];
        const computedTotal = items.reduce((sum: number, i: CartItemData) => sum + (i.sellingPrice || 0) * (i.quantity || 0), 0);
        const computedCount = items.reduce((sum: number, i: CartItemData) => sum + (i.quantity || 0), 0);
        set({
          items,
          totalPrice: computedTotal || data.totalPrice || 0,
          totalItems: computedCount,
        });
      },

      fetchCart: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/cart", { headers: getHeaders() });
          const cart = res.data.data || res.data;
          const items = cart.items || [];
          const computedTotal = items.reduce((sum: number, i: CartItemData) => sum + (i.sellingPrice || 0) * (i.quantity || 0), 0);
          const computedCount = items.reduce((sum: number, i: CartItemData) => sum + (i.quantity || 0), 0);
          set({
            items,
            totalPrice: computedTotal || cart.totalPrice || 0,
            totalItems: computedCount,
          });
        } catch {
          // If unauthenticated and no session cart, just keep empty
        } finally {
          set({ loading: false });
        }
      },

      addItem: async (productId: number, quantity: number) => {
        try {
          const res = await api.post("/cart/items", { productId, quantity }, { headers: getHeaders() });
          const cart = res.data.data || res.data;
          const items = cart.items || [];
          const computedTotal = items.reduce((sum: number, i: CartItemData) => sum + (i.sellingPrice || 0) * (i.quantity || 0), 0);
          const computedCount = items.reduce((sum: number, i: CartItemData) => sum + (i.quantity || 0), 0);
          set({
            items,
            totalPrice: computedTotal || cart.totalPrice || 0,
            totalItems: computedCount,
          });
        } catch (err) {
          console.error("Failed to add item to cart", err);
          throw err;
        }
      },

      updateItem: async (productId: number, quantity: number) => {
        // Optimistic update for instant UI feedback
        const prevItems = useCartStore.getState().items;
        const optimisticItems = prevItems.map(i =>
          i.productId === productId ? { ...i, quantity } : i
        );
        const computedTotalOpt = optimisticItems.reduce((sum: number, i: CartItemData) => sum + (i.sellingPrice || 0) * (i.quantity || 0), 0);
        const computedCountOpt = optimisticItems.reduce((sum: number, i: CartItemData) => sum + (i.quantity || 0), 0);
        set({ items: optimisticItems, totalPrice: computedTotalOpt, totalItems: computedCountOpt });

        try {
          const res = await api.put(`/cart/items/${productId}?quantity=${quantity}`, null, { headers: getHeaders() });
          const cart = res.data.data || res.data;
          const items = cart.items || [];
          const computedTotal = items.reduce((sum: number, i: CartItemData) => sum + (i.sellingPrice || 0) * (i.quantity || 0), 0);
          const computedCount = items.reduce((sum: number, i: CartItemData) => sum + (i.quantity || 0), 0);
          set({
            items,
            totalPrice: computedTotal || cart.totalPrice || 0,
            totalItems: computedCount,
          });
        } catch (err) {
          // Rollback to previous state and re-fetch from API to sync
          set({ items: prevItems, totalPrice: prevItems.reduce((s: number, i: CartItemData) => s + (i.sellingPrice || 0) * (i.quantity || 0), 0), totalItems: prevItems.reduce((s: number, i: CartItemData) => s + (i.quantity || 0), 0) });
          // Re-fetch cart from API to get correct state
          try { await useCartStore.getState().fetchCart(); } catch { /* ignore */ }
          console.error("Failed to update cart item", err);
        }
      },

      removeItem: async (productId: number) => {
        const prevItems = useCartStore.getState().items;
        // Optimistic removal
        const optimisticItems = prevItems.filter(i => i.productId !== productId);
        const computedTotalOpt = optimisticItems.reduce((sum: number, i: CartItemData) => sum + (i.sellingPrice || 0) * (i.quantity || 0), 0);
        const computedCountOpt = optimisticItems.reduce((sum: number, i: CartItemData) => sum + (i.quantity || 0), 0);
        set({ items: optimisticItems, totalPrice: computedTotalOpt, totalItems: computedCountOpt });

        try {
          const res = await api.delete(`/cart/items/${productId}`, { headers: getHeaders() });
          const cart = res.data.data || res.data;
          const items = cart.items || [];
          const computedTotal = items.reduce((sum: number, i: CartItemData) => sum + (i.sellingPrice || 0) * (i.quantity || 0), 0);
          const computedCount = items.reduce((sum: number, i: CartItemData) => sum + (i.quantity || 0), 0);
          set({
            items,
            totalPrice: computedTotal || cart.totalPrice || 0,
            totalItems: computedCount,
          });
        } catch (err) {
          // Rollback and re-fetch
          set({ items: prevItems, totalPrice: prevItems.reduce((s: number, i: CartItemData) => s + (i.sellingPrice || 0) * (i.quantity || 0), 0), totalItems: prevItems.reduce((s: number, i: CartItemData) => s + (i.quantity || 0), 0) });
          try { await useCartStore.getState().fetchCart(); } catch { /* ignore */ }
          console.error("Failed to remove cart item", err);
        }
      },

      clearCart: async () => {
        try {
          await api.delete("/cart", { headers: getHeaders() });
          set({ items: [], totalPrice: 0, totalItems: 0 });
        } catch (err) {
          console.error("Failed to clear cart", err);
          throw err;
        }
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        totalPrice: state.totalPrice,
        totalItems: state.totalItems,
      }),
    }
  )
);
