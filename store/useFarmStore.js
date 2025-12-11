import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Zustand Store for Farms Management (Web Dashboard)
 */
export const useFarmStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        farms: [],
        loading: false,
        error: null,
        selectedFarm: null,
        filters: {
          search: '',
          state: '',
          crop: '',
          ownership: '',
          farmerId: ''
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0
        },

        // Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters }
        })),
        resetFilters: () => set({
          filters: {
            search: '',
            state: '',
            crop: '',
            ownership: '',
            farmerId: ''
          }
        }),

        // Fetch farms
        fetchFarms: async () => {
          const { filters, pagination } = get();
          set({ loading: true, error: null });

          try {
            const queryParams = new URLSearchParams({
              page: pagination.page.toString(),
              limit: pagination.limit.toString(),
              ...(filters.search && { search: filters.search }),
              ...(filters.state && { state: filters.state }),
              ...(filters.crop && { crop: filters.crop }),
              ...(filters.farmerId && { farmerId: filters.farmerId })
            });

            const response = await fetch(`/api/farms?${queryParams}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            set({
              farms: data.farms || [],
              pagination: {
                page: data.pagination?.page || 1,
                limit: data.pagination?.limit || 50,
                total: data.pagination?.total || 0,
                pages: data.pagination?.pages || 0
              },
              loading: false
            });

            return data.farms;
          } catch (error) {
            console.error('Error fetching farms:', error);
            set({ loading: false, error: error.message, farms: [] });
            throw error;
          }
        },

        // Get farm by ID
        getFarmById: async (id) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/farms/${id}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            set({ selectedFarm: data, loading: false });
            return data;
          } catch (error) {
            console.error('Error fetching farm:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Update farm
        updateFarm: async (id, updates) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/farms/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const updatedFarm = await response.json();
            set((state) => ({
              farms: state.farms.map(f => f.id === id ? updatedFarm : f),
              selectedFarm: state.selectedFarm?.id === id ? updatedFarm : state.selectedFarm,
              loading: false
            }));

            return updatedFarm;
          } catch (error) {
            console.error('Error updating farm:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Delete farm
        deleteFarm: async (id) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/farms/${id}`, {
              method: 'DELETE'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            set((state) => ({
              farms: state.farms.filter(f => f.id !== id),
              pagination: {
                ...state.pagination,
                total: state.pagination.total - 1
              },
              loading: false
            }));

            return true;
          } catch (error) {
            console.error('Error deleting farm:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        }
      }),
      {
        name: 'farm-storage',
        partialize: (state) => ({ filters: state.filters })
      }
    ),
    { name: 'FarmStore' }
  )
);
