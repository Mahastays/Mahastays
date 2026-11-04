'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Copy,
  Check,
  Map as MapIcon,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  fullAddress?: string;
  mapLink?: string;
}

export interface NearbyAttraction {
  name: string;
  distance: string;
  desc?: string;
}

interface LocationMapPickerProps {
  propertyName: string;
  locationArea?: string;
  initialCoordinates?: { lat?: number; lng?: number; fullAddress?: string; mapLink?: string };
  isEditMode: boolean;
  nearbyAttractions?: NearbyAttraction[];
  onChange?: (coords: LocationCoordinates) => void;
  onAttractionsChange?: (attractions: NearbyAttraction[]) => void;
}

// Preset popular locations across Maharashtra hill stations & getaways
const MAHARASHTRA_PRESETS = [
  { name: 'Table Land, Panchgani', lat: 17.9242, lng: 73.8015, area: 'Panchgani' },
  { name: 'Venna Lake Road, Mahabaleshwar', lat: 17.9202, lng: 73.6738, area: 'Venna Lake' },
  { name: 'Old Mahabaleshwar Temple', lat: 17.9489, lng: 73.6619, area: 'Old Mahabaleshwar' },
  { name: 'Arthur’s Seat Peak', lat: 17.9866, lng: 73.6186, area: 'Arthur Seat Valley' },
  { name: 'Kate’s Point / Needle Hole', lat: 17.9255, lng: 73.7011, area: 'Kate’s Point' },
  { name: 'Mapro Garden, Gureghar', lat: 17.9218, lng: 73.7431, area: 'Gureghar / Panchgani Rd' },
  { name: 'Lingmala Waterfall Ridge', lat: 17.9304, lng: 73.6931, area: 'Lingmala' },
  { name: 'Pratapgad Fort Heritage', lat: 17.9317, lng: 73.5786, area: 'Pratapgad' },
  { name: 'Sydney Point, Panchgani', lat: 17.9312, lng: 73.8034, area: 'Panchgani Overlook' },
  { name: 'Lonavala Tiger Point', lat: 18.7231, lng: 73.3768, area: 'Lonavala' },
];

