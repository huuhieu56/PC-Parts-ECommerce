import { api } from './api';
import { authService } from './auth.service';
import type { 
  CartItem, 
  CartSummary, 
  AddToCartRequest, 
  UpdateCartItemRequest, 
  CartMergeRequest,
  GuestCartItem
} from '../types/cart.types';
// Note: ApiResponse type not required for runtime parsing here

// NOTE: user id is no longer passed from frontend; backend extracts it from JWT (Authorization Bearer)

// Convert server cart item object to frontend CartItem
const convertServerCartItemToCartItem = (serverItem: any): CartItem => ({
  id: serverItem.id,
  quantity: serverItem.quantity,
  product: {
    id: serverItem.product_id,
    name: serverItem.product_name || serverItem.product?.name || '',
    description: '',
    price: serverItem.product_price || serverItem.product?.price || 0,
    quantity: 0,
    low_stock_threshold: 0,
    image_url: serverItem.product_image_url || serverItem.product?.image_url || '',
    category: { id: 0, name: '', description: '', parent_category_id: undefined, is_active: true, created_at: '', updated_at: '' },
    specifications: {},
    is_active: serverItem.is_product_active ?? serverItem.product?.is_active ?? true,
    created_at: serverItem.created_at || '',
    updated_at: serverItem.updated_at || ''
  },
  unit_price: serverItem.product_price || serverItem.product?.price || 0,
  total_price: serverItem.sub_total || serverItem.total_price || 0,
  created_at: serverItem.created_at || '',
  updated_at: serverItem.updated_at || ''
});

// Helper to normalize API helper return values.
// The `api` wrapper may return either an Axios-like response object ({ data: ... })
// or the already-unwrapped payload. Also the backend sometimes wraps payload
// inside an ApiResponse { status_code, message, data }.
const extractResponseBody = (resp: any) => {
  const maybe = resp && typeof resp === 'object' && 'data' in resp ? resp.data : resp;
  // If backend used ApiResponse wrapper, return inner data
  if (maybe && typeof maybe === 'object' && 'data' in maybe) return maybe.data;
  return maybe;
};

