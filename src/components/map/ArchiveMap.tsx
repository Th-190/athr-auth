import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Site } from '../../types';
import { getPublicCoordinates } from '../../utils/arabic';
import { ShieldAlert, Compass } from 'lucide-react';

interface ArchiveMapProps {
  sites: Site[];
  selectedSiteId?: string;
  onSelectSite: (site: Site) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

export const ArchiveMap: React.FC<ArchiveMapProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  height = '500px',
  center = [32.616, 44.0249],
  zoom = 10,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      // Add zoom control on bottom-left for RTL layout
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // OpenStreetMap archival warm tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | أثر كربلاء',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Don't destroy on every re-render to avoid flashing, handle in unmount
    };
  }, []);

  // Update markers when sites change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    sites.forEach(site => {
      // Security gate: always use public coordinates!
      const { lat, lng, isFuzzed } = getPublicCoordinates(site.lat, site.lng, site.location_precision);

      bounds.extend([lat, lng]);

      // Custom Heritage Pin styling
      const isSelected = site.id === selectedSiteId;
      const isRestricted = site.location_precision === 'restricted';
      const isDisputed = site.verification_status === 'disputed';
      const isMuseum = site.site_type_id === 'type_museums';

      const pinColor = isRestricted
        ? '#991B1B' // Rose red for restricted
        : isMuseum
        ? '#047857' // Distinct emerald for museums
        : isSelected
        ? '#9A3412' // Dark terracotta
        : isDisputed
        ? '#B45309' // Amber
        : '#78350F'; // Classic Bronze/Brick

      const customIcon = L.divIcon({
        className: 'custom-heritage-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '34px' : '28px'};
            height: ${isSelected ? '34px' : '28px'};
            background-color: ${pinColor};
            border: 2px solid #FBF9F5;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            color: #FFFFFF;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span>${isRestricted ? '🛡️' : isMuseum ? '🏛️' : '📍'}</span>
          </div>
        `,
        iconSize: [isSelected ? 34 : 28, isSelected ? 34 : 28],
        iconAnchor: [isSelected ? 17 : 14, isSelected ? 17 : 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupHtml = `
        <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10px; color: #78350F; font-family: 'JetBrains Mono', monospace; font-weight: bold;">
              ${site.permanent_id}
            </span>
            ${
              isFuzzed
                ? `<span style="font-size: 9px; background: #FEF2F2; color: #991B1B; padding: 1px 4px; border-radius: 2px; border: 1px solid #FECACA;">
                    ${isRestricted ? 'إحداثيات محجوبة احترازياً' : 'إحداثيات تقريبية'}
                   </span>`
                : ''
            }
          </div>
          <h4 style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0; color: #1C1917; font-family: 'Amiri', serif;">
            ${site.name_ar}
          </h4>
          <p style="font-size: 11px; color: #57534E; margin: 0 0 8px 0; line-height: 1.4;">
            ${site.short_description.substring(0, 95)}...
          </p>
          <div style="display: flex; items-center; justify-content: space-between; border-top: 1px solid #E7E5E4; padding-top: 6px; font-size: 11px;">
            <span style="color: #78716C;">
              ${site.verification_status === 'verified' ? '✓ محقق ومسند' : 'قيد التحقيق'}
            </span>
            <button id="btn-view-${site.id}" style="color: #78350F; font-weight: bold; cursor: pointer; background: none; border: none; text-decoration: underline;">
              عرض السجل الكامل ←
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-${site.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectSite(site);
          };
        }
      });

      marker.on('click', () => {
        onSelectSite(site);
      });

      markersGroup.addLayer(marker);
    });

    if (sites.length > 0 && !selectedSiteId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [sites, selectedSiteId]);

  return (
    <div className="relative rounded border border-[#EBE6DF] overflow-hidden bg-[#F7F4EE]">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Map legend strip */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs border border-stone-200 rounded p-2.5 shadow-xs text-xs text-stone-700 space-y-1.5 max-w-[220px]">
        <div className="flex items-center gap-2 font-semibold text-stone-900 border-b border-stone-100 pb-1">
          <Compass className="w-3.5 h-3.5 text-[#78350F]" />
          <span>الخريطة الطوبوغرافية</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#78350F]" />
          <span>معلم تاريخي محقق</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#047857]" />
          <span>متحف أو معرض تراثي</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#991B1B]" />
          <span>موقع محجوب الإحداثيات (حماية)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500 pt-1 border-t border-stone-100">
          <ShieldAlert className="w-3 h-3 shrink-0 text-amber-600" />
          <span>المواقع الحساسة تُعرض بنطاق تقريبي منعاً للنبش غير المشروع</span>
        </div>
      </div>
    </div>
  );
};
