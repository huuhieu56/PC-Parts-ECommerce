import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '../../types/common.types';

interface SnackbarState {
  notifications: Notification[];
}

const initialState: SnackbarState = {
  notifications: [],
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        duration: action.payload.duration || 5000,
      };
      
      state.notifications.push(notification);
      
      // Keep max 5 notifications
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
    },

    // Convenience actions for different notification types
    addSuccessNotification: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'success',
        message: action.payload,
        timestamp: Date.now(),
        duration: 5000,
      };
      
      state.notifications.push(notification);
      
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },

    addErrorNotification: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'error',
        message: action.payload,
        timestamp: Date.now(),
        duration: 7000, // Longer duration for errors
      };
      
      state.notifications.push(notification);
      
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },

    addWarningNotification: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'warning',
        message: action.payload,
        timestamp: Date.now(),
        duration: 6000,
      };
      
      state.notifications.push(notification);
      
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },

    addInfoNotification: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'info',
        message: action.payload,
        timestamp: Date.now(),
        duration: 5000,
      };
      
      state.notifications.push(notification);
      
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearAllNotifications,
  addSuccessNotification,
  addErrorNotification,
  addWarningNotification,
  addInfoNotification,
} = snackbarSlice.actions;

export default snackbarSlice.reducer;
