import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { 
  fetchCart,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeCartItem as removeCartItemAction,
  clearCart as clearCartAction,
  mergeGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  setGuestMode,
  clearError
} from '../store/slices/cartSlice';
import { useAuth } from './useAuth';
import { cartService } from '../services/cart.service';
import type { Product } from '../types/product.types';
import type { AddToCartRequest } from '../types/cart.types';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isCustomer } = useAuth();
  const { 
    items, 
    guest_items, 
    summary, 
    loading, 
    error, 
    is_guest_mode 
  } = useAppSelector((state) => state.cart);
  
  const CUSTOMER_ONLY_MESSAGE = 'Chỉ khách hàng mới được phép sử dụng giỏ hàng.';
  const assertCustomerAccess = () => {
    if (isAuthenticated && !is_guest_mode && !isCustomer) {
      if (import.meta.env.DEV) console.warn('🛒 useCart: Access denied for non-customer role');
      throw new Error(CUSTOMER_ONLY_MESSAGE);
    }
  };

  // Auto-fetch cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && isCustomer && !is_guest_mode) {
  if (import.meta.env.DEV) console.debug('🛒 useCart: User authenticated, fetching cart...');
      dispatch(fetchCart());
    }
  }, [isAuthenticated, isCustomer, is_guest_mode, dispatch]);

  // Auto-merge guest cart when user logs in
  useEffect(() => {
    if (isAuthenticated && isCustomer && guest_items && guest_items.length > 0) {
  if (import.meta.env.DEV) console.debug('🛒 useCart: User logged in with guest items, merging cart...', guest_items);
      dispatch(mergeGuestCart());
    }
  }, [isAuthenticated, isCustomer, guest_items, dispatch]);

  // Update guest mode based on authentication
  useEffect(() => {
    const newGuestMode = !isAuthenticated;
  if (import.meta.env.DEV) console.debug('🛒 useCart: Setting guest mode:', newGuestMode, 'authenticated:', isAuthenticated);
    dispatch(setGuestMode(newGuestMode));
  }, [isAuthenticated, dispatch]);

  // Add item to cart (handles both authenticated and guest)
  const addItem = async (product: Product, quantity: number = 1) => {
  if (import.meta.env.DEV) console.debug('🛒 useCart: Adding item to cart:', { product: product.name, quantity, isAuthenticated, is_guest_mode });
    
    if (isAuthenticated && !is_guest_mode) {
      assertCustomerAccess();
      // Add to server cart
      const cartData: AddToCartRequest = {
        product_id: product.id,
        quantity
      };
  if (import.meta.env.DEV) console.debug('🛒 useCart: Adding item to server cart:', cartData);
      const result = await dispatch(addToCartAction(cartData));
      
      if (result.type === 'cart/addToCart/fulfilled') {
  if (import.meta.env.DEV) console.debug('✅ useCart: Item added to server cart successfully');
        // Refresh cart to get updated summary from server
        await dispatch(fetchCart());
        return true;
      } else {
        console.error('❌ useCart: Failed to add item to server cart:', result);
        return false;
      }
    } else {
      // Add to guest cart
  if (import.meta.env.DEV) console.debug('🛒 useCart: Adding item to guest cart');
      dispatch(addToGuestCart({
        product_id: product.id,
        product,
        quantity,
        unit_price: product.price,
        total_price: product.price * quantity
      }));
  if (import.meta.env.DEV) console.debug('✅ useCart: Item added to guest cart successfully');
      return true;
    }
  };

  // Update cart item quantity
  const updateItemQuantity = async (productId: number, quantity: number, cartItemId?: number) => {
    assertCustomerAccess();

    if (isAuthenticated && !is_guest_mode && cartItemId) {
      // Update server cart
      const result = await dispatch(updateCartItemAction({
        cart_item_id: cartItemId,
        quantity
      }));
      return result.type === 'cart/updateCartItem/fulfilled';
    } else {
      // Update guest cart
      dispatch(updateGuestCartItem({ productId, quantity }));
      return true;
    }
  };

  // Remove item from cart
  const removeItem = async (productId: number, cartItemId?: number) => {
    try {
      assertCustomerAccess();

      if (isAuthenticated && !is_guest_mode) {
        // If caller didn't provide cartItemId, try to resolve from current items
        let resolvedId = cartItemId;
        if (!resolvedId) {
          const found = items?.find((it: any) => it.product?.id === productId);
          resolvedId = found?.id;
          if (import.meta.env.DEV) console.debug('🛒 useCart: Resolved cartItemId for removal:', { productId, resolvedId, found });
        }

        if (!resolvedId) {
          // Nothing to remove on server
          if (import.meta.env.DEV) console.warn('🛒 useCart: No cartItemId found to remove for productId', productId);
          return false;
        }

        const result = await dispatch(removeCartItemAction(resolvedId));
        return result.type === 'cart/removeCartItem/fulfilled';
      } else {
        // Remove from guest cart
        dispatch(removeGuestCartItem(productId));
        return true;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ useCart: removeItem error:', error);
      return false;
    }
  };

  // Clear entire cart
  const clearAllItems = async () => {
    assertCustomerAccess();

    if (isAuthenticated && !is_guest_mode) {
      // Clear server cart
      const result = await dispatch(clearCartAction());
      return result.type === 'cart/clearCart/fulfilled';
    } else {
      // Clear guest cart
      dispatch(clearGuestCart());
      return true;
    }
  };

  // Get cart item by product ID
  const getCartItem = (productId: number) => {
    if (is_guest_mode) {
      return guest_items?.find((item) => item.product_id === productId);
    } else {
      return items?.find((item) => item.product.id === productId);
    }
  };

  // Check if product is in cart
  const isInCart = (productId: number): boolean => {
    return !!getCartItem(productId);
  };

  // Get quantity of specific product in cart
  const getItemQuantity = (productId: number): number => {
    const item = getCartItem(productId);
    return item?.quantity || 0;
  };

  // Get total items count
  const getTotalItems = (): number => {
    if (is_guest_mode) {
      return guest_items?.length || 0;
    } else {
      return items?.length || 0;
    }
  };

  // Get total quantity
  const getTotalQuantity = (): number => {
    let quantity = 0;
    if (is_guest_mode) {
  quantity = guest_items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0;
  if (import.meta.env.DEV) console.debug('🛒 useCart: Guest mode quantity:', quantity, 'guest_items:', guest_items);
    } else {
      // Safe check for summary
      quantity = summary?.total_quantity || 0;
  if (import.meta.env.DEV) console.debug('🛒 useCart: Auth mode quantity:', quantity, 'summary:', summary);
    }
    return quantity;
  };

  // Get cart total amount
  const getTotalAmount = (): number => {
    let amount = 0;
    if (is_guest_mode) {
      // Calculate from guest items - safe check
      const guest_summary = cartService.calculateGuestCartSummary(guest_items || []);
  amount = guest_summary.total_amount;
  if (import.meta.env.DEV) console.debug('🛒 useCart: Guest mode amount:', amount, 'guest_summary:', guest_summary);
    } else {
      // Safe check for summary
      amount = summary?.total_amount || 0;
  if (import.meta.env.DEV) console.debug('🛒 useCart: Auth mode amount:', amount, 'summary:', summary);
    }
    return amount;
  };

  // Check if cart is empty
  const isEmpty = (): boolean => {
    return getTotalItems() === 0;
  };

  // Refresh cart data
  const refreshCart = async () => {
    if (isAuthenticated && !is_guest_mode && !isCustomer) {
      const message = 'Chỉ khách hàng mới được phép sử dụng giỏ hàng.';
  if (import.meta.env.DEV) console.warn('🛒 useCart: Access denied for non-customer role');
      throw new Error(message);
    }

    assertCustomerAccess();

    if (isAuthenticated && !is_guest_mode) {
      const result = await dispatch(fetchCart());
      return result.type === 'cart/fetchCart/fulfilled';
    }
    return true;
  };

  // Clear cart error
  const clearCartError = () => {
    dispatch(clearError());
  };

  // Get current cart items (unified interface)
  const getCurrentItems = () => {
    if (is_guest_mode) {
      return guest_items?.map((item: any) => {
        // Ensure product data exists for guest items
        if (!item.product) {
          console.warn('🛒 useCart: Guest item missing product data:', item);
          return null;
        }
        
        return {
          id: item.product_id,
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          created_at: item.added_at,
          updated_at: item.added_at
        };
      }).filter(item => item !== null) || [];
    } else {
      // For authenticated users, items should already have proper structure
      return items?.map((item: any) => {
        if (!item.product) {
          console.warn('🛒 useCart: Auth item missing product data:', item);
          return null;
        }
        return item;
      }).filter(item => item !== null) || [];
    }
  };

  return {
    // State
    items: getCurrentItems(),
    summary,
    loading,
    error,
    is_guest_mode,
    
    // Actions
    addItem,
    updateItemQuantity,
    removeItem,
    clearAllItems,
    refreshCart,
    clearCartError,
    
    // Utilities
    getCartItem,
    isInCart,
    getItemQuantity,
    getTotalItems,
    getTotalQuantity,
    getTotalAmount,
    isEmpty,
  };
};
