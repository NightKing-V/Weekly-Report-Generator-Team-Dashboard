import { create } from 'zustand';

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
  showSnackbar: (payload: {
    type: SnackbarType;
    message: string;
    duration?: number;
  }) => void;
  hideSnackbar: (id: string) => void;
  clearAllSnackbars: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  showSnackbar: ({ type, message, duration = 4500 }) => {
    const id = `snack-${crypto.randomUUID()}`;
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, type, message, duration },
      ],
    }));
  },

  hideSnackbar: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAllSnackbars: () => {
    set({ notifications: [] });
  },
}));