export default function LocationMapPicker({
  propertyName,
  locationArea = 'Panchgani & Mahabaleshwar, Maharashtra',
  initialCoordinates,
  isEditMode,
  nearbyAttractions = [],
  onChange,
  onAttractionsChange,
}: LocationMapPickerProps) {
  // Center coordinates (default: Table Land / Mahabaleshwar)
  const [lat, setLat] = useState<number>(() => {
    const v = initialCoordinates?.lat;
    return typeof v === 'number' && !isNaN(v) && v !== 0 ? v : 17.9242;
  });

  const [lng, setLng] = useState<number>(() => {
    const v = initialCoordinates?.lng;
    return typeof v === 'number' && !isNaN(v) && v !== 0 ? v : 73.8015;
  });

  const [fullAddress, setFullAddress] = useState<string>(
    initialCoordinates?.fullAddress || locationArea || 'Panchgani & Mahabaleshwar, Maharashtra'
  );

  // Map view controls
  const [zoomLevel, setZoomLevel] = useState<number>(14); // delta range
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [manualPinMode, setManualPinMode] = useState(false);

  // Sync when initialCoordinates update
  useEffect(() => {
    if (initialCoordinates?.lat && !isNaN(initialCoordinates.lat)) {
      setLat(initialCoordinates.lat);
    }
    if (initialCoordinates?.lng && !isNaN(initialCoordinates.lng)) {
      setLng(initialCoordinates.lng);
    }
    if (initialCoordinates?.fullAddress) {
      setFullAddress(initialCoordinates.fullAddress);
    }
  }, [initialCoordinates?.lat, initialCoordinates?.lng, initialCoordinates?.fullAddress]);

  // Compute bounding box for OpenStreetMap embed
  const delta = useMemo(() => {
    // Zoom 16: delta ~0.005, Zoom 14: delta ~0.015, Zoom 12: delta ~0.04
    switch (zoomLevel) {
      case 16:
        return 0.005;
      case 15:
        return 0.009;
      case 13:
        return 0.025;
      case 12:
        return 0.045;
      case 14:
      default:
        return 0.015;
    }
  }, [zoomLevel]);

  const mapEmbedUrl = useMemo(() => {
    const minLng = (lng - delta).toFixed(5);
    const minLat = (lat - delta * 0.75).toFixed(5);
    const maxLng = (lng + delta).toFixed(5);
    const maxLat = (lat + delta * 0.75).toFixed(5);
    const markerLat = lat.toFixed(5);
    const markerLng = lng.toFixed(5);

    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${markerLat}%2C${markerLng}`;
  }, [lat, lng, delta]);

  const googleMapsUrl = useMemo(() => {
    return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  }, [lat, lng]);

  const updateCoordinates = (newLat: number, newLng: number, newAddress?: string) => {
    const cleanLat = parseFloat(newLat.toFixed(6));
    const cleanLng = parseFloat(newLng.toFixed(6));
    setLat(cleanLat);
    setLng(cleanLng);

    const addr = newAddress !== undefined ? newAddress : fullAddress;
    if (newAddress !== undefined) {
      setFullAddress(newAddress);
    }

    if (onChange) {
      onChange({
        lat: cleanLat,
        lng: cleanLng,
        fullAddress: addr,
        mapLink: `https://www.google.com/maps?q=${cleanLat},${cleanLng}`,
      });
    }
  };

  // Search Address / Landmark
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchMsg('');

    // Check presets first for instant accurate Western Ghats match
    const qLower = searchQuery.toLowerCase().trim();
    const matchedPreset = MAHARASHTRA_PRESETS.find(
      (p) => p.name.toLowerCase().includes(qLower) || p.area.toLowerCase().includes(qLower)
    );

    if (matchedPreset) {
      updateCoordinates(matchedPreset.lat, matchedPreset.lng, `${matchedPreset.name}, Maharashtra`);
      setSearchMsg(`Found preset location: ${matchedPreset.name}`);
      setIsSearching(false);
      return;
    }

    // Query Nominatim OpenStreetMap API
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Maharashtra, India'
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        updateCoordinates(newLat, newLng, result.display_name?.split(',').slice(0, 3).join(', '));
        setSearchMsg(`Location matched: ${result.display_name?.split(',')[0]}`);
      } else {
        setSearchMsg('No exact match found. You can adjust latitude/longitude manually below.');
      }
    } catch {
      setSearchMsg('Network search unavailable. Please enter coordinates manually.');
    } finally {
      setIsSearching(false);
    }
  };

  // Device GPS
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateCoordinates(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
        setSearchMsg('Location set from device GPS.');
      },
      (err) => {
        console.error('GPS error:', err);
        setGpsLoading(false);
        alert('Could not retrieve device GPS location. You can enter coordinates manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Copy coordinates
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(googleMapsUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Map Click to mark location: calculates offset on the map frame
  const handleMapOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode && !manualPinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalised between -0.5 and +0.5
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;

    // Convert pixel offset to delta coordinates
    const newLng = lng + normX * (delta * 2);
    const newLat = lat - normY * (delta * 1.5);

    updateCoordinates(newLat, newLng);
  };

  // Nearby Attractions Handlers
  const handleAddAttraction = () => {
    if (!onAttractionsChange) return;
    const current = nearbyAttractions ? [...nearbyAttractions] : [];
    onAttractionsChange([
      ...current,
      { name: 'New Landmark / Attraction', distance: '3.0 km • 8 mins drive', desc: 'Scenic viewpoint & visitor attraction' },
    ]);
  };

  const handleUpdateAttraction = (idx: number, field: keyof NearbyAttraction, value: string) => {
    if (!onAttractionsChange) return;
    const current = [...nearbyAttractions];
    if (current[idx]) {
      current[idx] = { ...current[idx], [field]: value };
      onAttractionsChange(current);
    }
  };

  const handleRemoveAttraction = (idx: number) => {
    if (!onAttractionsChange) return;
    const filtered = nearbyAttractions.filter((_, i) => i !== idx);
    onAttractionsChange(filtered);
  };

  return (
    <div className="bg-white rounded-[26px] p-5 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
      {/* ─── Top Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 font-poppins">
              Location &amp; Interactive Map
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#ea110d] border border-rose-200">
              Live Map Coordinates
            </span>
          </div>
          <p className="text-xs text-slate-500 font-roboto mt-0.5">
            {fullAddress || locationArea}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold font-poppins transition cursor-pointer"
            title="Copy Google Maps navigation link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy GPS Link'}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold font-poppins transition shadow-xs"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ─── Edit Mode Toolbar: Search, GPS, and Manual Coordinates ─── */}
      {isEditMode && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-amber-950 font-poppins flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-[#ea110d]" />
              <span>Mark Location Manually on Map</span>
            </span>
            <span className="text-[11px] text-amber-800">
              Click anywhere on the map or enter coordinates to reposition the property pin
            </span>
          </div>

          {/* Search Bar + GPS Button */}
          <form onSubmit={handleSearchLocation} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landmark or road (e.g. Table Land, Venna Lake, Panchgani Market)..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 focus:outline-[#ea110d]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-poppins transition cursor-pointer disabled:opacity-50"
              >
                {isSearching ? 'Locating...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold font-poppins transition cursor-pointer disabled:opacity-50"
                title="Use current browser location"
              >
                <Navigation className={`w-3.5 h-3.5 text-[#ea110d] ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>Device GPS</span>
              </button>
            </div>
          </form>

          {searchMsg && (
            <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              {searchMsg}
            </p>
          )}

          {/* Popular Maharashtra Presets Quick Chips */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 tracking-wider">
              Popular Destination Presets (Click to Auto-Drop Pin):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MAHARASHTRA_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateCoordinates(p.lat, p.lng, `${p.name}, Maharashtra`)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition border cursor-pointer ${
                    Math.abs(lat - p.lat) < 0.005 && Math.abs(lng - p.lng) < 0.005
                      ? 'bg-[#ea110d] text-white border-[#ea110d] font-bold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Coordinate Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Latitude (Lat)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => updateCoordinates(parseFloat(e.target.value) || lat, lng)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-[#ea110d]"
                />
                <button
                  type="button"
                  onClick={() => updateCoordinates(lat - 0.001, lng)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
                  title="Shift South"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => updateCoordinates(lat + 0.001, lng)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
                  title="Shift North"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Longitude (Lng)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => updateCoordinates(lat, parseFloat(e.target.value) || lng)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-[#ea110d]"
                />
                <button
                  type="button"
                  onClick={() => updateCoordinates(lat, lng - 0.001)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
                  title="Shift West"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => updateCoordinates(lat, lng + 0.001)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
                  title="Shift East"
                >
                  +
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Full Street / Village Address
              </label>
              <input
                type="text"
                value={fullAddress}
                onChange={(e) => updateCoordinates(lat, lng, e.target.value)}
                placeholder="e.g. Plot 12, Table Land Road, Panchgani"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-[#ea110d]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── The Interactive Map Viewport ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
        {/* Live OpenStreetMap Interactive Iframe */}
        <iframe
          title="Property Location Map"
          src={mapEmbedUrl}
          className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
          loading="lazy"
        />

        {/* Top Control Bar Over Map */}
        <div className="relative z-10 m-3 flex items-center justify-between pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 text-xs font-bold font-poppins text-slate-800 flex items-center gap-1.5 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{propertyName}</span>
            <span className="text-[10px] font-normal text-slate-500 font-mono">
              ({lat.toFixed(4)}, {lng.toFixed(4)})
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 pointer-events-auto">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(16, z + 1))}
              disabled={zoomLevel >= 16}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-slate-400 px-1 font-mono">
              {zoomLevel}x
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(12, z - 1))}
              disabled={zoomLevel <= 12}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Target Indicator */}
        <div
          onClick={handleMapOverlayClick}
          className={`absolute inset-0 z-5 flex items-center justify-center ${
            isEditMode || manualPinMode ? 'cursor-crosshair' : 'pointer-events-none'
          }`}
          title={isEditMode ? 'Click anywhere on map to reposition pin' : undefined}
        >
          <div className="flex flex-col items-center pointer-events-none -mt-7">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#ea110d] text-white flex items-center justify-center shadow-2xl animate-bounce border-2 border-white">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="w-3 h-1.5 bg-black/40 rounded-full blur-[1px] mx-auto mt-0.5" />
            </div>
            <div className="mt-1 px-3 py-1 rounded-full bg-slate-900/90 text-white text-[11px] font-bold font-poppins shadow-xl backdrop-blur-md whitespace-nowrap border border-white/20">
              {propertyName}
            </div>
          </div>
        </div>

        {/* Bottom Banner Over Map */}
        <div className="relative z-10 m-3 flex items-center justify-between pointer-events-none">
          <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono pointer-events-auto">
            GPS: {lat.toFixed(6)}° N, {lng.toFixed(6)}° E
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {isEditMode && (
              <button
                type="button"
                onClick={() => setManualPinMode(!manualPinMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-poppins shadow-md backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer ${
                  manualPinMode
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/95 text-slate-800 hover:bg-white'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-[#ea110d]" />
                <span>{manualPinMode ? 'Click Map Enabled' : 'Click Map to Mark'}</span>
              </button>
            )}

            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 text-xs font-bold font-poppins shadow-md backdrop-blur-md transition flex items-center gap-1"
            >
              <span>OSM Fullscreen</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* ─── Nearby Attractions List (Editable in Edit Mode) ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-poppins">
            Nearby Landmarks &amp; Attractions ({nearbyAttractions.length || 3})
          </h4>
          {isEditMode && (
            <button
              type="button"
              onClick={handleAddAttraction}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#ea110d] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Attraction</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(nearbyAttractions.length > 0
            ? nearbyAttractions
            : [
                {
                  name: 'Table Land Plateau',
                  distance: '2.4 km • 7 mins drive',
                  desc: "Asia's 2nd largest volcanic plateau overlooking valleys",
                },
                {
                  name: 'Venna Lake & Boating',
                  distance: '4.8 km • 12 mins drive',
                  desc: 'Serene boating with horse rides and fresh strawberry stalls',
                },
                {
                  name: 'Mapro Garden & Cafe',
                  distance: '6.5 km • 15 mins drive',
                  desc: 'Famous fresh strawberry cream, pizza & syrup tasting',
                },
              ]
          ).map((att, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between relative group"
            >
              {isEditMode ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={att.name}
                      onChange={(e) => handleUpdateAttraction(idx, 'name', e.target.value)}
                      placeholder="Attraction Name"
                      className="text-xs font-bold text-slate-900 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttraction(idx)}
                      className="text-slate-400 hover:text-[#ea110d] p-1 ml-1"
                      title="Delete attraction"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={att.distance}
                    onChange={(e) => handleUpdateAttraction(idx, 'distance', e.target.value)}
                    placeholder="Distance / Drive time"
                    className="text-[11px] font-semibold text-[#ea110d] border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={att.desc || ''}
                    onChange={(e) => handleUpdateAttraction(idx, 'desc', e.target.value)}
                    placeholder="Brief description"
                    className="text-[11px] text-slate-500 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-xs font-bold text-slate-900 font-poppins">{att.name}</div>
                    <div className="text-[11px] font-semibold text-[#ea110d] mt-0.5">{att.distance}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{att.desc}</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

