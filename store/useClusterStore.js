import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Zustand Store for Clusters Management
 */
export const useClusterStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        clusters: [],
        loading: false,
        error: null,
        selectedCluster: null,
        filters: {
          search: '',
          state: '',
          status: 'all'
        },

        // Actions
        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters }
        })),

        // Fetch clusters
        fetchClusters: async () => {
          set({ loading: true, error: null });

          try {
            const response = await fetch('/api/clusters');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            set({ clusters: data.clusters || data, loading: false });
            return data.clusters || data;
          } catch (error) {
            console.error('Error fetching clusters:', error);
            set({ loading: false, error: error.message, clusters: [] });
            throw error;
          }
        },

        // Get cluster by ID
        getClusterById: async (id) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/clusters/${id}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            set({ selectedCluster: data, loading: false });
            return data;
          } catch (error) {
            console.error('Error fetching cluster:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Create cluster
        createCluster: async (clusterData) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch('/api/clusters', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clusterData)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const newCluster = await response.json();
            set((state) => ({
              clusters: [...state.clusters, newCluster],
              loading: false
            }));

            return newCluster;
          } catch (error) {
            console.error('Error creating cluster:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Update cluster
        updateCluster: async (id, updates) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/clusters/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const updatedCluster = await response.json();
            set((state) => ({
              clusters: state.clusters.map(c => c.id === id ? updatedCluster : c),
              loading: false
            }));

            return updatedCluster;
          } catch (error) {
            console.error('Error updating cluster:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        },

        // Delete cluster
        deleteCluster: async (id) => {
          set({ loading: true, error: null });

          try {
            const response = await fetch(`/api/clusters/${id}`, {
              method: 'DELETE'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            set((state) => ({
              clusters: state.clusters.filter(c => c.id !== id),
              loading: false
            }));

            return true;
          } catch (error) {
            console.error('Error deleting cluster:', error);
            set({ loading: false, error: error.message });
            throw error;
          }
        }
      }),
      {
        name: 'cluster-storage',
        partialize: (state) => ({ filters: state.filters })
      }
    ),
    { name: 'ClusterStore' }
  )
);
