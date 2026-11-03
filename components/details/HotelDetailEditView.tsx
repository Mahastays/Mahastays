'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Eye,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Plus,
  Trash2,
  MapPin,
  Star,
  BedDouble,
  Users,
  Sparkles,
  Wifi,
  Waves,
  Coffee,
  Car,
  ShieldCheck,
  Building,
  Check,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Video,
  Calendar,
  Tv,
  Bath,
  Utensils,
  ChevronRight,
  X,
  Share2,
  Heart,
  Award,
  UploadCloud,
  Loader2,
  Layers,
} from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/upload';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPropertyById,
  updatePropertyAsync,
  approvePropertyAsync,
  rejectPropertyAsync,
} from '@/store/slices/propertiesSlice';
import { PropertyItem, RoomItem, PropertyType } from '@/types';

interface HotelDetailEditViewProps {
  id: string;
}

const PROPERTY_TYPES: PropertyType[] = ['resort', 'villa', 'hotel', 'cottage', 'apartment'];

const ALL_POSSIBLE_AMENITIES = [
  'Heated Infinity Pool',
  'Private Chef & Butler',
  'High-Speed Wi-Fi',
  'Landscaped Lawn & BBQ',
  'Valley View Gazebo',
  'Private Balcony',
  'Smart TV',
  'Bathtub with View',
  'In-House Parking',
  'Daily Housekeeping',
  'Air Conditioning',
  'Billiards & Game Room',
  'Bonfire Facility',
  'Power Backup',
  'Pet Friendly',
  'Multi-Cuisine Restaurant',
];

