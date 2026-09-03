import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarNotification {
  id: string;
  type: SnackbarType;
  message: string;
  statusCode?: number;
  duration?: number;
}

interface NotificationState {
  notifications: SnackbarNotification[];
}

const initialState: NotificationState = {
  notifications: [],
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showSnackbar: (
      state,
      action: PayloadAction<{
        type: SnackbarType;
        message: string;
        statusCode?: number;
        duration?: number;
      }>
    ) => {
      const id = `snack-${crypto.randomUUID()}`;
      state.notifications.push({
        id,
        type: action.payload.type,
        message: action.payload.message,
        statusCode: action.payload.statusCode,
        duration: action.payload.duration ?? 4500,
      });
    },
    hideSnackbar: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearAllSnackbars: (state) => {
      state.notifications = [];
    },
  },
});

export const { showSnackbar, hideSnackbar, clearAllSnackbars } = notificationSlice.actions;
export default notificationSlice.reducer;

