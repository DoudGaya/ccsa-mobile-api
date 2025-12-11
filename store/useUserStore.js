import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Zustand Store for Users/Agents Management
 */
export const useUserStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        users: [],
        agents: [],
        loading: false,
        error: null,
        selectedUser: null,
        filters: {
          search: '',
          role: 'all',
          status: 'all'
        },

        // Actions
        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters }
        })),

        // Fetch users
        fetchUsers: async () => {
          set({ loading: true, error: null });

          try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            set({ users: data.users || data, loading: false });
            return data.users || data;
          } catch (error) {
            console.error('Error fetching users:', error);
            set({ loading: false, error: error.message, users: [] });
            throw error;
          }
        },

        // Fetch agents
        fetchAgents: async () => {
          set({ loading: true, error: null });

          try {
            const response = await fetch('/api/agents');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            set({ agents: data.agents || data, loading: false });
            return data.agents || data;
          } catch (error) {
            console.error('Error fetching agents:', error);
            set({ loading: false, error: error.message, agents: [] });
            throw error;
          }
        },

        // Update user
        updateUser: async (id, updates) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/users/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const updatedUser = await response.json();
            set((state) => ({
              users: state.users.map(u => u.id === id ? updatedUser : u),
              loading: false
            }));

            return updatedUser;
          } catch (error) {
            console.error('Error updating user:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Delete user
        deleteUser: async (id) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/users/${id}`, {
              method: 'DELETE'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            set((state) => ({
              users: state.users.filter(u => u.id !== id),
              loading: false
            }));

            return true;
          } catch (error) {
            console.error('Error deleting user:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        }
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ filters: state.filters })
      }
    ),
    { name: 'UserStore' }
  )
);
