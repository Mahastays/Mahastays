'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Plus,
  ExternalLink,
  Star,
  CheckCircle2,
  XCircle,
  MapPin,
  Compass,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  Sparkles,
  Clock,
  Tag,
  Mountain,
  Waves,
  Landmark,
  Flower2,
  Layers,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/upload';
import { Place } from '../views/PlacesView';
import { toast } from '@/components/ui/Toast';

interface PlaceDetailEditViewProps {
  id: string;
}

const CATEGORIES = [
  { value: 'viewpoint', label: 'Viewpoints & Summits', icon: Mountain },
  { value: 'waterfall', label: 'Waterfalls', icon: Waves },
  { value: 'lake', label: 'Lakes & Waters', icon: Waves },
  { value: 'fort', label: 'Historic Forts', icon: Landmark },
  { value: 'temple', label: 'Sacred Temples', icon: Landmark },
  { value: 'garden', label: 'Gardens & Agro', icon: Flower2 },
  { value: 'plateau', label: 'Plateaus & Tablelands', icon: Layers },
];

const PRESETS = [
  { name: "Arthur's Seat (Queen of Points)", lat: 17.9866, lng: 73.6128, alt: '1,470 m (4,822 ft)', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Venna Lake & Boating Pier', lat: 17.9256, lng: 73.6625, alt: '1,350 m (4,429 ft)', area: 'Mahabaleshwar', cat: 'lake' },
  { name: 'Pratapgad Fort (The Bastion of Shivaji Maharaj)', lat: 17.9239, lng: 73.5786, alt: '1,080 m (3,543 ft)', area: 'Mahabaleshwar', cat: 'fort' },
  { name: 'Lingmala Waterfall Ridge', lat: 17.9288, lng: 73.6821, alt: '1,278 m (4,192 ft)', area: 'Mahabaleshwar', cat: 'waterfall' },
  { name: "Elephant's Head & Kate's Point", lat: 17.9312, lng: 73.7024, alt: '1,290 m (4,232 ft)', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Mapro Garden & Strawberry Village', lat: 17.9211, lng: 73.7431, alt: '1,200 m (3,937 ft)', area: 'Panchgani', cat: 'garden' },
  { name: 'Wilson Point (Sunrise Peak)', lat: 17.9198, lng: 73.6635, alt: '1,439 m (4,721 ft)', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Old Mahabaleshwar & Panchganga Temple', lat: 17.9582, lng: 73.6599, alt: '1,372 m (4,501 ft)', area: 'Mahabaleshwar', cat: 'temple' },
  { name: 'Table Land Plateau (Panchgani)', lat: 17.9262, lng: 73.8055, alt: '1,387 m (4,550 ft)', area: 'Panchgani', cat: 'plateau' },
  { name: 'Sydney Point (Krishna Valley View)', lat: 17.9338, lng: 73.8037, alt: '1,250 m (4,101 ft)', area: 'Panchgani', cat: 'viewpoint' },
  { name: 'Lodwick Point & Elephant Head', lat: 17.9289, lng: 73.6358, alt: '1,240 m (4,068 ft)', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Elphinstone Point View', lat: 17.9625, lng: 73.6184, alt: '1,400 m (4,593 ft)', area: 'Mahabaleshwar', cat: 'viewpoint' },
  { name: 'Tapola (Mini Kashmir Waters)', lat: 17.7812, lng: 73.7124, alt: '850 m (2,788 ft)', area: 'Tapola', cat: 'lake' },
];

export default function PlaceDetailEditView({ id }: PlaceDetailEditViewProps) {
  const router = useRouter();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('viewpoint');
  const [vicinity, setVicinity] = useState('Mahabaleshwar');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(17.9242);
  const [longitude, setLongitude] = useState(73.6738);
  const [altitude, setAltitude] = useState('1,350 m (4,429 ft)');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [timings, setTimings] = useState('6:00 AM – 6:30 PM (Daily)');
  const [entryFee, setEntryFee] = useState('Free Entry');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('October to May');
  const [isFeatured, setIsFeatured] = useState(false);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Images state
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);

  // Highlights and Tips
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [newTip, setNewTip] = useState('');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Fetch place if editing
  useEffect(() => {
    if (isNew) return;

    const loadPlace = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/admin/places/${id}`);
        const p: Place = res.data?.data || res.data;
        if (p) {
          setName(p.name || '');
          setSlug(p.slug || '');
          setCategory(p.category || 'viewpoint');
          setVicinity(p.vicinity || 'Mahabaleshwar');
          setAddress(p.address || '');
          setLatitude(typeof p.latitude === 'number' ? p.latitude : 17.9242);
          setLongitude(typeof p.longitude === 'number' ? p.longitude : 73.6738);
          setAltitude(p.altitude || '1,350 m (4,429 ft)');
          setShortDescription(p.shortDescription || '');
          setDescription(p.description || '');
          setTimings(p.timings || '');
          setEntryFee(p.entryFee || '');
          setBestTimeToVisit(p.bestTimeToVisit || '');
          setIsFeatured(!!p.isFeatured);
          setOrder(typeof p.order === 'number' ? p.order : 0);
          setIsActive(p.isActive !== false);

          const imgs = Array.isArray(p.images) ? p.images : [];
          setGalleryImages(imgs);
          setCoverImage(p.coverImage || imgs[0] || '');

          setHighlights(Array.isArray(p.highlights) ? p.highlights : []);
          setTips(Array.isArray(p.tips) ? p.tips : []);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load place details.');
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, [id, isNew]);

  // Handle Preset Selection
  const handleSelectPreset = (presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setName(preset.name);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setAltitude(preset.alt);
    setVicinity(preset.area);
    setCategory(preset.cat);
    if (!slug) {
      setSlug(
        preset.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  // Upload Cover Image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) {
        setCoverImage(res.url);
        // Also prepend to gallery if not present
        setGalleryImages((prev) => (prev.includes(res.url) ? prev : [res.url, ...prev]));
        toast.success('Cover image uploaded successfully', 'Cover Updated');
      }
    } catch (err: any) {
      toast.error(`Cover image upload failed: ${err.message || 'Please try again'}`, 'Upload Failed');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // Upload Multiple Gallery Images
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingGallery(true);
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadImageToCloudinary(file, 'listing_media');
        if (res?.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setGalleryImages((prev) => [...prev, ...uploadedUrls]);
        if (!coverImage) {
          setCoverImage(uploadedUrls[0]);
        }
        toast.success(`Uploaded ${uploadedUrls.length} image(s)`, 'Gallery Updated');
      }
    } catch (err: any) {
      toast.error(`Gallery upload failed: ${err.message || 'Please try again'}`, 'Upload Failed');
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Add photo from URL
  const handleAddImageUrl = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      toast.warning('Please enter a valid image URL starting with http:// or https://', 'Invalid URL');
      return;
    }
    setGalleryImages((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    if (!coverImage) setCoverImage(trimmed);
    setCustomImageUrl('');
    setShowAddUrlInput(false);
  };

  // Remove photo
  const handleRemoveImage = (imgUrl: string) => {
    setGalleryImages((prev) => prev.filter((img) => img !== imgUrl));
    if (coverImage === imgUrl) {
      const remaining = galleryImages.filter((img) => img !== imgUrl);
      setCoverImage(remaining[0] || '');
    }
  };

  // Set as Cover
  const handleSetCover = (imgUrl: string) => {
    setCoverImage(imgUrl);
  };

  // Add Highlight
  const handleAddHighlight = () => {
    const h = newHighlight.trim();
    if (!h) return;
    setHighlights((prev) => [...prev, h]);
    setNewHighlight('');
  };

  // Remove Highlight
  const handleRemoveHighlight = (idx: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Tip
  const handleAddTip = () => {
    const t = newTip.trim();
    if (!t) return;
    setTips((prev) => [...prev, t]);
    setNewTip('');
  };

  // Remove Tip
  const handleRemoveTip = (idx: number) => {
    setTips((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save place
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a place name', 'Validation Error');
      return;
    }

    setSaving(true);
    setError(null);

    const imagesToSave = galleryImages.filter((url) => typeof url === 'string' && url.trim().length > 0);
    const finalCover = coverImage.trim() || imagesToSave[0] || undefined;

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      category,
      vicinity: vicinity.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      address: address.trim() || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      altitude: altitude.trim() || undefined,
      coverImage: finalCover,
      images: imagesToSave.length > 0 ? imagesToSave : undefined,
      timings: timings.trim() || undefined,
      entryFee: entryFee.trim() || undefined,
      bestTimeToVisit: bestTimeToVisit.trim() || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      tips: tips.length > 0 ? tips : undefined,
      isFeatured,
      order: Number(order) || 0,
      isActive,
    };

    try {
      if (isNew) {
        const res = await api.post('/admin/places', payload);
        const createdId = res.data?.data?.id || res.data?.id;
        toast.success('Place created successfully', 'Place Saved');
        setSuccessToast(true);
        setTimeout(() => {
          if (createdId) {
            router.push(`/dashboard/places/${createdId}`);
          } else {
            router.push('/dashboard/places');
          }
        }, 1000);
      } else {
        await api.put(`/admin/places/${id}`, payload);
        toast.success('Place details updated successfully', 'Place Saved');
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 3000);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to save place changes.';
      setError(errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading place details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-200">
      {/* Hidden File Inputs */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGalleryUpload}
      />

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/places"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
              title="Back to Places & Landmarks"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-poppins truncate max-w-[280px] sm:max-w-md">
                  {isNew ? 'Create New Place' : name || 'Edit Landmark Place'}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {isActive ? 'Active' : 'Draft'}
                </span>
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>Featured</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Explore Directory</span>
                <span>/</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {slug ? `/explore/${slug}` : 'Generating slug...'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isNew && slug && (
              <a
                href={`http://localhost:3000/explore/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                title="Preview public visitor page"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Preview</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                isFeatured
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-600'
              }`}
              title={isFeatured ? 'Place is Featured on map & cards' : 'Feature place on map'}
            >
              <Star className={`w-4 h-4 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs sm:text-sm font-poppins shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isNew ? 'Create Place' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 font-semibold">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1 font-bold">
              {isNew ? 'Landmark place created successfully!' : 'Landmark place updated successfully!'}
            </div>
            <button onClick={() => setSuccessToast(false)} className="text-emerald-500 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Main Information & Media Upload (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* CARD 1: Core Identity & Preset Quick Fill */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white font-poppins">
                      Landmark Identity &amp; Classification
                    </h2>
                    <p className="text-[11px] text-slate-400">Title, slug URL, and tourism category.</p>
                  </div>
                </div>

                {/* Preset Selector */}
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectPreset(e.target.value);
                    }}
                    defaultValue=""
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                  >
                    <option value="" disabled>
                      ⚡ Quick-Fill Iconic Presets...
                    </option>
                    {PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Place Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Venna Lake & Boating Pier"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/[\s_-]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                        );
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Slug (URL Key) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. venna-lake"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-400">Visitor URL: /explore/{slug || '...'}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:border-rose-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CARD 2: Image Media & Upload Manager (User's Core Request) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white font-poppins">
                      Visual Media &amp; Image Uploader
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Upload scenic viewpoint photos, banner visuals, and landmark galleries.
                    </p>
                  </div>
                </div>

                {/* Direct Upload Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
                  >
                    {isUploadingGallery ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>+ Upload Photos</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddUrlInput(!showAddUrlInput)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {showAddUrlInput ? 'Cancel URL' : 'Add via URL'}
                  </button>
                </div>
              </div>

              {/* Add Via URL Bar (Collapsible) */}
              {showAddUrlInput && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Paste direct image URL (https://...)"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Primary Cover Image Banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Cover Photo (Primary Banner)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      • Displayed on cards &amp; map preview
                    </span>
                  </label>
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      {isUploadingCover ? 'Uploading...' : 'Replace Cover'}
                    </button>
                  )}
                </div>

                {coverImage ? (
                  <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700 group shadow-inner bg-slate-100">
                    <img
                      src={coverImage}
                      alt={name || 'Place Cover'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4 justify-between">
                      <div className="text-white">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
                          Active Cover Photo
                        </span>
                        <div className="text-xs font-semibold drop-shadow-sm font-mono truncate max-w-md opacity-90">
                          {coverImage}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={isUploadingCover}
                          className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverImage('')}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition cursor-pointer"
                          title="Remove cover image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="h-44 sm:h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 group-hover:text-rose-500 group-hover:scale-110 shadow-xs flex items-center justify-center mb-2 transition">
                      {isUploadingCover ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600">
                      {isUploadingCover ? 'Uploading cover photo...' : 'Click to Upload Landmark Cover Photo'}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP up to 15MB • Direct device file upload
                    </p>
                  </div>
                )}
              </div>

              {/* Gallery Images Grid */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Photo Gallery ({galleryImages.length} Photos)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Upload multiple scenic viewpoints, lake shores, sunset vistas &amp; tourist snapshots.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload More</span>
                  </button>
                </div>

                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {galleryImages.map((imgUrl, idx) => {
                      const isCover = coverImage === imgUrl;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden aspect-4/3 bg-slate-100 border transition group ${
                            isCover
                              ? 'ring-2 ring-rose-500 border-rose-500 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Cover badge */}
                          {isCover && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                              Cover
                            </span>
                          )}

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(imgUrl)}
                                className="w-full py-1 rounded bg-white text-slate-900 text-[10px] font-bold hover:bg-rose-50 hover:text-rose-600 transition shadow-xs cursor-pointer"
                              >
                                Set as Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgUrl)}
                              className="w-full py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Upload Next Tile */}
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition aspect-4/3 group"
                    >
                      <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 mb-1 transition" />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">
                        + Add Photos
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center cursor-pointer hover:bg-slate-50 transition"
                  >
                    <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No gallery images added yet.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click here to upload photos from your computer or phone.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: Short Description & Detailed Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white font-poppins">
                    Descriptions &amp; Detailed Overview
                  </h2>
                  <p className="text-[11px] text-slate-400">Card snippets and historical narrative.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Short Description (Card snippet) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. The glittering centerpiece of Mahabaleshwar surrounded by towering pine trees..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400">
                  Displays on directory listing cards and hover popups.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Detailed Overview &amp; History <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Constructed in 1842 by Shri Appasaheb Maharaj, the ruler of Satara..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            {/* CARD 4: Highlights & Visitor Tips */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white font-poppins">
                    Key Highlights &amp; Visitor Tips
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Bullet points highlighted on the landmark detail page.
                  </p>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Key Highlights</label>
                <div className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{h}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(i)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. Scenic pedal & row boating in serene mountain waters"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddHighlight();
                        }
                      }}
                      className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Visitor Tips (Guides &amp; Recommendations)
                </label>
                <div className="space-y-1.5">
                  {tips.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTip(i)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. Row boats can be hired with a professional oarsman"
                      value={newTip}
                      onChange={(e) => setNewTip(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTip();
                        }
                      }}
                      className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddTip}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Coordinates, Timings & Status (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Coordinates & Location */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-poppins">
                    Location &amp; Coordinates
                  </h3>
                  <p className="text-[11px] text-slate-400">Precise map pins for routing &amp; distance.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Vicinity / Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar"
                  value={vicinity}
                  onChange={(e) => setVicinity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Latitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Longitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Altitude</label>
                <input
                  type="text"
                  placeholder="e.g. 1,350 m (4,429 ft)"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Address</label>
                <input
                  type="text"
                  placeholder="e.g. Panchgani - Mahabaleshwar Rd, Mahabaleshwar"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            {/* Timings, Entry & Best Season */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-poppins">
                    Visitor Information
                  </h3>
                  <p className="text-[11px] text-slate-400">Operating hours, entry passes &amp; season.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening Hours</label>
                <input
                  type="text"
                  placeholder="e.g. 7:00 AM – 7:30 PM (Daily)"
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Entry Fee</label>
                <input
                  type="text"
                  placeholder="e.g. Free (Row boat: ₹350/30min)"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Best Time to Visit</label>
                <input
                  type="text"
                  placeholder="e.g. All year round (Sunset boating is magical)"
                  value={bestTimeToVisit}
                  onChange={(e) => setBestTimeToVisit(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            {/* Visibility & Status Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-poppins">
                    Visibility &amp; Ordering
                  </h3>
                  <p className="text-[11px] text-slate-400">Publishing switches and sort rank.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Featured on Map &amp; Hero Carousel
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prominently spotlighted on home page and top of map pins.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Active &amp; Visible to Public
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Uncheck to temporarily save as draft or unpublish.
                  </div>
                </div>
              </label>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Display Order</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400">Lower numbers appear first.</span>
              </div>

              {/* Bottom Save CTA inside panel */}
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="w-full py-3 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs sm:text-sm font-poppins shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isNew ? 'Create Landmark Place' : 'Save Landmark Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

