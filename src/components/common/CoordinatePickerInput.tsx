import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clipboard, Check, AlertCircle, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface CoordinatePickerInputProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  onChangeLat: (lat: number | null) => void;
  onChangeLng: (lng: number | null) => void;
  disabled?: boolean;
  className?: string;
}

export const CoordinatePickerInput: React.FC<CoordinatePickerInputProps> = ({
  lat,
  lng,
  onChangeLat,
  onChangeLng,
  disabled = false,
  className = '',
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');

  // Local string values to allow fluid typing of decimals like "32." without NaN issues
  const [rawLat, setRawLat] = useState<string>(lat !== null && lat !== undefined ? String(lat) : '');
  const [rawLng, setRawLng] = useState<string>(lng !== null && lng !== undefined ? String(lng) : '');

  useEffect(() => {
    setRawLat(lat !== null && lat !== undefined ? String(lat) : '');
  }, [lat]);

  useEffect(() => {
    setRawLng(lng !== null && lng !== undefined ? String(lng) : '');
  }, [lng]);

  const handleLatChange = (text: string) => {
    setRawLat(text);
    if (!text.trim()) {
      onChangeLat(null);
      return;
    }
    const val = parseFloat(text);
    if (!isNaN(val)) {
      onChangeLat(val);
    }
  };

  const handleLngChange = (text: string) => {
    setRawLng(text);
    if (!text.trim()) {
      onChangeLng(null);
      return;
    }
    const val = parseFloat(text);
    if (!isNaN(val)) {
      onChangeLng(val);
    }
  };

  // Parse pasted coordinates in various common formats
  const handleApplyPaste = () => {
    setPasteError('');
    const text = pasteText.trim();
    if (!text) {
      setPasteError('يرجى لصق نص يحتوي على الإحداثيات.');
      return;
    }

    // Try Decimal "32.6160, 44.0325" or "32.6160 44.0325"
    const decimalMatch = text.match(/([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)/);
    if (decimalMatch) {
      const parsedLat = parseFloat(decimalMatch[1]);
      const parsedLng = parseFloat(decimalMatch[2]);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        onChangeLat(parsedLat);
        onChangeLng(parsedLng);
        setIsPasteOpen(false);
        setPasteText('');
        return;
      }
    }

    // Try DMS like 32°36'57"N 44°01'57"E
    const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSEWnsew])?/g;
    const matches = [...text.matchAll(dmsRegex)];
    if (matches.length >= 2) {
      const parseDms = (deg: string, min: string, sec?: string, dir?: string) => {
        let val = parseFloat(deg) + parseFloat(min) / 60 + (sec ? parseFloat(sec) / 3600 : 0);
        if (dir && (dir.toUpperCase() === 'S' || dir.toUpperCase() === 'W')) {
          val = -val;
        }
        return val;
      };

      const m1 = matches[0];
      const m2 = matches[1];
      const parsedLat = parseDms(m1[1], m1[2], m1[3], m1[4]);
      const parsedLng = parseDms(m2[1], m2[2], m2[3], m2[4]);

      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        onChangeLat(Number(parsedLat.toFixed(6)));
        onChangeLng(Number(parsedLng.toFixed(6)));
        setIsPasteOpen(false);
        setPasteText('');
        return;
      }
    }

    setPasteError('تعذر استخراج إحداثيات صحيحة. يرجى التأكد من التنسيق (مثال: 32.6160, 44.0325).');
  };

  const isLatValid = !rawLat.trim() || (!isNaN(parseFloat(rawLat)) && parseFloat(rawLat) >= -90 && parseFloat(rawLat) <= 90);
  const isLngValid = !rawLng.trim() || (!isNaN(parseFloat(rawLng)) && parseFloat(rawLng) >= -180 && parseFloat(rawLng) <= 180);

  const isKarbalaRegion =
    lat !== null &&
    lat !== undefined &&
    lng !== null &&
    lng !== undefined &&
    lat >= 31.0 &&
    lat <= 33.5 &&
    lng >= 43.0 &&
    lng <= 45.0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-700">الإحداثيات الجغرافية (WGS84)</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsPasteOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-stone-300 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <Clipboard className="w-3 h-3 text-[#78350F]" />
            لصق إحداثيات
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsMapOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-[#78350F] bg-amber-50 px-2 py-1 text-[11px] font-medium text-[#78350F] hover:bg-amber-100 cursor-pointer"
          >
            <MapPin className="w-3 h-3 text-[#78350F]" />
            تحديد من الخريطة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-1">
            خط العرض (Latitude) <span className="text-stone-400">[-90 إلى 90]</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            disabled={disabled}
            placeholder="مثال: 32.61603"
            value={rawLat}
            onChange={e => handleLatChange(e.target.value)}
            className={`w-full min-h-[42px] rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 transition-colors focus:outline-none focus:ring-1 ${
              !isLatValid
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                : 'border-[#D5CEBF] focus:border-[#78350F] focus:ring-[#78350F]'
            }`}
          />
          {!isLatValid && (
            <p className="mt-1 text-[10px] text-rose-600">خط العرض يجب أن يكون بين -90 و 90 درجة.</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-1">
            خط الطول (Longitude) <span className="text-stone-400">[-180 إلى 180]</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            disabled={disabled}
            placeholder="مثال: 44.03254"
            value={rawLng}
            onChange={e => handleLngChange(e.target.value)}
            className={`w-full min-h-[42px] rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 transition-colors focus:outline-none focus:ring-1 ${
              !isLngValid
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                : 'border-[#D5CEBF] focus:border-[#78350F] focus:ring-[#78350F]'
            }`}
          />
          {!isLngValid && (
            <p className="mt-1 text-[10px] text-rose-600">خط الطول يجب أن يكون بين -180 و 180 درجة.</p>
          )}
        </div>
      </div>

      {isKarbalaRegion && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>الإحداثيات تقع ضمن نطاق محافظة كربلاء والمناطق المحيطة.</span>
        </div>
      )}

      {/* Paste Dialog Modal */}
      {isPasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-[#78350F]" />
                لصق إحداثيات جغرافية
              </h3>
              <button
                type="button"
                onClick={() => setIsPasteOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-stone-600">
                الصق الإحداثيات بأي صيغة شائعة من خرائط Google أو الأجهزة المساحية:
              </p>
              <textarea
                rows={3}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="مثال: 32.61603, 44.03254 أو 32°36'57.7&quot;N 44°01'57.1&quot;E"
                className="w-full rounded-lg border border-[#D5CEBF] p-3 text-xs text-stone-900 focus:border-[#78350F] focus:outline-none focus:ring-1 focus:ring-[#78350F]"
              />

              {pasteError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasteOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  className="rounded-lg bg-[#78350F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#602b0c] cursor-pointer"
                >
                  تطبيق الإحداثيات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Selection Modal */}
      {isMapOpen && (
        <MapPickerModal
          initialLat={lat ?? 32.6160}
          initialLng={lng ?? 44.0325}
          onConfirm={(pickedLat, pickedLng) => {
            onChangeLat(pickedLat);
            onChangeLng(pickedLng);
            setIsMapOpen(false);
          }}
          onClose={() => setIsMapOpen(false)}
        />
      )}
    </div>
  );
};

interface MapPickerModalProps {
  initialLat: number;
  initialLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<{ lat: number; lng: number }>({
    lat: Number(initialLat.toFixed(6)),
    lng: Number(initialLng.toFixed(6)),
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: 'custom-map-picker-pin',
      html: `<div style="background-color: #78350F; width: 18px; height: 18px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setPicked({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
    });

    map.on('click', e => {
      marker.setLatLng(e.latlng);
      setPicked({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
    };
  }, [initialLat, initialLng]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#78350F]" />
              تحديد موقع المعلم على الخارطة
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              انقر على الخريطة أو اسحب العلامة لتحديد الإحداثيات بدقة.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mt-3 flex-1 min-h-[350px] w-full rounded-xl overflow-hidden border border-stone-300">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
          <div className="font-mono text-xs text-stone-700 bg-stone-100 rounded px-3 py-1.5">
            خط العرض: <bdi className="font-bold">{picked.lat}</bdi> · خط الطول: <bdi className="font-bold">{picked.lng}</bdi>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => onConfirm(picked.lat, picked.lng)}
              className="rounded-lg bg-[#78350F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#602b0c] cursor-pointer"
            >
              اعتماد الإحداثيات المحددة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
