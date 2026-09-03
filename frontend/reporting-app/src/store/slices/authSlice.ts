import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { User, UserRole } from '../../types';
import { apiClient } from '../../services/api';

interface AuthState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
}

const getInitialCurrentUser = (): User | null => {
  const saved = localStorage.getItem('team_dashboard_current_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return null;
};

const initialState: AuthState = {
  currentUser: getInitialCurrentUser(),
  users: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchUsers = createAsyncThunk('auth/fetchUsers', async () => {
  return await apiClient.users.getAll();
});

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, role }: { email: string; role?: UserRole }) => {
    return await apiClient.users.login(email, role);
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload: { name: string; email: string; role: UserRole; title?: string; department?: string }) => {
    return await apiClient.users.create({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      title: payload.title || 'Software Engineer',
      department: payload.department || 'Engineering',
    });
  }
);

export const updateUserRoleAsync = createAsyncThunk(
  'auth/updateUserRole',
  async ({ userId, role }: { userId: string; role: UserRole }) => {
    return await apiClient.users.updateRole(userId, role);
  }
);

export const deleteUserAsync = createAsyncThunk('auth/deleteUser', async (userId: string) => {
  await apiClient.users.delete(userId);
  return userId;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
      if (action.payload) {
        localStorage.setItem('team_dashboard_current_user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('team_dashboard_current_user');
      }
    },
    switchUser: (state, action: PayloadAction<string>) => {
      const user = state.users.find((u) => u.id === action.payload);
      if (user) {
        state.currentUser = user;
        localStorage.setItem('team_dashboard_current_user', JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.currentUser = null;
      localStorage.removeItem('team_dashboard_current_user');
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        // Synchronize currentUser if already logged in
        if (state.currentUser) {
          const found = action.payload.find((u) => u.id === state.currentUser?.id);
          if (found) {
            state.currentUser = found;
          }
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      });

    // Login User
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.currentUser = action.payload;
      localStorage.setItem('team_dashboard_current_user', JSON.stringify(action.payload));
      if (!state.users.some((u) => u.id === action.payload.id)) {
        state.users.push(action.payload);
      }
    });

    // Register User
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.users.push(action.payload);
      state.currentUser = action.payload;
      localStorage.setItem('team_dashboard_current_user', JSON.stringify(action.payload));
    });

    // Update Role
    builder.addCase(updateUserRoleAsync.fulfilled, (state, action) => {
      const idx = state.users.findIndex((u) => u.id === action.payload.id);
      if (idx >= 0) {
        state.users[idx] = action.payload;
      }
      if (state.currentUser?.id === action.payload.id) {
        state.currentUser = action.payload;
        localStorage.setItem('team_dashboard_current_user', JSON.stringify(action.payload));
      }
    });

    // Delete User
    builder.addCase(deleteUserAsync.fulfilled, (state, action) => {
      state.users = state.users.filter((u) => u.id !== action.payload);
      if (state.currentUser?.id === action.payload) {
        state.currentUser = null;
        localStorage.removeItem('team_dashboard_current_user');
      }
    });
  },
});

export const { setCurrentUser, switchUser, logout } = authSlice.actions;
export default authSlice.reducer;
