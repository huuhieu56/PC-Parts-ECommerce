import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { cartService } from '../../services/cart.service';
import type { 
  CartState, 
  GuestCartItem, 
  AddToCartRequest, 
  UpdateCartItemRequest 
} from '../../types/cart.types';

// Initial state - avoid localStorage access to prevent StrictMode issues
const getInitialCartState = (): CartState => {
  return {
    items: [],
    guest_items: [], // Will be loaded lazily
    summary: {
      total_items: 0,
      total_quantity: 0,
      subtotal: 0,
      tax_amount: 0,
      shipping_cost: 0,
      discount_amount: 0,
      promotion: null,
      total_amount: 0,
      final_amount: 0,
    },
    loading: false,
    error: null,
    is_guest_mode: true, // Will be set properly in extraReducers
  };
};

const initialState: CartState = getInitialCartState();

// Async thunks for cart initialization
export const initializeCart = createAsyncThunk(
  'cart/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const hasToken = !!localStorage.getItem('access_token');
      const guestItems = cartService.getGuestCart();
      
      return {
        is_guest_mode: !hasToken,
        guest_items: guestItems,
      };
    } catch (error: any) {
  return rejectWithValue('Khởi tạo giỏ hàng thất bại');
    }
  }
);

// Async thunks for authenticated user cart
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      return await cartService.getCart();
    } catch (error: any) {
  return rejectWithValue(error.message || 'Không tải được giỏ hàng');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (itemData: AddToCartRequest, { rejectWithValue }) => {
    try {
  // Perform add, then fetch canonical cart to ensure consistent shape
  await cartService.addToCart(itemData);
  return await cartService.getCart();
    } catch (error: any) {
  return rejectWithValue(error.message || 'Thêm sản phẩm vào giỏ thất bại');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async (updateData: UpdateCartItemRequest, { rejectWithValue }) => {
    try {
  await cartService.updateCartItem(updateData);
  return await cartService.getCart();
    } catch (error: any) {
  return rejectWithValue(error.message || 'Cập nhật sản phẩm trong giỏ thất bại');
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (cartItemId: number, { rejectWithValue }) => {
    try {
  await cartService.removeCartItem(cartItemId);
  return await cartService.getCart();
    } catch (error: any) {
  return rejectWithValue(error.message || 'Xóa sản phẩm khỏi giỏ thất bại');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
      // After clearing, return an empty cart shape
      return {
        items: [],
        summary: {
          total_items: 0,
          total_quantity: 0,
          subtotal: 0,
          tax_amount: 0,
          shipping_cost: 0,
          discount_amount: 0,
          promotion: null,
          total_amount: 0,
          final_amount: 0,
        }
      };
    } catch (error: any) {
  return rejectWithValue(error.message || 'Xóa giỏ hàng thất bại');
    }
  }
);

export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuestCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { cart: CartState };
      const guestItems = state.cart.guest_items;
      
      if (guestItems.length === 0) {
        return await cartService.getCart();
      }

      const mergeData = {
        guest_cart_items: guestItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      };

  await cartService.mergeGuestCart(mergeData);
  // Clear guest cart after successful merge
  cartService.clearGuestCart();
  // Return canonical cart from server after merge
  return await cartService.getCart();
    } catch (error: any) {
  return rejectWithValue(error.message || 'Gộp giỏ hàng khách thất bại');
    }
  }
);

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setGuestMode: (state, action: PayloadAction<boolean>) => {
      state.is_guest_mode = action.payload;
    },

    // Guest cart actions
    addToGuestCart: (state, action: PayloadAction<Omit<GuestCartItem, 'added_at'>>) => {
      const updatedGuestItems = cartService.addToGuestCart(action.payload);
      state.guest_items = updatedGuestItems;
      state.summary = cartService.calculateGuestCartSummary(updatedGuestItems);
    },

    updateGuestCartItem: (state, action: PayloadAction<{ productId: number; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      const updatedGuestItems = cartService.updateGuestCartItem(productId, quantity);
      state.guest_items = updatedGuestItems;
      state.summary = cartService.calculateGuestCartSummary(updatedGuestItems);
    },

    removeGuestCartItem: (state, action: PayloadAction<number>) => {
      const updatedGuestItems = cartService.removeGuestCartItem(action.payload);
      state.guest_items = updatedGuestItems;
      state.summary = cartService.calculateGuestCartSummary(updatedGuestItems);
    },

    clearGuestCart: (state) => {
      cartService.clearGuestCart();
      state.guest_items = [];
      state.summary = {
        total_items: 0,
        total_quantity: 0,
        subtotal: 0,
        tax_amount: 0,
        shipping_cost: 0,
        discount_amount: 0,
        promotion: null,
        total_amount: 0,
        final_amount: 0,
      };
    },

    // Calculate guest cart summary
    calculateGuestSummary: (state) => {
      state.summary = cartService.calculateGuestCartSummary(state.guest_items);
    },
  },
  extraReducers: (builder) => {
    // Initialize cart
    builder
      .addCase(initializeCart.fulfilled, (state, action) => {
        state.is_guest_mode = action.payload.is_guest_mode;
        state.guest_items = action.payload.guest_items;
        state.summary = cartService.calculateGuestCartSummary(action.payload.guest_items);
      });

    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.summary = action.payload.summary;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload is canonical cart: { items, summary }
        if (action.payload && (action.payload as any).items) {
          state.items = (action.payload as any).items;
    state.summary = (action.payload as any).summary || state.summary;
        }
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItem.fulfilled, (state, action) => {
        // action.payload is canonical cart
        if (action.payload && (action.payload as any).items) {
          state.items = (action.payload as any).items;
          state.summary = (action.payload as any).summary || state.summary;
        }
      });

    // Remove cart item
    builder
      .addCase(removeCartItem.fulfilled, (state, action) => {
        // Debug: log payload shape for troubleshooting
        if (import.meta.env.DEV) console.debug('🛒 cartSlice: removeCartItem.fulfilled payload:', action.payload);

        // action.payload is expected to be canonical cart: { items, summary }
        if (action.payload && (action.payload as any).items) {
          state.items = (action.payload as any).items;
          state.summary = (action.payload as any).summary || state.summary;
          return;
        }

        // Defensive: some responses may return backend cart object with `cart_items` key
        if (action.payload && (action.payload as any).cart_items) {
          const cartData = action.payload as any;
          // Map cart_items -> items (frontend CartItem expected format should already be produced by cartService.getCart,
          // but if not, we try a light conversion here)
          try {
            state.items = (cartData.cart_items || []).map((it: any) => ({
              id: it.id,
              product: {
                id: it.product_id,
                name: it.product_name || it.product?.name || '',
                description: '',
                price: it.product_price || it.product?.price || 0,
                quantity: 0,
                low_stock_threshold: 0,
                image_url: it.product_image_url || it.product?.image_url || '',
                category: { id: 0, name: '', description: '', parent_category_id: undefined, is_active: true, created_at: '', updated_at: '' },
                specifications: {},
                is_active: it.is_product_active ?? it.product?.is_active ?? true,
                created_at: it.created_at || '',
                updated_at: it.updated_at || ''
              },
              quantity: it.quantity,
              unit_price: it.product_price || 0,
              total_price: it.sub_total || it.total_price || 0,
              created_at: it.created_at || '',
              updated_at: it.updated_at || ''
            }));

            const subtotal = Number(cartData.subtotal ?? cartData.total_amount ?? 0);
            const taxAmount = Number(cartData.tax_amount ?? 0);
            const shippingCost = Number(cartData.shipping_cost ?? 0);
            const discountAmount = Number(cartData.discount_amount ?? 0);
            const totalAmount = Number(cartData.total_amount ?? (subtotal + taxAmount + shippingCost));
            const finalAmount = Number(cartData.final_amount ?? (totalAmount - discountAmount));
            state.summary = {
              total_items: cartData.cart_items ? cartData.cart_items.length : 0,
              total_quantity: cartData.total_items || 0,
              subtotal,
              tax_amount: taxAmount,
              shipping_cost: shippingCost,
              discount_amount: discountAmount,
              promotion: cartData.promotion || (cartData.promotion_id ? { id: cartData.promotion_id, code: cartData.promotion_code } : null),
              total_amount: totalAmount,
              final_amount: finalAmount,
            };
          } catch (e) {
            if (import.meta.env.DEV) console.error('❌ cartSlice: Failed to convert cart_items payload', e);
          }
        }
      });

    // Clear cart
    builder
      .addCase(clearCart.fulfilled, (state, action) => {
        // action.payload is { items: [], summary }
        if (action.payload && (action.payload as any).items) {
          state.items = (action.payload as any).items;
          state.summary = (action.payload as any).summary || {
            total_items: 0,
            total_quantity: 0,
            subtotal: 0,
            tax_amount: 0,
            shipping_cost: 0,
            discount_amount: 0,
            promotion: null,
            total_amount: 0,
            final_amount: 0,
          };
        }
      });

    // Merge guest cart
    builder
      .addCase(mergeGuestCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && (action.payload as any).items) {
          state.items = (action.payload as any).items;
          state.summary = (action.payload as any).summary || state.summary;
        }
        state.guest_items = [];
        state.is_guest_mode = false;
        state.error = null;
      })
      .addCase(mergeGuestCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setGuestMode,
  addToGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  calculateGuestSummary,
} = cartSlice.actions;

export default cartSlice.reducer;
