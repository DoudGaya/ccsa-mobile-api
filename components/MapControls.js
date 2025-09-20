import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Legend Component
export function MapLegend({ farmData = [] }) {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
      const div = L.DomUtil.create('div', 'legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
      div.style.fontSize = '12px';
      div.style.lineHeight = '18px';

      // Calculate statistics
      const verifiedCount = farmData.filter(f => f.status === 'verified').length;
      const pendingCount = farmData.filter(f => f.status === 'pending').length;
      const riceCount = farmData.filter(f => f.crop?.toLowerCase() === 'rice').length;
      const maizeCount = farmData.filter(f => f.crop?.toLowerCase() === 'maize').length;

      div.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>Farm Legend</strong></div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #10B981; border: 1px solid #059669; margin-right: 5px;"></span>
          Verified (${verifiedCount})
        </div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #F59E0B; border: 1px solid #D97706; margin-right: 5px;"></span>
          Pending (${pendingCount})
        </div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #3B82F6; border: 1px solid #2563EB; margin-right: 5px;"></span>
          Rice Farms (${riceCount})
        </div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #EF4444; border: 1px solid #DC2626; margin-right: 5px;"></span>
          Maize Farms (${maizeCount})
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6B7280;">
          Total: ${farmData.length} farms
        </div>
      `;

      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map, farmData]);

  return null;
}

// Map Controls Component
export function MapControls({ onZoomToFarms, onRefresh, loading }) {
  const map = useMap();

  useEffect(() => {
    const controls = L.control({ position: 'topleft' });

    controls.onAdd = function (map) {
      const div = L.DomUtil.create('div', 'map-controls');
      div.style.backgroundColor = 'white';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
      div.style.padding = '5px';
      div.style.marginTop = '10px';

      div.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <button id="zoom-to-farms" class="map-control-btn" title="Zoom to all farms">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
          <button id="refresh-farms" class="map-control-btn" title="Refresh farm data">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
      `;

      // Add styles for control buttons
      const style = document.createElement('style');
      style.textContent = `
        .map-control-btn {
          width: 30px;
          height: 30px;
          border: none;
          background: white;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .map-control-btn:hover {
          background: #f3f4f6;
        }
        .map-control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(style);

      // Add event listeners
      div.querySelector('#zoom-to-farms').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onZoomToFarms && onZoomToFarms();
      });

      div.querySelector('#refresh-farms').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onRefresh && onRefresh();
      });

      return div;
    };

    controls.addTo(map);

    return () => {
      controls.remove();
    };
  }, [map, onZoomToFarms, onRefresh]);

  return null;
}

// Scale Control Component
export function ScaleControl() {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false
    });

    scale.addTo(map);

    return () => {
      scale.remove();
    };
  }, [map]);

  return null;
}