export default function HotelDetailEditView({ id }: HotelDetailEditViewProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const dispatch = useAppDispatch();
  const { items, selectedProperty, saving } = useAppSelector((state) => state.properties);

  const isAdmin = activeViewMode === 'admin';

  // Find property from Redux store items or fetch
  const [property, setProperty] = useState<PropertyItem | null>(() => {
    return items.find((p) => p.id === id || p.code === id || p.slug === id) || null;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddImage, setShowAddImage] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Booking Preview calculation states
  const [checkInDate, setCheckInDate] = useState('2026-10-15');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-18');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);

  // Modal for editing room
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);

  // Frontend-matching Detail Tabs State
  const [activeDetailTab, setActiveDetailTab] = useState<string>('rooms');
  const tabsScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(true);

  const checkTabScroll = () => {
    if (!tabsScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
    setCanScrollTabsLeft(scrollLeft > 10);
    setCanScrollTabsRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsScrollRef.current) return;
    tabsScrollRef.current.scrollBy({
      left: direction === 'left' ? -200 : 200,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (id && typeof fetchPropertyById === 'function') {
      dispatch(fetchPropertyById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    const found = items.find((p) => p.id === id || p.code === id || p.slug === id);
    if (found) {
      setProperty(found);
    } else if (
      selectedProperty &&
      (selectedProperty.id === id || selectedProperty.code === id || selectedProperty.slug === id)
    ) {
      setProperty(selectedProperty);
    }
  }, [items, selectedProperty, id]);

  if (!property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading stay details...</p>
        <Link
          href="/dashboard/hotels"
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Properties Catalog
        </Link>
      </div>
    );
  }

  const isOwnerVendor = !isAdmin && (user?.vendorId === property.vendorId || user?.id === property.vendorId);

  if (!isAdmin && !isOwnerVendor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md text-center">
          You only have permission to view and edit properties assigned to your vendor account ({user?.businessName || user?.name}).
        </p>
        <Link
          href="/dashboard/hotels"
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Properties
        </Link>
      </div>
    );
  }

  const isApproved = property.status === 'active';
  const isPending = property.status === 'pending_approval';
  const isRejected = property.status === 'rejected';

  // Photos
  const allPhotos = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'];

  const rooms = property.rooms && property.rooms.length > 0
    ? property.rooms
    : [
        {
          roomId: 'rm_default',
          name: 'Entire 4BHK Villa (Private Infinity Pool)',
          badge: 'Exclusive Takeover',
          tagline: 'Private Deck Overlooking Cascading Waterfall',
          bedType: '4 King Beds',
          roomSize: 2200,
          maxGuests: 12,
          basePrice: 22000,
          originalPrice: 28000,
          count: 1,
          images: [allPhotos[0]],
          amenities: ['Private Infinity Pool', 'Billiards Room', 'Projector Room', 'BBQ Grill'],
        },
      ];

  const selectedRoom = rooms[selectedRoomIndex] || rooms[0];

  // Pricing calculations
  const nights = useMemo(() => {
    try {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 3;
    }
  }, [checkInDate, checkOutDate]);

  const roomPricePerNight = selectedRoom.basePrice || property.numericPrice || 22000;
  const originalRate = selectedRoom.originalPrice || property.originalPrice || Math.round(roomPricePerNight * 1.25);
  const savingsPerNight = Math.max(0, originalRate - roomPricePerNight);
  const subtotal = roomPricePerNight * nights;
  const memberDiscount = Math.round(subtotal * 0.08);
  const cleaningFee = 445;
  const taxesGst = Math.round((subtotal - memberDiscount + cleaningFee) * 0.18);
  const grandTotal = subtotal - memberDiscount + cleaningFee + taxesGst;

  // Handlers for state updates
  const handleFieldChange = (field: keyof PropertyItem, value: any) => {
    setProperty((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleHostChange = (field: string, value: any) => {
    if (!property) return;
    setProperty({
      ...property,
      host: {
        name: property.host?.name || 'Kunal & Caretaker Ramesh',
        role: property.host?.role || 'Property Owner & Manager',
        experience: property.host?.experience || 'Host since 2019',
        staysCount: property.host?.staysCount || '64+ Verified Group Stays',
        verified: property.host?.verified ?? true,
        avatar: property.host?.avatar || '',
        [field]: value,
      },
    });
  };

  const handleKeyAmenityChange = (index: number, field: 'name' | 'desc', val: string) => {
    if (!property) return;
    const current = property.keyAmenities ? [...property.keyAmenities] : [
      { name: 'Infinity Pool Deck', desc: 'Heated pool with valley view' },
      { name: 'Private Chef', desc: 'On-demand dining' },
      { name: 'Butler Service', desc: 'Personalised assistance' },
      { name: 'High-Speed Wi-Fi', desc: 'Stay connected' },
    ];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      setProperty({ ...property, keyAmenities: current });
    }
  };

  const handlePolicyChange = (field: string, val: any) => {
    if (!property) return;
    setProperty({
      ...property,
      policies: {
        ...(property.policies || {}),
        [field]: val,
      },
    });
  };

  const handleToggleAmenity = (amenityName: string) => {
    if (!property) return;
    const exists = property.amenities.includes(amenityName);
    const updated = exists
      ? property.amenities.filter((a) => a !== amenityName)
      : [...property.amenities, amenityName];
    setProperty({ ...property, amenities: updated });
  };

  const handleAddHighlight = () => {
    if (!property) return;
    const title = prompt('Enter new highlight:');
    if (!title || !title.trim()) return;
    const current = property.highlights ? [...property.highlights] : [];
    setProperty({
      ...property,
      highlights: [...current, { title: title.trim(), desc: '' }],
    });
  };

  const handleRemoveHighlight = (idx: number) => {
    if (!property || !property.highlights) return;
    const current = property.highlights.filter((_, i) => i !== idx);
    setProperty({ ...property, highlights: current });
  };

  const handleAddRoom = () => {
    if (!property) return;
    const newRoom: RoomItem = {
      roomId: `rm_${Date.now()}`,
      name: 'Executive Deluxe Suite',
      badge: 'Popular Choice',
      tagline: 'Private Balcony with Panoramic View',
      bedType: 'King Bed',
      roomSize: 450,
      maxGuests: 2,
      basePrice: 8500,
      originalPrice: 11000,
      count: 2,
      images: [allPhotos[0]],
      amenities: ['Private Balcony', 'Smart TV', 'High-Speed Wi-Fi'],
    };
    setProperty({
      ...property,
      rooms: [...rooms, newRoom],
    });
    setSelectedRoomIndex(rooms.length);
  };

  const handleUpdateRoom = (index: number, field: keyof RoomItem, val: any) => {
    if (!property) return;
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: val };
    setProperty({ ...property, rooms: updated });
  };

  const handleRemoveRoom = (index: number) => {
    if (!property || rooms.length <= 1) {
      alert('A property must have at least one room category.');
      return;
    }
    const updated = rooms.filter((_, i) => i !== index);
    setProperty({ ...property, rooms: updated });
    if (selectedRoomIndex >= updated.length) {
      setSelectedRoomIndex(0);
    }
  };

  // Delete confirmation popup modal state
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    title: string;
    itemName?: string;
    message?: React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
  });

  const requestDeleteRoom = (index: number) => {
    if (!property || rooms.length <= 1) {
      alert('A property must have at least one room category.');
      return;
    }
    const rm = rooms[index];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Room Category?',
      itemName: rm.name,
      message: (
        <p>
          Are you sure you want to permanently delete room category{' '}
          <strong className="text-slate-800 dark:text-slate-200">{rm.name}</strong>?
          Guests will no longer be able to select or book this accommodation unit.
        </p>
      ),
      onConfirm: () => {
        handleRemoveRoom(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteImage = (indexToRemove: number) => {
    if (!property || allPhotos.length <= 1) {
      alert('A property must have at least one showcase photo.');
      return;
    }
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Property Photo?',
      message: (
        <p>
          Are you sure you want to remove photo #{indexToRemove + 1} from this property showcase?
        </p>
      ),
      onConfirm: () => {
        handleRemoveImage(indexToRemove);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteHighlight = (idx: number) => {
    if (!property?.highlights) return;
    const hl = property.highlights[idx];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Highlight?',
      itemName: hl.title,
      onConfirm: () => {
        handleRemoveHighlight(idx);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim() || !property) return;
    setProperty({
      ...property,
      images: [...allPhotos, newImageUrl.trim()],
    });
    setNewImageUrl('');
    setShowAddImage(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !property) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) {
        setProperty({
          ...property,
          images: [...allPhotos, res.url],
        });
        setUploadSuccessToast(`Uploaded & converted to WebP (${Math.round((res.bytes || 0) / 1024)} KB)`);
        setTimeout(() => setUploadSuccessToast(null), 4000);
      }
    } catch (err: any) {
      alert(`Image upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (!property || allPhotos.length <= 1) return;
    const updated = allPhotos.filter((_, i) => i !== indexToRemove);
    setProperty({ ...property, images: updated });
    if (activePhotoIndex >= updated.length) {
      setActivePhotoIndex(0);
    }
  };

  const handleSaveChanges = async () => {
    if (!property) return;
    await dispatch(updatePropertyAsync(property));
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3500);
    setIsEditMode(false);
  };

  const handleApprove = async () => {
    if (!property) return;
    await dispatch(approvePropertyAsync({ id: property.id, adminId: user?.id }));
    setProperty({ ...property, status: 'active' });
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for rejecting this property listing:');
    if (reason && property) {
      await dispatch(rejectPropertyAsync({ id: property.id, reason }));
      setProperty({ ...property, status: 'rejected', rejectionReason: reason });
    }
  };

  const guestStayUrl = `http://localhost:3000/stay/${property.id || property.code || property.slug}`;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {saveSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Listing data successfully saved to backend database!</span>
        </div>
      )}

      {/* ─── Top Admin / Vendor Control Bar ─── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/hotels"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isPending
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {isApproved ? 'Active Listing' : isPending ? 'Pending Moderation' : 'Rejected'}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <Building className="w-3 h-3 text-slate-400" />
              <span>{property.vendorName || 'Partner Host'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={guestStayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            title="Open Customer Front-end Page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Frontend UI ↗</span>
          </a>

          {/* Toggle between Customer View and Live Edit Mode */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isEditMode
                ? 'bg-slate-900 text-white hover:bg-slate-800 ring-2 ring-slate-900/20'
                : 'bg-rose-50 text-[#ea110d] hover:bg-rose-100 border border-rose-200'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Exit Edit Mode</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Live Edit Mode</span>
              </>
            )}
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save to Backend</span>
          </button>

          {/* Admin Moderation Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              {!isApproved && (
                <button
                  type="button"
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Approve</span>
                </button>
              )}
              {!isRejected && (
                <button
                  type="button"
                  onClick={handleReject}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Reject</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Mode Alert Banner */}
      {isEditMode && (
        <div className="bg-amber-500/10 border border-amber-300/80 rounded-2xl p-4 flex items-center justify-between text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Live Edit Mode is Active: </span>
              <span>
                You can directly edit the property title, pricing, host profile, room options, about resort text,
                highlights, house rules, and amenities. Click &quot;Save to Backend&quot; when done.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 ml-4 cursor-pointer"
          >
            Save All Changes
          </button>
        </div>
      )}

      {/* ─── Breadcrumb & Save Action Bar ─── */}
      <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/dashboard/hotels" className="hover:text-slate-900">
            Stays Catalog
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{property.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(guestStayUrl);
                alert('Copied guest URL to clipboard!');
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
          >
            <Share2 className="w-3 h-3 text-slate-500" />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={() => setIsWishlist(!isWishlist)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              isWishlist
                ? 'border-red-200 bg-red-50 text-[#ea110d]'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Heart className={`w-3 h-3 ${isWishlist ? 'fill-current' : ''}`} />
            <span>{isWishlist ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* ─── Header: Title, Rating & Location ─── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            {isEditMode ? (
              <div className="space-y-3 mb-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={property.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full text-xl sm:text-2xl font-extrabold text-slate-900 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Property Tagline
                    </label>
                    <input
                      type="text"
                      value={property.tagline || ''}
                      onChange={(e) => handleFieldChange('tagline', e.target.value)}
                      placeholder="e.g. Exclusive 4BHK Standalone Sanctuary"
                      className="w-full text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Property Type
                    </label>
                    <select
                      value={property.propertyType}
                      onChange={(e) => handleFieldChange('propertyType', e.target.value as PropertyType)}
                      className="w-full text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500 bg-white"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">
                  {property.name}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold font-poppins">
                  <span className="text-amber-500">★</span>
                  <span>{property.rating || 4.8}</span>
                  <span className="text-amber-700 font-normal">({property.reviewsCount || 40} reviews)</span>
                </div>
              </div>
            )}

            {isEditMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Location & Area
                  </label>
                  <input
                    type="text"
                    value={property.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={property.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 flex-wrap">
                <MapPin className="w-4 h-4 text-[#ea110d] shrink-0" />
                <span>{property.location}</span>
                <span className="text-slate-300">•</span>
                <span>{property.city}, India</span>
                <span className="text-slate-300">•</span>
                <a
                  href="#map-section"
                  className="font-semibold text-slate-900 underline hover:text-[#ea110d] transition-colors"
                >
                  Show on map →
                </a>
              </div>
            )}

            {/* Badge Chips Row - Clean Monochrome SVG Icons */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Award className="w-3.5 h-3.5 text-slate-700" />
                <span>Top Rated {property.propertyType || 'Villa'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Building className="w-3.5 h-3.5 text-slate-700" />
                <span>{property.propertyType?.toUpperCase() || 'VILLA'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                <span>Valley View</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Waves className="w-3.5 h-3.5 text-slate-700" />
                <span>Private Pool</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Utensils className="w-3.5 h-3.5 text-slate-700" />
                <span>Chef on Demand</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5-Photo Mosaic Gallery ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Property Photo Showcase ({allPhotos.length} Images)
            </span>
            {uploadSuccessToast && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-fadeIn">
                <Check className="w-3 h-3" />
                {uploadSuccessToast}
              </span>
            )}
          </div>
          {isEditMode && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-[#ea110d] hover:bg-rose-100 border border-rose-200 text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compressing &amp; Converting to WebP...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload WebP Photo</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddImage(!showAddImage)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Paste URL</span>
              </button>
            </div>
          )}
        </div>

        {showAddImage && isEditMode && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2 mb-3">
            <input
              type="url"
              placeholder="Paste image URL (https://...)"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-rose-500"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-auto sm:h-[420px] lg:h-[460px]">
          {/* Main Large Left Hero */}
          <div className="lg:col-span-7 relative rounded-[24px] overflow-hidden bg-slate-100 group h-[280px] sm:h-[420px] lg:h-full border border-slate-100 shadow-xs">
            <Image
              src={allPhotos[activePhotoIndex] || allPhotos[0]}
              alt={property.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

            {/* Prev / Next Arrows */}
            <button
              type="button"
              onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer z-10 text-sm font-bold"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer z-10 text-sm font-bold"
              aria-label="Next photo"
            >
              ›
            </button>

            {/* Badges on Hero */}
            <div className="absolute bottom-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>Featured Cover</span>
              </span>
            </div>
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                <span>
                  {activePhotoIndex + 1} / {allPhotos.length}
                </span>
              </span>
              {isEditMode && allPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => requestDeleteImage(activePhotoIndex)}
                  className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-sm"
                  title="Delete current image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right 2x2 Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 h-[220px] sm:h-[420px] lg:h-full">
            {allPhotos.slice(1, 5).map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => setActivePhotoIndex(idx + 1)}
                className="relative rounded-[20px] overflow-hidden bg-slate-100 group cursor-pointer border border-slate-100 shadow-2xs"
              >
                <Image
                  src={photoUrl}
                  alt={`${property.name} thumbnail ${idx + 2}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                {isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDeleteImage(idx + 1);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-700 z-10 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Two-Column Layout: Left Content & Right Sticky Price Ledger ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: Host Card, 4 Highlights, Available Rooms         */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* ─── Host Card (Exact Screenshot 1) ─── */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#0B0A06] text-white font-extrabold text-lg flex items-center justify-center font-poppins shrink-0 shadow-sm">
                {property.host?.name ? property.host.name[0] : 'K'}
              </div>
              <div className="flex-1 min-w-0">
                {isEditMode ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Host Name:</span>
                      <input
                        type="text"
                        value={property.host?.name || ''}
                        onChange={(e) => handleHostChange('name', e.target.value)}
                        className="text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-rose-500 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Role & Exp:</span>
                      <input
                        type="text"
                        value={property.host?.role || ''}
                        onChange={(e) => handleHostChange('role', e.target.value)}
                        placeholder="Property Owner & Manager"
                        className="text-[11px] text-slate-600 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-rose-500 flex-1"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                      <span>Hosted by {property.host?.name || 'Kunal & Caretaker Ramesh'}</span>
                      <span
                        className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                        title="Verified Host"
                      >
                        ✓
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                      {property.host?.role || 'Property Owner & Manager'} •{' '}
                      {property.host?.experience || 'Host since 2019'} •{' '}
                      {property.host?.staysCount || '64+ Verified Group Stays'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/80 text-[#ea110d] text-xs font-semibold self-start sm:self-auto font-poppins shadow-2xs">
              <span className="text-[#ea110d] font-bold">✓</span>
              <span>Instant Booking Confirmed</span>
            </div>
          </div>

          {/* ─── Quick 4-Column Highlights Strip (Exact Screenshot 1) ─── */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Pill 1 */}
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Waves className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[0]?.name || 'Infinity Pool Deck'}
                    onChange={(e) => handleKeyAmenityChange(0, 'name', e.target.value)}
                    className="text-xs font-bold text-slate-900 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate">
                    {property.keyAmenities?.[0]?.name || 'Infinity Pool Deck'}
                  </div>
                )}
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[0]?.desc || 'Heated pool with valley view'}
                    onChange={(e) => handleKeyAmenityChange(0, 'desc', e.target.value)}
                    className="text-[10px] text-slate-500 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-[10px] text-slate-500 truncate">
                    {property.keyAmenities?.[0]?.desc || 'Heated pool with valley view'}
                  </div>
                )}
              </div>
            </div>

            {/* Pill 2 */}
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Utensils className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[1]?.name || 'Private Chef'}
                    onChange={(e) => handleKeyAmenityChange(1, 'name', e.target.value)}
                    className="text-xs font-bold text-slate-900 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate">
                    {property.keyAmenities?.[1]?.name || 'Private Chef'}
                  </div>
                )}
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[1]?.desc || 'On-demand dining'}
                    onChange={(e) => handleKeyAmenityChange(1, 'desc', e.target.value)}
                    className="text-[10px] text-slate-500 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-[10px] text-slate-500 truncate">
                    {property.keyAmenities?.[1]?.desc || 'On-demand dining'}
                  </div>
                )}
              </div>
            </div>

            {/* Pill 3 */}
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[2]?.name || 'Butler Service'}
                    onChange={(e) => handleKeyAmenityChange(2, 'name', e.target.value)}
                    className="text-xs font-bold text-slate-900 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate">
                    {property.keyAmenities?.[2]?.name || 'Butler Service'}
                  </div>
                )}
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[2]?.desc || 'Personalised assistance'}
                    onChange={(e) => handleKeyAmenityChange(2, 'desc', e.target.value)}
                    className="text-[10px] text-slate-500 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-[10px] text-slate-500 truncate">
                    {property.keyAmenities?.[2]?.desc || 'Personalised assistance'}
                  </div>
                )}
              </div>
            </div>

            {/* Pill 4 */}
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Wifi className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[3]?.name || 'High-Speed Wi-Fi'}
                    onChange={(e) => handleKeyAmenityChange(3, 'name', e.target.value)}
                    className="text-xs font-bold text-slate-900 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate">
                    {property.keyAmenities?.[3]?.name || 'High-Speed Wi-Fi'}
                  </div>
                )}
                {isEditMode ? (
                  <input
                    type="text"
                    value={property.keyAmenities?.[3]?.desc || 'Stay connected'}
                    onChange={(e) => handleKeyAmenityChange(3, 'desc', e.target.value)}
                    className="text-[10px] text-slate-500 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-[10px] text-slate-500 truncate">
                    {property.keyAmenities?.[3]?.desc || 'Stay connected'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Sticky Navigation Tabs Bar with Left/Right Slide Buttons & White Gradient (Exact Frontend UI) ─── */}
          <div
            id="detail-tabs-bar"
            className="relative sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          >
            {/* Left Gradient & Slide Button */}
            <div
              className={`absolute left-1.5 top-1.5 bottom-1.5 z-10 flex items-center pr-8 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none rounded-l-xl transition-opacity duration-300 ${
                canScrollTabsLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                aria-label="Scroll tabs left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Scrollable Tabs Track */}
            <div
              ref={tabsScrollRef}
              onScroll={checkTabScroll}
              className="overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center gap-1 px-1"
            >
              {[
                { id: 'rooms', label: 'Rooms & Suites', icon: <BedDouble className="w-4 h-4" /> },
                { id: 'about', label: 'About & Highlights', icon: <Building className="w-4 h-4" /> },
                { id: 'facilities', label: 'Facilities', icon: <Sparkles className="w-4 h-4" /> },
                { id: 'rules', label: 'House Rules', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'location', label: 'Location & Map', icon: <MapPin className="w-4 h-4" /> },
                { id: 'reviews', label: 'Host & Reviews', icon: <Star className="w-4 h-4" /> },
                { id: 'all', label: 'All Details', icon: <Layers className="w-4 h-4" /> },
              ].map((tab) => {
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold font-poppins text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#ea110d] text-white shadow-sm shadow-red-500/20 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Gradient & Slide Button */}
            <div
              className={`absolute right-1.5 top-1.5 bottom-1.5 z-10 flex items-center pl-8 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none rounded-r-xl transition-opacity duration-300 ${
                canScrollTabsRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                aria-label="Scroll tabs right"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ─── Tab 1: Accommodation Options (Available Room & Suite Types) ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'rooms') && (
            <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                  ACCOMMODATION OPTIONS
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-poppins">
                  Available Rooms &amp; Suites
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your preferred accommodation type for live transparent price calculation
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  {rooms.length} Options Available
                </span>
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ea110d] text-white text-xs font-bold shadow-xs hover:bg-[#d00f0c] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Room Category</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert('All rooms are verified by Mahastays inspection team.')}
                    className="text-xs font-bold text-[#ea110d] hover:underline font-poppins cursor-pointer"
                  >
                    Compare Rooms →
                  </button>
                )}
              </div>
            </div>

            {/* Room Cards List */}
            <div className="flex flex-col gap-3">
              {rooms.map((room, idx) => {
                const isSelected = idx === selectedRoomIndex;
                const roomPrice = room.basePrice || 22000;
                const original = room.originalPrice || Math.round(roomPrice * 1.25);
                const savings = Math.max(0, original - roomPrice);

                return (
                  <div
                    key={room.roomId || idx}
                    onClick={() => setSelectedRoomIndex(idx)}
                    className={`relative bg-white rounded-2xl p-3.5 sm:p-4 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-2 border-[#ea110d] shadow-[0_4px_20px_rgba(234,17,13,0.08)] bg-red-50/10'
                        : 'border border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Left Room Thumbnail */}
                    <div className="relative w-full md:w-44 h-32 md:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <Image
                        src={room.images?.[0] || allPhotos[0]}
                        alt={room.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 180px"
                      />
                      {room.badge && (
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold font-poppins shadow-xs">
                          {room.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs"
                        aria-label="Save room"
                      >
                        ♥
                      </button>
                    </div>

                    {/* Middle Details */}
                    <div className="flex-1 flex flex-col gap-1 w-full min-w-0">
                      {isEditMode ? (
                        <div className="space-y-2 mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={room.name}
                              onChange={(e) => handleUpdateRoom(idx, 'name', e.target.value)}
                              placeholder="Room Name"
                              className="text-sm font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                            />
                            <input
                              type="text"
                              value={room.badge || ''}
                              onChange={(e) => handleUpdateRoom(idx, 'badge', e.target.value)}
                              placeholder="Badge (e.g. Exclusive Takeover)"
                              className="text-xs font-semibold text-rose-600 border border-slate-200 rounded-lg px-2 py-1 w-44 focus:outline-rose-500"
                            />
                          </div>
                          <input
                            type="text"
                            value={room.tagline || ''}
                            onChange={(e) => handleUpdateRoom(idx, 'tagline', e.target.value)}
                            placeholder="Subtitle (e.g. Private Deck Overlooking Cascading Waterfall)"
                            className="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                              {room.name}
                            </h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#ea110d] text-[10px] font-bold font-poppins border border-red-200">
                                Active Selection
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal line-clamp-1">
                            {room.tagline || 'Private Deck Overlooking Cascading Waterfall'}
                          </p>
                        </>
                      )}

                      {/* Specs Row */}
                      {isEditMode ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Size (sq.ft):</span>
                            <input
                              type="number"
                              value={room.roomSize || 2200}
                              onChange={(e) => handleUpdateRoom(idx, 'roomSize', Number(e.target.value))}
                              className="border border-slate-200 rounded-md px-1.5 py-0.5 w-full text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Bed Type:</span>
                            <input
                              type="text"
                              value={room.bedType || '4 King Beds'}
                              onChange={(e) => handleUpdateRoom(idx, 'bedType', e.target.value)}
                              className="border border-slate-200 rounded-md px-1.5 py-0.5 w-full text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Max Guests:</span>
                            <input
                              type="number"
                              value={room.maxGuests || 12}
                              onChange={(e) => handleUpdateRoom(idx, 'maxGuests', Number(e.target.value))}
                              className="border border-slate-200 rounded-md px-1.5 py-0.5 w-full text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Units left:</span>
                            <input
                              type="number"
                              value={room.count || 1}
                              onChange={(e) => handleUpdateRoom(idx, 'count', Number(e.target.value))}
                              className="border border-slate-200 rounded-md px-1.5 py-0.5 w-full text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{room.roomSize || 2200} sq.ft.</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                            <span>{room.bedType || '4 King Beds'}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Up to {room.maxGuests || 12} guests</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#ea110d] text-[10px] font-bold border border-red-200">
                            {room.count || 1} units left
                          </span>
                        </div>
                      )}

                      {/* Amenities Chips */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {room.amenities.slice(0, 4).map((am, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Price & Select Button */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 gap-1.5">
                      {isEditMode ? (
                        <div className="space-y-1 text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Orig ₹:</span>
                            <input
                              type="number"
                              value={room.originalPrice || original}
                              onChange={(e) => handleUpdateRoom(idx, 'originalPrice', Number(e.target.value))}
                              className="border border-slate-200 rounded px-1 py-0.5 text-xs w-20 text-right"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-600">Base ₹:</span>
                            <input
                              type="number"
                              value={room.basePrice || roomPrice}
                              onChange={(e) => handleUpdateRoom(idx, 'basePrice', Number(e.target.value))}
                              className="border border-slate-200 rounded px-1 py-0.5 text-xs font-bold w-20 text-right"
                            />
                          </div>
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteRoom(idx);
                              }}
                              className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 justify-end cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-left md:text-right">
                          <span className="text-[11px] text-slate-400 line-through block font-medium">
                            ₹{original.toLocaleString('en-IN')}
                          </span>
                          <div className="text-base sm:text-lg font-extrabold text-slate-900 font-poppins">
                            ₹{roomPrice.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-normal text-slate-500">/ night</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            + ₹{Math.round(roomPrice * 0.18).toLocaleString('en-IN')} taxes &amp; fees
                          </span>
                          {savings > 0 && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                              Save ₹{savings.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoomIndex(idx);
                        }}
                        className={`mt-1 px-5 py-2.5 rounded-xl text-xs font-bold font-poppins transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ea110d] hover:bg-[#d00f0c] text-white shadow-sm'
                            : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-800 hover:text-slate-900'
                        }`}
                      >
                        {isSelected ? 'Selected Accommodation' : 'Select Accommodation'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* ─── Tab 2: About this Resort (7 cols) & Highlights (5 cols) ─── */}
        {(activeDetailTab === 'all' || activeDetailTab === 'about') && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Left Details & Video Card */}
          <div className="xl:col-span-7 bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex flex-col gap-5 justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-poppins mb-3">
                  About this {property.propertyType?.toUpperCase() || 'RESORT'}
                </h3>

                {isEditMode ? (
                  <div className="space-y-3 mb-4">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">
                      Description / Overview
                    </label>
                    <textarea
                      rows={5}
                      value={property.longDescription || property.description}
                      onChange={(e) => handleFieldChange('longDescription', e.target.value)}
                      className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl p-2.5 focus:outline-rose-500"
                    />
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-roboto mb-5">
                    {property.longDescription || property.description}
                  </p>
                )}

                {/* 4 Info Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Check-in</div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={property.policies?.checkInTime || '2:00 PM'}
                        onChange={(e) => handlePolicyChange('checkInTime', e.target.value)}
                        className="text-xs font-bold text-slate-800 border-b border-slate-200 w-full p-0 mt-0.5 focus:outline-hidden"
                      />
                    ) : (
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {property.policies?.checkInTime || '2:00 PM'}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Check-out</div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={property.policies?.checkOutTime || '11:00 AM'}
                        onChange={(e) => handlePolicyChange('checkOutTime', e.target.value)}
                        className="text-xs font-bold text-slate-800 border-b border-slate-200 w-full p-0 mt-0.5 focus:outline-hidden"
                      />
                    ) : (
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {property.policies?.checkOutTime || '11:00 AM'}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Property Type</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {property.propertyType?.toUpperCase() || 'RESORT'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Ideal For</div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={property.idealFor || 'Family, Group, Couples'}
                        onChange={(e) => handleFieldChange('idealFor', e.target.value)}
                        className="text-xs font-bold text-slate-800 border-b border-slate-200 w-full p-0 mt-0.5 focus:outline-hidden"
                      />
                    ) : (
                      <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                        {property.idealFor || 'Family, Group, Couples'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Tour Banner (Right side of card) */}
              <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 bg-slate-900 group cursor-pointer border border-slate-200">
                <Image
                  src={allPhotos[2] || allPhotos[0]}
                  alt="Video Tour Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-3 right-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                    <span className="text-[#ea110d] text-xs">▶</span>
                    <span>Watch Video Tour</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Highlights Column */}
          <div className="xl:col-span-5 bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Highlights</h3>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="text-xs font-bold text-[#ea110d] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {(property.highlights && property.highlights.length > 0
                  ? property.highlights
                  : [
                      { title: 'Stunning valley & waterfall view' },
                      { title: 'Private infinity pool with heating' },
                      { title: 'Dedicated chef and butler service' },
                      { title: 'Perfect for family stays & celebrations' },
                    ]
                ).map((hl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Sparkles className="w-4 h-4 text-slate-700 shrink-0" />
                      <span className="text-xs font-medium text-slate-700 truncate">{hl.title}</span>
                    </div>
                    {isEditMode ? (
                      <button
                        type="button"
                        onClick={() => requestDeleteHighlight(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">›</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#ea110d] shrink-0" />
              <span>High demand: 3 bookings completed in the last 24 hours.</span>
            </div>
          </div>
        </div>
        )}

        {/* ─── Tab 4: House Rules & Policies (4-Column Grid) ─── */}
        {(activeDetailTab === 'all' || activeDetailTab === 'rules') && (
        <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h3 className="text-xl font-bold text-slate-900 font-poppins mb-4">
            House Rules &amp; Policies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Check-in & Check-out */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-poppins">Check-in &amp; Check-out</div>
              <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                <p>Check-in: {property.policies?.checkInTime || '1:00 PM'} onwards</p>
                <p>Check-out: by {property.policies?.checkOutTime || '10:00 AM'}</p>
                <p className="text-slate-400">
                  {property.policies?.earlyCheckInNote || 'Early check-in subject to availability.'}
                </p>
              </div>
            </div>

            {/* Card 2: Cancellation Policy */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-poppins">Cancellation Policy</div>
              <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                <p className="font-semibold text-emerald-700">Free Cancellation</p>
                <p>
                  {property.policies?.cancellationPolicy ||
                    'Full refund up to 48 hours before check-in. 50% refund thereafter.'}
                </p>
              </div>
            </div>

            {/* Card 3: Suitability & Rules */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-poppins">Suitability &amp; Rules</div>
              <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                {(property.policies?.suitabilityRules || [
                  'Pets allowed (on request)',
                  'Smoking in outdoor areas',
                  'Group & bachelor friendly',
                  'Max 12 guests per estate',
                ]).map((rule, idx) => (
                  <p key={idx}>• {rule}</p>
                ))}
              </div>
            </div>

            {/* Card 4: Guidelines & Address */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-poppins">Guidelines &amp; Address</div>
              <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                <p>• Quiet hours: 10:00 PM - 7:00 AM</p>
                <p>• Government ID required</p>
                <p className="truncate">
                  {property.address?.fullAddress || property.policies?.fullAddress || property.location}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ─── Tab 3: Facilities / What this Resort offers ─── */}
        {(activeDetailTab === 'all' || activeDetailTab === 'facilities') && (
        <div id="facilities" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-poppins">
                What this {property.propertyType?.toUpperCase() || 'RESORT'} offers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All amenities have been verified by Mahastays quality inspection team.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('All resort amenities are verified.')}
              className="text-xs font-semibold text-slate-700 hover:text-[#ea110d] transition-colors font-poppins cursor-pointer"
            >
              View all amenities →
            </button>
          </div>

          {/* Amenities Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {ALL_POSSIBLE_AMENITIES.slice(0, 10).map((amenity, idx) => {
              const isIncluded = property.amenities.includes(amenity);

              return (
                <div
                  key={idx}
                  onClick={() => isEditMode && handleToggleAmenity(amenity)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    isIncluded
                      ? 'bg-[#f8f9fa] hover:bg-slate-100/90 border-slate-100/80 text-slate-700'
                      : 'bg-white/40 border-slate-100 text-slate-300 opacity-60'
                  } ${isEditMode ? 'cursor-pointer hover:border-slate-300' : ''}`}
                >
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 text-slate-700">
                    {idx === 0 ? (
                      <Waves className="w-4 h-4" />
                    ) : idx === 1 ? (
                      <Utensils className="w-4 h-4" />
                    ) : idx === 2 ? (
                      <Wifi className="w-4 h-4" />
                    ) : idx === 3 ? (
                      <Sparkles className="w-4 h-4" />
                    ) : idx === 4 ? (
                      <Building className="w-4 h-4" />
                    ) : idx === 5 ? (
                      <BedDouble className="w-4 h-4" />
                    ) : idx === 6 ? (
                      <Tv className="w-4 h-4" />
                    ) : idx === 7 ? (
                      <Bath className="w-4 h-4" />
                    ) : idx === 8 ? (
                      <Car className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs font-medium leading-snug truncate">{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* ─── Tab 5: Location & Map ─── */}
        {(activeDetailTab === 'all' || activeDetailTab === 'location') && (
        <div id="location" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-poppins">
                Location &amp; Nearby Attractions
              </h3>
              <p className="text-xs text-slate-500 font-roboto mt-0.5">
                {property.location || 'Panchgani & Old Mahabaleshwar, Maharashtra'}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.name + ' ' + (property.location || 'Panchgani'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-poppins transition"
            >
              <span>Open in Maps</span>
              <span>↗</span>
            </a>
          </div>

          {/* Map Preview Banner */}
          <div className="relative rounded-2xl overflow-hidden h-56 sm:h-64 bg-slate-100 border border-slate-200">
            <Image
              src="/panchgani.jpg"
              alt="Map Location View"
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#ea110d] text-white flex items-center justify-center shadow-xl animate-bounce">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="mt-1 px-3 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-md backdrop-blur-sm">
                {property.name}
              </div>
            </div>
          </div>

          {/* Nearby Attractions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            {[
              { name: 'Table Land Plateau', distance: '2.4 km • 7 mins drive', desc: "Asia's 2nd largest volcanic plateau" },
              { name: 'Venna Lake & Boating', distance: '4.8 km • 12 mins drive', desc: 'Serene boat rides & strawberry stalls' },
              { name: 'Mapro Garden', distance: '6.5 km • 15 mins drive', desc: 'Famous fresh strawberry cream & cafe' },
            ].map((att, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-900 font-poppins">{att.name}</div>
                <div className="text-[11px] font-semibold text-[#ea110d] mt-0.5">{att.distance}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{att.desc}</div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ─── Tab 6: Reviews & Ratings ─── */}
        {(activeDetailTab === 'all' || activeDetailTab === 'reviews') && (
        <div id="reviews" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-poppins flex items-center gap-2">
                <span>Guest Reviews &amp; Ratings</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                  ★ {property.rating || 4.96} / 5.0
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-roboto mt-0.5">
                Based on {property.reviewsCount || 128} verified group and family stays
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-poppins">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% Genuine Stays Verified</span>
            </div>
          </div>

          {/* Rating Categories Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Cleanliness', score: '4.9' },
              { label: 'Accuracy', score: '5.0' },
              { label: 'Communication', score: '4.9' },
              { label: 'Location', score: '4.8' },
              { label: 'Check-in', score: '5.0' },
              { label: 'Value for Money', score: '4.9' },
            ].map((cat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">{cat.label}</span>
                  <span className="text-slate-900 font-bold">{cat.score}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full w-[98%]" />
                </div>
              </div>
            ))}
          </div>

          {/* Sample Review Cards */}
          <div className="space-y-4 pt-2">
            {[
              {
                name: 'Abhishek Kulkarni',
                date: 'September 2026',
                rating: 5,
                comment: 'Incredible stay! The infinity pool looking over the valley is breathtaking. Ramesh the caretaker cooked delicious authentic Maharashtrian meals.',
              },
              {
                name: 'Pooja Mehta',
                date: 'August 2026',
                rating: 5,
                comment: 'Best property we have booked in Panchgani so far. Huge rooms, spotless bathrooms, and serene foggy mornings on the deck.',
              },
            ].map((rev, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-poppins">
                      {rev.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">{rev.name}</div>
                      <div className="text-[10px] text-slate-400 font-roboto">{rev.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 text-xs">
                    {'★'.repeat(rev.rating)}
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-roboto leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
        )}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN: Sticky Booking Calculation Card                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 sticky top-6 z-20">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            {/* Top Rate Header */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">
                  ₹{roomPricePerNight.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-normal"> / night</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 line-through block font-poppins">
                  ₹{originalRate.toLocaleString('en-IN')}
                </span>
                {savingsPerNight > 0 && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                    Save ₹{savingsPerNight.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Selected Accommodation Box (Soft Pink Tint) */}
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                  SELECTED ACCOMMODATION
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins truncate max-w-[210px]">
                  {selectedRoom.name}
                </div>
              </div>
              <span className="text-xs font-bold text-[#ea110d] font-poppins">Active</span>
            </div>

            {/* Date Selectors (2 columns with Calendar Icons) */}
            <div className="grid grid-cols-2 rounded-xl border border-slate-200 divide-x divide-slate-200 overflow-hidden bg-slate-50/40">
              <div className="p-2.5 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Check-in</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-2.5 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Check-out</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Guests Selector Row */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Guests</div>
                <div className="text-xs font-bold text-slate-900">
                  {adults} Adults, {children} Child
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold"
                >
                  -
                </button>
                <span className="text-xs font-bold w-4 text-center">{adults}</span>
                <button
                  type="button"
                  onClick={() => setAdults((prev) => prev + 1)}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reserve & Book Stay Button */}
            <button
              type="button"
              onClick={() => alert(`Simulating guest reservation for ${property.name} (${nights} nights).`)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Reserve &amp; Book Stay</span>
              <span>→</span>
            </button>

            <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>You won&apos;t be charged yet • Instant confirmation</span>
            </div>

            {/* Financial Calculation Breakdown / Ledger */}
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>
                  ₹{roomPricePerNight.toLocaleString('en-IN')} × {nights} nights
                </span>
                <span className="text-slate-900 font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Mahastays Member Discount (8%)</span>
                <span>-₹{memberDiscount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>Cleaning &amp; Sanitization Fee</span>
                <span className="text-slate-900 font-semibold">₹{cleaningFee.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>Taxes &amp; GST (18%)</span>
                <span className="text-slate-900 font-semibold">₹{taxesGst.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-slate-200 pt-2.5 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 font-poppins">Total (INR)</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Safe Guarantee Badges */}
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% Verified Stay with Safe Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Free Cancellation up to 48 hours before check-in</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDeleteState.onConfirm}
        title={confirmDeleteState.title}
        itemName={confirmDeleteState.itemName}
        message={confirmDeleteState.message}
      />
    </div>
  );
}
