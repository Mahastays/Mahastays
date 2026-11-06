'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Star,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Compass,
  Mountain,
  Waves,
  Landmark,
  Flower2,
  Sparkles,
  Image as ImageIcon,
  Clock,
  Tag,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';

export interface Place {
  id: string;
  name: string;
  slug: string;
  category: string;
  vicinity: string;
  shortDescription: string;
  description: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  altitude?: string | null;
  images: string[];
  coverImage?: string | null;
  timings?: string | null;
  entryFee?: string | null;
  bestTimeToVisit?: string | null;
  highlights: string[];
  tips: string[];
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'viewpoint', label: 'Viewpoints & Summits' },
  { value: 'waterfall', label: 'Waterfalls' },
  { value: 'lake', label: 'Lakes & Waters' },
  { value: 'fort', label: 'Historic Forts' },
  { value: 'temple', label: 'Sacred Temples' },
  { value: 'garden', label: 'Gardens & Agro' },
  { value: 'plateau', label: 'Plateaus & Tablelands' },
];

const PRESETS = [
  { name: "Arthur's Seat (Queen of Points)", lat: 17.9866, lng: 73.6128, alt: '1,470 m', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Venna Lake Boating Pier', lat: 17.9256, lng: 73.6625, alt: '1,350 m', area: 'Mahabaleshwar', cat: 'lake' },
  { name: 'Pratapgad Fort Heritage', lat: 17.9239, lng: 73.5786, alt: '1,080 m', area: 'Mahabaleshwar', cat: 'fort' },
  { name: 'Lingmala Waterfall Ridge', lat: 17.9288, lng: 73.6821, alt: '1,278 m', area: 'Mahabaleshwar', cat: 'waterfall' },
  { name: "Elephant's Head / Kate's Point", lat: 17.9312, lng: 73.7024, alt: '1,290 m', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Mapro Garden & Pizzeria', lat: 17.9211, lng: 73.7431, alt: '1,200 m', area: 'Panchgani', cat: 'garden' },
  { name: 'Wilson Point (Sunrise Point)', lat: 17.9198, lng: 73.6635, alt: '1,439 m', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Panchganga Temple (Old Mahabaleshwar)', lat: 17.9582, lng: 73.6599, alt: '1,372 m', area: 'Mahabaleshwar', cat: 'temple' },
  { name: 'Table Land Plateau (Panchgani)', lat: 17.9262, lng: 73.8055, alt: '1,387 m', area: 'Panchgani', cat: 'plateau' },
  { name: 'Sydney Point (Krishna Valley)', lat: 17.9338, lng: 73.8037, alt: '1,250 m', area: 'Panchgani', cat: 'viewpoint' },
  { name: 'Lodwick Point Obelisk', lat: 17.9289, lng: 73.6358, alt: '1,240 m', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Elphinstone Point', lat: 17.9625, lng: 73.6184, alt: '1,400 m', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Tapola (Mini Kashmir Waters)', lat: 17.7812, lng: 73.7124, alt: '850 m', area: 'Tapola', cat: 'lake' },
];

export default function PlacesView() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vicinityFilter, setVicinityFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'viewpoint',
    vicinity: 'Mahabaleshwar',
    shortDescription: '',
    description: '',
    address: '',
    latitude: 17.9242,
    longitude: 73.6738,
    altitude: '1,350 m',
    coverImage: '',
    imagesText: '',
    timings: '6:00 AM – 6:30 PM (Daily)',
    entryFee: 'Free Entry',
    bestTimeToVisit: 'October to May',
    highlightsText: '',
    tipsText: '',
    isFeatured: false,
    order: 0,
    isActive: true,
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Fetch places from backend
  const fetchPlaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/places?limit=100');
      const list = res.data?.data || [];
      setPlaces(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load places');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Handle seed / sync
  const handleSeedPlaces = async () => {
    if (!confirm('Sync default famous places? This will ensure all 12 iconic Mahabaleshwar places exist.')) return;
    setSeeding(true);
    try {
      await api.post('/admin/places/seed');
      await fetchPlaces();
    } catch (err: any) {
      alert('Failed to sync places: ' + (err?.response?.data?.message || err?.message));
    } finally {
      setSeeding(false);
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPlace(null);
    setFormError(null);
    setFormData({
      name: '',
      slug: '',
      category: 'viewpoint',
      vicinity: 'Mahabaleshwar',
      shortDescription: '',
      description: '',
      address: '',
      latitude: 17.9242,
      longitude: 73.6738,
      altitude: '1,350 m',
      coverImage: '',
      imagesText: '',
      timings: '6:00 AM – 6:30 PM (Daily)',
      entryFee: 'Free Entry',
      bestTimeToVisit: 'October to May',
      highlightsText: '',
      tipsText: '',
      isFeatured: false,
      order: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (place: Place) => {
    setEditingPlace(place);
    setFormError(null);
    setFormData({
      name: place.name,
      slug: place.slug,
      category: place.category,
      vicinity: place.vicinity,
      shortDescription: place.shortDescription,
      description: place.description,
      address: place.address || '',
      latitude: place.latitude,
      longitude: place.longitude,
      altitude: place.altitude || '',
      coverImage: place.coverImage || '',
      imagesText: (place.images || []).join('\n'),
      timings: place.timings || '',
      entryFee: place.entryFee || '',
      bestTimeToVisit: place.bestTimeToVisit || '',
      highlightsText: (place.highlights || []).join('\n'),
      tipsText: (place.tips || []).join('\n'),
      isFeatured: place.isFeatured,
      order: place.order,
      isActive: place.isActive,
    });
    setIsModalOpen(true);
  };

  // Preset selector
  const handleSelectPreset = (presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || preset.name,
      latitude: preset.lat,
      longitude: preset.lng,
      altitude: preset.alt,
      vicinity: preset.area,
      category: preset.cat,
    }));
  };

  // Save place
  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const images = formData.imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.startsWith('http'));

    const highlights = formData.highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const tips = formData.tipsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      category: formData.category,
      vicinity: formData.vicinity.trim(),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      address: formData.address.trim() || undefined,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      altitude: formData.altitude.trim() || undefined,
      coverImage: formData.coverImage.trim() || images[0] || undefined,
      images: images.length > 0 ? images : undefined,
      timings: formData.timings.trim() || undefined,
      entryFee: formData.entryFee.trim() || undefined,
      bestTimeToVisit: formData.bestTimeToVisit.trim() || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      tips: tips.length > 0 ? tips : undefined,
      isFeatured: formData.isFeatured,
      order: Number(formData.order) || 0,
      isActive: formData.isActive,
    };

    try {
      if (editingPlace) {
        await api.put(`/admin/places/${editingPlace.id}`, payload);
      } else {
        await api.post('/admin/places', payload);
      }
      setIsModalOpen(false);
      await fetchPlaces();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (id: string) => {
    try {
      await api.patch(`/admin/places/${id}/toggle-featured`);
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p))
      );
    } catch (err: any) {
      alert('Error updating featured flag');
    }
  };

  // Toggle Status
  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/admin/places/${id}/toggle-status`);
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (err: any) {
      alert('Error updating active status');
    }
  };

  // Delete Place
  const handleDeletePlace = async (id: string) => {
    try {
      await api.delete(`/admin/places/${id}`);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert('Error deleting place');
    }
  };

  // Filtered List
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.vicinity.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();

      const matchVicinity =
        vicinityFilter === 'all' || p.vicinity.toLowerCase().includes(vicinityFilter.toLowerCase());

      return matchSearch && matchCategory && matchVicinity;
    });
  }, [places, search, categoryFilter, vicinityFilter]);

  // Stats
  const totalCount = places.length;
  const viewpointsCount = places.filter((p) => p.category === 'viewpoint').length;
  const waterfallsCount = places.filter((p) => p.category === 'waterfall' || p.category === 'lake').length;
  const featuredCount = places.filter((p) => p.isFeatured).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Explore Places &amp; Landmarks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
              Interactive Map
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage famous viewpoints, waterfalls, historic forts, and attractions displayed on the public Explore page.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedPlaces}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="Ensure default 12 famous places are populated"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin text-rose-600' : ''}`} />
            <span>{seeding ? 'Syncing...' : 'Sync Presets'}</span>
          </button>

          <a
            href="http://localhost:3000/explore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Page</span>
          </a>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Place</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Places</span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</div>
          <span className="text-[11px] text-slate-400">Curated attractions</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Viewpoints</span>
            <Mountain className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{viewpointsCount}</div>
          <span className="text-[11px] text-slate-400">Valley &amp; cliff points</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Waterfalls &amp; Lakes</span>
            <Waves className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{waterfallsCount}</div>
          <span className="text-[11px] text-slate-400">Cascades &amp; boating</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Featured on Map</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{featuredCount}</div>
          <span className="text-[11px] text-slate-400">Highlight pins</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search place name, category, or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={vicinityFilter}
            onChange={(e) => setVicinityFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Areas</option>
            <option value="Mahabaleshwar">Mahabaleshwar</option>
            <option value="Panchgani">Panchgani</option>
            <option value="Tapola">Tapola</option>
          </select>

          {(search || categoryFilter !== 'all' || vicinityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setVicinityFilter('all');
              }}
              className="text-xs text-rose-600 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Places Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
            Loading famous places...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 text-sm px-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchPlaces}
              className="mt-3 text-xs underline text-slate-700 hover:text-rose-600"
            >
              Retry
            </button>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm px-4">
            <Compass className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No places matched your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or click 'Sync Presets' above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Place / Landmark</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Area &amp; Altitude</th>
                  <th className="py-3 px-3">Coordinates</th>
                  <th className="py-3 px-3">Timings / Entry</th>
                  <th className="py-3 px-3 text-center">Featured</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPlaces.map((place) => (
                  <tr
                    key={place.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Place Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                          <img
                            src={place.coverImage || place.images[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {place.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            /explore/{place.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200/60">
                        {place.category}
                      </span>
                    </td>

                    {/* Vicinity */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div>{place.vicinity}</div>
                      <div className="text-[10px] text-slate-400">{place.altitude || 'Mountain Peak'}</div>
                    </td>

                    {/* Coordinates */}
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      <div>{place.latitude.toFixed(4)}° N</div>
                      <div>{place.longitude.toFixed(4)}° E</div>
                    </td>

                    {/* Timings */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div className="truncate max-w-[130px]">{place.timings || 'Daily Daylight'}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{place.entryFee || 'Free Entry'}</div>
                    </td>

                    {/* Featured on Map */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(place.id)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          place.isFeatured
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={place.isFeatured ? 'Featured on Map & Carousel' : 'Click to feature on map'}
                      >
                        <Star className={`w-4 h-4 ${place.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </td>

                    {/* Active Status */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(place.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          place.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {place.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={`http://localhost:3000/explore/${place.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Preview public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(place)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                          title="Edit place"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(place.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition"
                          title="Delete place"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Attraction?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove this place from the Explore map? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePlace(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Place Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingPlace ? `Edit Place: ${editingPlace.name}` : 'Add New Place to Explore Map'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlace} className="mt-4 space-y-4">
              {/* Quick Preset Selector */}
              {!editingPlace && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Quick Preset (Auto-fill Coordinates &amp; Info)
                  </label>
                  <select
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-slate-700 dark:text-slate-200 outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choose a famous Western Ghats landmark to pre-fill...
                    </option>
                    {PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.area} • {p.alt})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Place Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arthur's Seat"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Slug (URL Key)
                  </label>
                  <input
                    type="text"
                    placeholder="auto-generated from name if blank"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Category & Vicinity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  >
                    <option value="viewpoint">Viewpoint &amp; Valley Lookout</option>
                    <option value="waterfall">Waterfall</option>
                    <option value="lake">Lake &amp; Waterbody</option>
                    <option value="fort">Historic Fort</option>
                    <option value="temple">Sacred Temple &amp; Heritage</option>
                    <option value="garden">Garden &amp; Strawberry Farm</option>
                    <option value="plateau">Plateau &amp; Tableland</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vicinity / Area *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahabaleshwar or Panchgani"
                    value={formData.vicinity}
                    onChange={(e) => setFormData({ ...formData, vicinity: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Coordinates & Altitude */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="17.9242"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="73.6738"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Altitude
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1,470 m"
                    value={formData.altitude}
                    onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description (Card snippet) *
                </label>
                <textarea
                  required
                  rows={2}
                  maxLength={300}
                  placeholder="One or two punchy sentences describing this attraction..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Rich Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Overview &amp; History *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="In-depth guide, historical context, mythology, viewpoints..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Timings, Fee & Best Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    placeholder="6:00 AM – 6:30 PM"
                    value={formData.timings}
                    onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Entry Fee
                  </label>
                  <input
                    type="text"
                    placeholder="Free Entry or ₹20/person"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Best Time To Visit
                  </label>
                  <input
                    type="text"
                    placeholder="October to June"
                    value={formData.bestTimeToVisit}
                    onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Photo URLs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URLs (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                  value={formData.imagesText}
                  onChange={(e) => setFormData({ ...formData, imagesText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Highlights & Tips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Highlights (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Spectacular 360° views&#10;Anti-gravity updraft&#10;Pine forest trail"
                    value={formData.highlightsText}
                    onChange={(e) => setFormData({ ...formData, highlightsText: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visitor Tips (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Wear comfortable shoes&#10;Keep food away from monkeys&#10;Visit early morning"
                    value={formData.tipsText}
                    onChange={(e) => setFormData({ ...formData, tipsText: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Featured on Map &amp; Carousel</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Active &amp; Visible to Public</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPlace ? 'Update Place' : 'Create Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

