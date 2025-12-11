import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Zustand Store for Farmers Management (Web Dashboard)
 * Provides centralized state management with persistence and devtools
 */
export const useFarmerStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        farmers: [],
        loading: false,
        error: null,
        selectedFarmer: null,
        filters: {
          search: '',
          state: '',
          gender: '',
          status: 'all',
          cluster: '',
          startDate: '',
          endDate: ''
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
          hasMore: false,
          loadedAll: false
        },
        analytics: {
          overview: {
            totalFarmers: 0,
            totalHectares: 0,
            totalFarms: 0,
            verificationRate: 0,
            farmRegistrationRate: 0
          },
          topStates: [],
          topLGAs: [],
          topCrops: []
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
            gender: '',
            status: 'all',
            cluster: '',
            startDate: '',
            endDate: ''
          }
        }),

        setPagination: (pagination) => set((state) => ({
          pagination: { ...state.pagination, ...pagination }
        })),

        setSelectedFarmer: (farmer) => set({ selectedFarmer: farmer }),

        // Fetch all farmers with filters
        fetchFarmers: async (loadAll = false) => {
          const { filters, pagination } = get();
          
          set({ loading: true, error: null });

          try {
            const queryParams = new URLSearchParams({
              page: pagination.page.toString(),
              limit: loadAll ? '10000' : pagination.limit.toString(),
              ...(filters.search && { search: filters.search }),
              ...(filters.state && { state: filters.state }),
              ...(filters.status !== 'all' && { status: filters.status }),
              ...(filters.cluster && { cluster: filters.cluster }),
              ...(filters.startDate && { startDate: filters.startDate }),
              ...(filters.endDate && { endDate: filters.endDate }),
              ...(loadAll && { loadAll: 'true' })
            });

            const response = await fetch(`/api/farmers?${queryParams}`);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            set({
              farmers: data.farmers || [],
              pagination: {
                page: data.pagination?.page || 1,
                limit: data.pagination?.limit || 50,
                total: data.pagination?.total || 0,
                pages: data.pagination?.pages || 0,
                hasMore: data.pagination?.hasMore || false,
                loadedAll: data.pagination?.loadedAll || loadAll
              },
              loading: false
            });

            return data.farmers;
          } catch (error) {
            console.error('Error fetching farmers:', error);
            set({ 
              loading: false, 
              error: error.message,
              farmers: []
            });
            throw error;
          }
        },

        // Load all farmers (for admin dashboard)
        loadAllFarmers: async () => {
          return get().fetchFarmers(true);
        },

        // Fetch analytics
        fetchAnalytics: async () => {
          try {
            const response = await fetch('/api/farmers/analytics');
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            set({
              analytics: {
                overview: data.overview || {},
                topStates: data.topStates || [],
                topLGAs: data.topLGAs || [],
                topCrops: data.topCrops || []
              }
            });

            return data;
          } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
          }
        },

        // Search farmers locally (if all loaded)
        searchLocal: (query) => {
          const { farmers, pagination } = get();
          
          if (!pagination.loadedAll) {
            console.warn('Cannot search locally - all farmers not loaded');
            return farmers;
          }

          const searchLower = query.toLowerCase().trim();
          
          if (!searchLower) return farmers;

          return farmers.filter(farmer => {
            const fullName = `${farmer.firstName} ${farmer.middleName || ''} ${farmer.lastName}`.toLowerCase();
            const phone = (farmer.phone || '').toLowerCase();
            const nin = (farmer.nin || '').toLowerCase();
            const email = (farmer.email || '').toLowerCase();
            const state = (farmer.state || '').toLowerCase();
            const lga = (farmer.lga || '').toLowerCase();

            return fullName.includes(searchLower) ||
                   phone.includes(searchLower) ||
                   nin.includes(searchLower) ||
                   email.includes(searchLower) ||
                   state.includes(searchLower) ||
                   lga.includes(searchLower);
          });
        },

        // Filter farmers locally
        filterLocal: () => {
          const { farmers, filters } = get();
          
          let filtered = [...farmers];

          if (filters.state) {
            filtered = filtered.filter(f => f.state === filters.state);
          }

          if (filters.gender) {
            filtered = filtered.filter(f => f.gender === filters.gender);
          }

          if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(f => f.status === filters.status);
          }

          if (filters.cluster) {
            filtered = filtered.filter(f => f.clusterId === filters.cluster);
          }

          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(farmer => {
              const fullName = `${farmer.firstName} ${farmer.middleName || ''} ${farmer.lastName}`.toLowerCase();
              return fullName.includes(searchLower) ||
                     (farmer.phone || '').toLowerCase().includes(searchLower) ||
                     (farmer.nin || '').toLowerCase().includes(searchLower);
            });
          }

          return filtered;
        },

        // Get farmer by ID
        getFarmerById: async (id) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/farmers/${id}`);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            set({ selectedFarmer: data, loading: false });
            return data;
          } catch (error) {
            console.error('Error fetching farmer:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Update farmer
        updateFarmer: async (id, updates) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/farmers/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const updatedFarmer = await response.json();

            set((state) => ({
              farmers: state.farmers.map(f => f.id === id ? updatedFarmer : f),
              selectedFarmer: state.selectedFarmer?.id === id ? updatedFarmer : state.selectedFarmer,
              loading: false
            }));

            return updatedFarmer;
          } catch (error) {
            console.error('Error updating farmer:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Delete farmer
        deleteFarmer: async (id) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/farmers/${id}`, {
              method: 'DELETE'
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            set((state) => ({
              farmers: state.farmers.filter(f => f.id !== id),
              pagination: {
                ...state.pagination,
                total: state.pagination.total - 1
              },
              loading: false
            }));

            return true;
          } catch (error) {
            console.error('Error deleting farmer:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Export farmers
        exportFarmers: async (format = 'csv') => {
          const { filters } = get();

          try {
            const queryParams = new URLSearchParams({
              format,
              ...(filters.search && { search: filters.search }),
              ...(filters.state && { state: filters.state }),
              ...(filters.status !== 'all' && { status: filters.status }),
              ...(filters.cluster && { cluster: filters.cluster })
            });

            const response = await fetch(`/api/farmers/export?${queryParams}`);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `farmers-export-${new Date().toISOString()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return true;
          } catch (error) {
            console.error('Error exporting farmers:', error);
            throw error;
          }
        },

        // Reset store
        reset: () => set({
          farmers: [],
          loading: false,
          error: null,
          selectedFarmer: null,
          filters: {
            search: '',
            state: '',
            gender: '',
            status: 'all',
            cluster: '',
            startDate: '',
            endDate: ''
          },
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            pages: 0,
            hasMore: false,
            loadedAll: false
          }
        })
      }),
      {
        name: 'farmer-storage',
        partialize: (state) => ({
          filters: state.filters,
          pagination: { ...state.pagination, page: 1 } // Reset page on reload
        })
      }
    ),
    { name: 'FarmerStore' }
  )
);