export const cartService = {
  // ===== AUTHENTICATED USER CART =====
  
  // Get user's cart - GET /api/v1/cart (userId extracted from JWT on backend)
  getCart: async (): Promise<{ items: CartItem[]; summary: CartSummary }> => {
    console.log('🛒 Cart Service: Getting cart for authenticated user');
    
    try {
      // Primary attempt: backend variant that extracts user from JWT
      let response: any;
      try {
        response = await api.get<any>(`/cart`);
      } catch (e: any) {
        // Fallback for local backend requiring user path param
        const msg: string = e?.message || e?.response?.data?.message || '';
        const isParamNameError = typeof msg === 'string' && (
          msg.includes('For queries with named parameters') ||
          msg.includes('parameter name information not found')
        );
        if (e?.response?.status === 400 || isParamNameError || e?.response?.status === 404) {
          const user = authService.getStoredUser();
          if (user?.id) {
            console.log('🛒 Cart Service: Falling back to user-specific endpoint /cart/user/{id}');
            response = await api.get<any>(`/cart/user/${user.id}`);
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
      const body = extractResponseBody(response);
      // console.log('🛒 Cart Service: Raw cart response (extracted):', body);

      // Determine if response is direct cart data
      let cartData: any = undefined;
      if (body && body.cart_items) {
        cartData = body;
        // console.log('🛒 Cart Service: Response is direct cart data');
      } else if (body && body.data && body.message) {
        // Rare case: double-wrapped, if encountered
        cartData = body.data;
        console.log('🛒 Cart Service: Response had nested ApiResponse wrapper');
      } else {
  console.error('❌ Cart Service: Không hiểu cấu trúc phản hồi khi gọi getCart:', body);
  throw new Error('Lấy giỏ hàng thất bại - cấu trúc phản hồi không hợp lệ');
      }
      
      // console.log('🛒 Cart Service: Cart data from API:', cartData);
      // console.log('🛒 Cart Service: Cart data keys:', Object.keys(cartData));
      
      // Backend trả về structure: { id, username, user_id, cart_items, total_items, total_amount, ... }
      // Convert cart_items array thành frontend CartItem format
      const items: CartItem[] = (cartData.cart_items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product_id,
          name: item.product_name,
          description: '', // Backend không cung cấp, dùng default
          price: item.product_price,
          quantity: 0, // Backend không cung cấp quantity available
          low_stock_threshold: 0, // Backend không cung cấp
          image_url: item.product_image_url,
          category: { id: 0, name: '', description: '', parent_category_id: undefined, is_active: true, created_at: '', updated_at: '' }, // Default empty category
          specifications: {}, // Backend không cung cấp
          is_active: item.is_product_active,
          created_at: '',
          updated_at: ''
        },
        unit_price: item.product_price,
        total_price: item.sub_total,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      // Calculate summary từ backend data
      // Backend may return discount fields: discount_amount, promotion_id, promotion_code, final_amount
      const discountAmount = Number(cartData.discount_amount || 0);
      const promotion = cartData.promotion ? {
        id: cartData.promotion.id || cartData.promotion_id,
        code: cartData.promotion.code || cartData.promotion_code,
        name: cartData.promotion.name || undefined,
      } : (cartData.promotion_id ? { id: cartData.promotion_id, code: cartData.promotion_code } : null);

      const subtotal = Number(cartData.subtotal ?? cartData.total_amount ?? 0);
      const taxAmount = Number(cartData.tax_amount ?? 0);
      const shippingCost = Number(cartData.shipping_cost ?? 0);
      const totalAmount = Number(cartData.total_amount ?? (subtotal + taxAmount + shippingCost));
      const finalAmount = Number(cartData.final_amount ?? (totalAmount - discountAmount));

      const summary: CartSummary = {
        total_items: cartData.cart_items ? cartData.cart_items.length : 0,
        total_quantity: cartData.total_items || 0,
        subtotal,
        tax_amount: taxAmount, // Backend optional
        shipping_cost: shippingCost, // Backend optional
        discount_amount: discountAmount,
        promotion,
        total_amount: totalAmount,
        final_amount: finalAmount,
      };
      
      const result = { items, summary };
      // console.log('🛒 Cart Service: Processed cart result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Cart Service: Error getting cart:', error);
      if (error.response?.status === 404) {
        // Cart not found, return empty cart
        console.log('🛒 Cart Service: Cart not found, returning empty cart');
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
      }
      // On error, if the first call failed due to endpoint shape, try user-specific clear as last resort
      const user = authService.getStoredUser();
      if (user?.id) {
        try {
          const resp = await api.get<any>(`/cart/user/${user.id}`);
          const body = extractResponseBody(resp);
          if (body && (body.items || body.cart_items)) {
            // Convert as usual
            const items: CartItem[] = (body.items || body.cart_items || []).map((it: any) => convertServerCartItemToCartItem(it));
            const subtotal = Number(body.subtotal ?? body.total_amount ?? 0);
            const taxAmount = Number(body.tax_amount ?? 0);
            const shippingCost = Number(body.shipping_cost ?? 0);
            const discountAmount = Number(body.discount_amount ?? 0);
            const totalAmount = Number(body.total_amount ?? (subtotal + taxAmount + shippingCost));
            const finalAmount = Number(body.final_amount ?? (totalAmount - discountAmount));
            const summary: CartSummary = {
              total_items: items.length,
              total_quantity: (body.total_items || 0),
              subtotal,
              tax_amount: taxAmount,
              shipping_cost: shippingCost,
              discount_amount: discountAmount,
              promotion: body.promotion || null,
              total_amount: totalAmount,
              final_amount: finalAmount,
            };
            return { items, summary };
          }
        } catch (_) {
          // ignore
        }
      }
      throw error;
    }
  },

  // Add item to cart - POST /api/v1/cart/user/{userId}/items
  addToCart: async (itemData: AddToCartRequest): Promise<CartItem> => {
    console.log('🛒 Cart Service: Adding item to cart:', itemData);
    
    try {
  // Prefer JWT-based endpoint, fallback to user-specific if needed
  let response: any;
  try {
    response = await api.post(`/cart/items`, itemData);
  } catch (e: any) {
    const msg: string = e?.message || e?.response?.data?.message || '';
    const user = authService.getStoredUser();
    const shouldFallback = (e?.response?.status === 400 || e?.response?.status === 404) && user?.id;
    if (shouldFallback || (typeof msg === 'string' && msg.includes('For queries with named parameters'))) {
      console.log('🛒 Cart Service: Falling back to /cart/user/{id}/items');
      response = await api.post(`/cart/user/${user!.id}/items`, itemData);
    } else {
      throw e;
    }
  }
  const body = extractResponseBody(response);
  console.log('🛒 Cart Service: Raw add item response (extracted):', body);

      // Normalize possible shapes:
      // 1) ApiResponse wrapper: { message, data: { ... } }
      // 2) Direct full cart: { id, username, cart_items: [...] }
      // 3) Direct single cart item: { id, product_id, quantity, ... }

      let responseData: any = undefined;

      const responseDataRaw = body;
      if (responseDataRaw && typeof responseDataRaw === 'object') {
        if (responseDataRaw.data && typeof responseDataRaw.data === 'object') {
          responseData = responseDataRaw.data; // wrapped ApiResponse
          console.log('🛒 Cart Service: Detected ApiResponse wrapper for add item');
        } else {
          responseData = responseDataRaw; // direct body (cart or item)
          console.log('🛒 Cart Service: Detected direct response body for add item');
        }
      }

      if (!responseData) {
  console.error('❌ Cart Service: Cấu trúc phản hồi thêm mục vào giỏ không hợp lệ:', response.data);
  throw new Error('Thêm mục vào giỏ hàng thất bại - phản hồi không hợp lệ');
      }

  console.log('🛒 Cart Service: Add item response data keys:', Object.keys(responseData || {}));

      // If server returned full cart, find the added item in cart_items
      if (responseData.cart_items && Array.isArray(responseData.cart_items)) {
        console.log('🛒 Cart Service: Response is full cart, locating added item');
        // Try exact match by product_id (server uses `product_id`) or nested product.id
        let addedCartItem = responseData.cart_items.find((it: any) =>
          it.product_id === itemData.product_id || (it.product && it.product.id === itemData.product_id)
        );

        if (addedCartItem) {
          console.log('🛒 Cart Service: Found added cart item in full cart response (by product_id):', addedCartItem);
          return convertServerCartItemToCartItem(addedCartItem);
        }

        // Fallback: return the most recently added cart item (best-effort)
        try {
          const sorted = [...responseData.cart_items].sort((a: any, b: any) => {
            // Prefer created_at if present, else fall back to id
            const aTime = a.created_at ? Date.parse(a.created_at) : (a.id || 0);
            const bTime = b.created_at ? Date.parse(b.created_at) : (b.id || 0);
            return bTime - aTime;
          });
          if (sorted.length > 0) {
            console.log('🛒 Cart Service: Could not find exact product match; returning most-recent cart item as fallback:', sorted[0]);
            return convertServerCartItemToCartItem(sorted[0]);
          }
        } catch (e) {
          console.warn('🛒 Cart Service: Fallback logic failed while locating added item', e);
        }
      }

      // If server returned a single item object
      if (responseData.product_id && typeof responseData.quantity === 'number') {
        console.log('🛒 Cart Service: Response appears to be a single cart item');
        return convertServerCartItemToCartItem(responseData);
      }

      // Last resort: if server returned canonical cart shape (items + summary) instead of cart_items
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('🛒 Cart Service: Response returned canonical cart object with items[]');
        const added = responseData.items.find((it: any) => it.product && it.product.id === itemData.product_id);
        if (added) return added;
      }

  console.error('❌ Cart Service: Không thể phân tích phản hồi thêm mục thành cart item:', responseData);
  throw new Error('Thêm mục vào giỏ hàng thất bại - định dạng phản hồi không xác định');
    } catch (error: any) {
      console.error('❌ Cart Service: Error adding item to cart:', error);
      console.error('❌ Cart Service: Error response:', error.response?.data);
      throw error;
    }
  },

  // Update cart item quantity - PUT /api/v1/cart/user/{userId}/items/{itemId}?quantity=5
  updateCartItem: async (updateData: UpdateCartItemRequest): Promise<CartItem> => {
    console.log('🛒 Cart Service: Updating cart item:', updateData);
    // Try JWT-based first, fallback to user-specific
    let response: any;
    try {
      response = await api.put<any>(
        `/cart/items/${updateData.cart_item_id}?quantity=${updateData.quantity}`
      );
    } catch (e: any) {
      const user = authService.getStoredUser();
      if ((e?.response?.status === 400 || e?.response?.status === 404) && user?.id) {
        console.log('🛒 Cart Service: Falling back to /cart/user/{id}/items/{itemId}');
        response = await api.put<any>(
          `/cart/user/${user.id}/items/${updateData.cart_item_id}?quantity=${updateData.quantity}`
        );
      } else {
        throw e;
      }
    }
    const body = extractResponseBody(response);
    console.log('🛒 Cart Service: Update item response (extracted):', body);

    // Backend returns canonical CartResponse after update; return processed CartItem if possible
    if (body && body.cart_items && Array.isArray(body.cart_items)) {
      // find the updated item
      const updated = body.cart_items.find((it: any) => it.id === updateData.cart_item_id);
      if (updated) return convertServerCartItemToCartItem(updated);
    }

    // Fallback: if body itself is a single item
    if (body && body.product_id) return convertServerCartItemToCartItem(body);

    // If nothing matched, return a best-effort empty item
    return {
      id: updateData.cart_item_id,
      quantity: updateData.quantity,
      product: { id: 0, name: '', description: '', price: 0, quantity: 0, low_stock_threshold: 0, image_url: '', category: { id: 0, name: '', description: '', parent_category_id: undefined, is_active: true, created_at: '', updated_at: '' }, specifications: {}, is_active: true, created_at: '', updated_at: '' },
      unit_price: 0,
      total_price: 0,
      created_at: '',
      updated_at: ''
    } as CartItem;
  },

  // Remove item from cart - DELETE /api/v1/cart/user/{userId}/items/{cartItemId}
  removeCartItem: async (cartItemId: number): Promise<void> => {
    console.log('🛒 Cart Service: Removing cart item:', cartItemId);
  let url = `/cart/items/${cartItemId}`;
  console.log('🛒 Cart Service: DELETE URL:', url);
  let response: any;
  try {
    response = await api.delete(url);
  } catch (e: any) {
    const user = authService.getStoredUser();
    if ((e?.response?.status === 400 || e?.response?.status === 404) && user?.id) {
      url = `/cart/user/${user.id}/items/${cartItemId}`;
      console.log('🛒 Cart Service: Falling back DELETE URL:', url);
      response = await api.delete(url);
    } else {
      throw e;
    }
  }
  // Try to extract body if wrapped
  const body = extractResponseBody(response);
  console.log('🛒 Cart Service: Delete response (extracted):', body);
    // If backend returned cart and still contains the deleted item, warn
    try {
      if (body && body.cart_items && Array.isArray(body.cart_items)) {
        const stillPresent = body.cart_items.some((it: any) => it.id === cartItemId);
        if (stillPresent) {
          console.warn('⚠️ Cart Service: After delete, cart still contains itemId:', cartItemId, 'backend cart_items:', body.cart_items.map((it: any) => it.id));
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('🛒 Cart Service: Error checking delete response body', e);
    }
  console.log('🛒 Cart Service: Item removed successfully');
  },

  // Clear entire cart - DELETE /api/v1/cart/user/{userId}
  clearCart: async (): Promise<void> => {
    console.log('🛒 Cart Service: Clearing cart for authenticated user');
    try {
      await api.delete(`/cart`);
    } catch (e: any) {
      const user = authService.getStoredUser();
      if ((e?.response?.status === 400 || e?.response?.status === 404) && user?.id) {
        console.log('🛒 Cart Service: Falling back to DELETE /cart/user/{id}');
        await api.delete(`/cart/user/${user.id}`);
      } else {
        throw e;
      }
    }
    console.log('🛒 Cart Service: Cart cleared successfully');
  },

  // Merge guest cart with user cart - POST /api/v1/cart/merge
  mergeGuestCart: async (mergeData: CartMergeRequest): Promise<{ items: CartItem[]; summary: CartSummary }> => {
    console.log('🛒 Cart Service: Merging guest cart:', mergeData);
    const response = await api.post<{ items: CartItem[]; summary: CartSummary }>('/cart/merge', mergeData);
    console.log('🛒 Cart Service: Merge response:', response.data);
    return response.data;
  },

  // ===== GUEST CART (LOCAL STORAGE) =====
  
  // Get guest cart from localStorage
  getGuestCart: (): GuestCartItem[] => {
    const cartData = localStorage.getItem('guest_cart');
    return cartData ? JSON.parse(cartData) : [];
  },

  // Add item to guest cart
  addToGuestCart: (item: Omit<GuestCartItem, 'added_at'>): GuestCartItem[] => {
    const currentCart = cartService.getGuestCart();
    const existingItemIndex = currentCart.findIndex(
      cartItem => cartItem.product_id === item.product_id
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      currentCart[existingItemIndex].quantity += item.quantity;
      currentCart[existingItemIndex].total_price = 
        currentCart[existingItemIndex].quantity * currentCart[existingItemIndex].unit_price;
    } else {
      // Add new item
      const newItem: GuestCartItem = {
        ...item,
        added_at: new Date().toISOString(),
      };
      currentCart.push(newItem);
    }

    localStorage.setItem('guest_cart', JSON.stringify(currentCart));
    return currentCart;
  },

  // Update guest cart item
  updateGuestCartItem: (productId: number, quantity: number): GuestCartItem[] => {
    const currentCart = cartService.getGuestCart();
    const itemIndex = currentCart.findIndex(item => item.product_id === productId);

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        currentCart.splice(itemIndex, 1);
      } else {
        // Update quantity and total price
        currentCart[itemIndex].quantity = quantity;
        currentCart[itemIndex].total_price = quantity * currentCart[itemIndex].unit_price;
      }
    }

    localStorage.setItem('guest_cart', JSON.stringify(currentCart));
    return currentCart;
  },

  // Remove item from guest cart
  removeGuestCartItem: (productId: number): GuestCartItem[] => {
    const currentCart = cartService.getGuestCart();
    const updatedCart = currentCart.filter(item => item.product_id !== productId);
    
    localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
    return updatedCart;
  },

  // Clear guest cart
  clearGuestCart: (): void => {
    localStorage.removeItem('guest_cart');
  },

  // Calculate guest cart summary
  calculateGuestCartSummary: (items: GuestCartItem[]): CartSummary => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    // Tính lại subtotal bằng cách nhân unit_price với quantity thay vì dùng total_price có sẵn
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    
    // Simple tax calculation (10%)
    const taxAmount = subtotal * 0.1;
    
    // Free shipping for orders over 1,000,000 VND
    const shippingCost = subtotal >= 1000000 ? 0 : 50000;
    
  // Guest cart has no server promotions by default. final_amount equals total_amount here.
  const totalAmount = subtotal + taxAmount + shippingCost;

  const discountAmount = 0;

    return {
      total_items: totalItems,
      total_quantity: totalQuantity,
      subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      promotion: null,
      total_amount: totalAmount,
      final_amount: totalAmount,
    };
  },

  // ===== Promotion helpers =====
  // Try to find a promotion by code from active promotions (public endpoint)
  findPromotionByCode: async (code: string): Promise<any | null> => {
    try {
      const resp = await api.get<any>(`/promotions/active`);
      const body = extractResponseBody(resp);
      const promos = Array.isArray(body) ? body : (body.data || body);
      const found = (promos || []).find((p: any) => (p.code || '').toLowerCase() === code.toLowerCase());
      return found || null;
    } catch (e) {
      console.error('🛒 cartService: findPromotionByCode error', e);
      return null;
    }
  },

  // Get best promotion for a given price
  getBestPromotionForPrice: async (price: number): Promise<any | null> => {
    try {
      const resp = await api.get<any>(`/promotions/best?price=${encodeURIComponent(price)}`);
      const body = extractResponseBody(resp);
      return body || null;
    } catch (e) {
      console.error('🛒 cartService: getBestPromotionForPrice error', e);
      return null;
    }
  },

  // Get all active promotions (normalized)
  getActivePromotions: async (): Promise<any[]> => {
    try {
      const resp = await api.get<any>(`/promotions/active`);
      const body = extractResponseBody(resp);
      // backend may return ApiResponse wrapper or direct array
      const list = Array.isArray(body) ? body : (body?.data || body);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('🛒 cartService: getActivePromotions error', e);
      return [];
    }
  },

  // Calculate discount for a promotion id and price
  calculateDiscountForPromotion: async (promotionId: number, originalPrice: number): Promise<{ discount_amount: number; final_price: number } | null> => {
    try {
      const resp = await api.get<any>(`/promotions/${promotionId}/calculate-discount?originalPrice=${encodeURIComponent(originalPrice)}`);
      const body = extractResponseBody(resp);
      // body expected: { promotion_id, original_price, discount_amount, final_price, savings }
      if (body && (body.discount_amount !== undefined || body.savings !== undefined)) {
        return { discount_amount: Number(body.discount_amount || body.savings || 0), final_price: Number(body.final_price || 0) };
      }
      return null;
    } catch (e) {
      console.error('🛒 cartService: calculateDiscountForPromotion error', e);
      return null;
    }
  },
};
