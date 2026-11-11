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
  RotateCw,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/upload';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import LocationMapPicker from '../maps/LocationMapPicker';
import { VideoPlayerModal, getYouTubeThumbnailUrl } from '../modals/VideoPlayerModal';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPropertyById,
  updatePropertyAsync,
  approvePropertyAsync,
  rejectPropertyAsync,
  togglePropertyBookingAsync,
} from '@/store/slices/propertiesSlice';
import { PropertyItem, RoomItem, PropertyType } from '@/types';
import { toast } from '@/components/ui/Toast';

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
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const hostAvatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingHostAvatar, setIsUploadingHostAvatar] = useState(false);

  const handleHostAvatarUpload = async (file: File) => {
    try {
      setIsUploadingHostAvatar(true);
      const res = await uploadImageToCloudinary(file, 'hosts');
      handleHostChange('avatar', res.url);
      setUploadSuccessToast('Host profile / logo updated!');
      setTimeout(() => setUploadSuccessToast(null), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload host image', 'Upload Failed');
    } finally {
      setIsUploadingHostAvatar(false);
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchPropertyById(id)).unwrap();
    } catch (err) {
      console.error('Refresh property error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Booking Preview calculation states
  const [checkInDate, setCheckInDate] = useState('2026-10-15');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-18');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);

  // Modal for editing room
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);
  const [showPricingEdit, setShowPricingEdit] = useState(false);

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
    : [];

  const rooms = property.rooms && property.rooms.length > 0
    ? property.rooms
    : [
        {
          roomId: 'rm_default',
          name: property.name || 'Standard Accommodation',
          badge: 'Standard',
          tagline: 'Comfortable Room',
          bedType: 'Double Bed',
          roomSize: 350,
          maxGuests: 2,
          basePrice: property.numericPrice || 2500,
          originalPrice: property.originalPrice || 3000,
          count: 1,
          images: allPhotos.length > 0 ? [allPhotos[0]] : [],
          amenities: property.amenities?.slice(0, 4) || [],
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
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  const roomPricePerNight = selectedRoom.basePrice || property.numericPrice || 0;
  const originalRate = selectedRoom.originalPrice || property.originalPrice || roomPricePerNight;
  const savingsPerNight = Math.max(0, originalRate - roomPricePerNight);
  const subtotal = roomPricePerNight * nights;

  // Custom Pricing, Discounts & GST Rules
  const pricingRules = property.pricingRules || {};
  const discountPercent = typeof pricingRules.memberDiscountPercent === 'number' ? pricingRules.memberDiscountPercent : 8;
  const discountType = pricingRules.discountType || 'percentage';
  const customDiscountAmount = typeof pricingRules.customDiscountAmount === 'number' ? pricingRules.customDiscountAmount : 0;
  const includeCleaningFee = pricingRules.includeCleaningFee !== false;
  const configuredCleaningFee = typeof pricingRules.cleaningFee === 'number' ? pricingRules.cleaningFee : 445;
  const cleaningFee = includeCleaningFee ? configuredCleaningFee : 0;
  const includeGst = pricingRules.includeGst !== false;
  const gstPercent = typeof pricingRules.gstPercent === 'number' ? pricingRules.gstPercent : 18;

  const memberDiscount =
    discountType === 'flat'
      ? customDiscountAmount
      : discountType === 'none' || discountPercent === 0
      ? 0
      : Math.round(subtotal * (discountPercent / 100));

  const taxableAmount = Math.max(0, subtotal - memberDiscount + cleaningFee);
  const taxesGst = includeGst ? Math.round(taxableAmount * (gstPercent / 100)) : 0;
  const grandTotal = subtotal - memberDiscount + cleaningFee + taxesGst;

  const handlePricingRuleChange = (key: string, value: any) => {
    if (!property) return;
    setProperty({
      ...property,
      pricingRules: {
        ...(property.pricingRules || {}),
        [key]: value,
      },
    });
  };

  // Handlers for state updates
  const handleFieldChange = (field: keyof PropertyItem, value: any) => {
    setProperty((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleHostChange = (field: string, value: any) => {
    if (!property) return;
    setProperty({
      ...property,
      host: {
        name: property.host?.name || '',
        role: property.host?.role || '',
        experience: property.host?.experience || '',
        staysCount: property.host?.staysCount || '',
        verified: property.host?.verified ?? true,
        avatar: property.host?.avatar || '',
        confirmationBadge: property.host?.confirmationBadge || 'Instant Booking Confirmed',
        [field]: value,
      },
    });
  };

  const handleAddRoomAmenity = (roomIndex: number, amenityText: string) => {
    if (!property || !rooms[roomIndex]) return;
    const current = rooms[roomIndex].amenities ? [...rooms[roomIndex].amenities] : [];
    current.push(amenityText);
    handleUpdateRoom(roomIndex, 'amenities', current);
  };

  const handleUpdateRoomAmenity = (roomIndex: number, amenityIndex: number, val: string) => {
    if (!property || !rooms[roomIndex]) return;
    const current = [...(rooms[roomIndex].amenities || [])];
    current[amenityIndex] = val;
    handleUpdateRoom(roomIndex, 'amenities', current);
  };

  const handleRemoveRoomAmenity = (roomIndex: number, amenityIndex: number) => {
    if (!property || !rooms[roomIndex]) return;
    const current = (rooms[roomIndex].amenities || []).filter((_, i) => i !== amenityIndex);
    handleUpdateRoom(roomIndex, 'amenities', current);
  };

  const handleUpdateHighlight = (index: number, val: string) => {
    if (!property || !property.highlights) return;
    const current = [...property.highlights];
    current[index] = { ...current[index], title: val };
    setProperty({ ...property, highlights: current });
  };

  const handleKeyAmenityChange = (index: number, field: 'name' | 'desc', val: string) => {
    if (!property || !property.keyAmenities) return;
    const current = [...property.keyAmenities];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      setProperty({ ...property, keyAmenities: current });
    }
  };

  const handleRemoveKeyAmenity = (index: number) => {
    if (!property || !property.keyAmenities) return;
    const current = [...property.keyAmenities];
    const filtered = current.filter((_, i) => i !== index);
    setProperty({ ...property, keyAmenities: filtered });
  };

  const handleAddKeyAmenity = () => {
    if (!property) return;
    const current = property.keyAmenities ? [...property.keyAmenities] : [];
    setProperty({
      ...property,
      keyAmenities: [...current, { name: 'New Feature', desc: 'Feature description' }],
    });
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

  const handleAddSuitabilityRule = () => {
    if (!property) return;
    const currentRules = property.policies?.suitabilityRules ? [...property.policies.suitabilityRules] : [];
    setProperty({
      ...property,
      policies: {
        ...(property.policies || {}),
        suitabilityRules: [...currentRules, 'New house rule'],
      },
    });
  };

  const handleRemoveSuitabilityRule = (index: number) => {
    if (!property) return;
    const currentRules = property.policies?.suitabilityRules ? [...property.policies.suitabilityRules] : [];
    const filtered = currentRules.filter((_, i) => i !== index);
    setProperty({
      ...property,
      policies: {
        ...(property.policies || {}),
        suitabilityRules: filtered,
      },
    });
  };

  const handleUpdateSuitabilityRule = (index: number, val: string) => {
    if (!property) return;
    const currentRules = property.policies?.suitabilityRules ? [...property.policies.suitabilityRules] : [];
    currentRules[index] = val;
    setProperty({
      ...property,
      policies: {
        ...(property.policies || {}),
        suitabilityRules: currentRules,
      },
    });
  };

  const DEFAULT_FACILITY_CATEGORIES = [
    {
      category: 'Luxury & Recreation',
      items: ['Private Infinity Heated Pool', 'Open-Air Jacuzzi & Sun Deck', 'Landscaped Lawn & Gazebo', 'Private Balcony with Valley View'],
    },
    {
      category: 'Dining & Culinary',
      items: ['Dedicated In-House Chef', 'Gourmet Multi-Cuisine Menu', 'Live Barbeque & Bonfire Setup', 'Modern Modular Kitchen'],
    },
    {
      category: 'Entertainment & Tech',
      items: ['65" 4K Smart TVs with OTT', 'High-Speed Fiber Wi-Fi (300 Mbps)', 'Bluetooth Acoustic Sound System', 'Board Games & Cards Corner'],
    },
    {
      category: 'Comfort & Utilities',
      items: ['100% Automatic Power Backup', 'Central Air-Conditioning & Heating', 'Premium Linens & Memory Foam Mattresses', 'Daily Housekeeping & Turn-Down'],
    },
    {
      category: 'Safety & Security',
      items: ['24/7 Gated Security & Caretaker', 'Perimeter CCTV Surveillance', 'Digital Safe in Master Suites', 'First Aid Kit & Doctor on Call'],
    },
    {
      category: 'Family & Pet Friendly',
      items: ['Pet-Friendly Lawn Area', 'Baby Cot & High Chair on Request', 'Safe Enclosed Villa Grounds', 'Custom Kids Meal Preparation'],
    },
  ];

  const facilityCategories = (property?.facilityCategories && property.facilityCategories.length > 0)
    ? property.facilityCategories
    : DEFAULT_FACILITY_CATEGORIES;

  const handleFacilityCategoryTitleChange = (catIndex: number, newTitle: string) => {
    if (!property) return;
    const current = [...facilityCategories];
    if (current[catIndex]) {
      current[catIndex] = { ...current[catIndex], category: newTitle };
      setProperty({ ...property, facilityCategories: current });
    }
  };

  const handleFacilityItemChange = (catIndex: number, itemIndex: number, newVal: string) => {
    if (!property) return;
    const current = [...facilityCategories];
    if (current[catIndex]) {
      const items = [...current[catIndex].items];
      items[itemIndex] = newVal;
      current[catIndex] = { ...current[catIndex], items };
      setProperty({ ...property, facilityCategories: current });
    }
  };

  const handleAddFacilityItem = (catIndex: number) => {
    if (!property) return;
    const current = [...facilityCategories];
    if (current[catIndex]) {
      const items = [...current[catIndex].items, 'New Amenity Item'];
      current[catIndex] = { ...current[catIndex], items };
      setProperty({ ...property, facilityCategories: current });
    }
  };

  const handleRemoveFacilityItem = (catIndex: number, itemIndex: number) => {
    if (!property) return;
    const current = [...facilityCategories];
    if (current[catIndex]) {
      const items = current[catIndex].items.filter((_, i) => i !== itemIndex);
      current[catIndex] = { ...current[catIndex], items };
      setProperty({ ...property, facilityCategories: current });
    }
  };

  const handleAddFacilityCategory = () => {
    if (!property) return;
    const current = [...facilityCategories];
    const newCat = { category: 'New Category', items: ['Feature Item 1', 'Feature Item 2'] };
    setProperty({ ...property, facilityCategories: [...current, newCat] });
  };

  const handleRemoveFacilityCategory = (catIndex: number) => {
    if (!property) return;
    const current = [...facilityCategories];
    const filtered = current.filter((_, i) => i !== catIndex);
    setProperty({ ...property, facilityCategories: filtered });
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
    const updatedRooms = [...rooms, newRoom];
    const roomPrices = updatedRooms.map((r) => Number(r.basePrice)).filter((p) => !isNaN(p) && p > 0);
    const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : property.numericPrice;
    setProperty({
      ...property,
      rooms: updatedRooms,
      numericPrice: minPrice,
    });
    setSelectedRoomIndex(rooms.length);
  };

  const handleUpdateRoom = (index: number, field: keyof RoomItem, val: any) => {
    if (!property) return;
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: val };
    const roomPrices = updated.map((r) => Number(r.basePrice)).filter((p) => !isNaN(p) && p > 0);
    const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : property.numericPrice;
    setProperty({ ...property, rooms: updated, numericPrice: minPrice });
  };

  const handleRemoveRoom = (index: number) => {
    if (!property || rooms.length <= 1) {
      toast.error('A property must have at least one room category.', 'Validation');
      return;
    }
    const updated = rooms.filter((_, i) => i !== index);
    const roomPrices = updated.map((r) => Number(r.basePrice)).filter((p) => !isNaN(p) && p > 0);
    const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : property.numericPrice;
    setProperty({ ...property, rooms: updated, numericPrice: minPrice });
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
      toast.error('A property must have at least one room category.', 'Validation');
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
      toast.error('A property must have at least one showcase photo.', 'Validation');
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
    const files = Array.from(e.target.files || []);
    if (!files.length || !property) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const res = await uploadImageToCloudinary(file, 'listing_media');
        if (res?.url) uploadedUrls.push(res.url);
      }
      if (uploadedUrls.length) {
        setProperty({
          ...property,
          images: [...allPhotos, ...uploadedUrls],
        });
        setUploadSuccessToast(`Uploaded ${uploadedUrls.length} photo(s)`);
        setTimeout(() => setUploadSuccessToast(null), 4000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed', 'Upload Failed');
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
    const roomPrices = (property.rooms || []).map((r) => Number(r.basePrice)).filter((p) => !isNaN(p) && p > 0);
    const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : (property.numericPrice || 0);
    const updatedProp = {
      ...property,
      numericPrice: minPrice,
    };
    try {
      await dispatch(updatePropertyAsync(updatedProp)).unwrap();
      setProperty(updatedProp);
      setSaveSuccessToast(true);
      toast.success('Property details saved successfully!', 'Property Saved');
      setTimeout(() => setSaveSuccessToast(false), 3500);
      setIsEditMode(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save property changes', 'Save Failed');
    }
  };

  const handleApprove = async () => {
    if (!property) return;
    try {
      await dispatch(approvePropertyAsync({ id: property.id, adminId: user?.id })).unwrap();
      setProperty({ ...property, status: 'active' });
      toast.success('Property approved and live on catalog!', 'Listing Approved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve property');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for rejecting this property listing:');
    if (reason && property) {
      try {
        await dispatch(rejectPropertyAsync({ id: property.id, reason })).unwrap();
        setProperty({ ...property, status: 'rejected', rejectionReason: reason });
        toast.success('Property listing rejected with feedback note.', 'Listing Rejected');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to reject property');
      }
    }
  };

  const handleToggleBooking = async () => {
    if (!property) return;
    const next = property.acceptingBookings === false ? true : false;
    setProperty((prev) => (prev ? { ...prev, acceptingBookings: next } : prev));
    try {
      await dispatch(togglePropertyBookingAsync({ id: property.id, acceptingBookings: next })).unwrap();
      toast.success(
        next ? 'Property is now accepting bookings.' : 'Property bookings are now paused.',
        'Booking Status'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking status', 'Error');
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

            {property.acceptingBookings === false ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                <PauseCircle className="w-3.5 h-3.5" />
                Bookings Paused
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Bookings Open
              </span>
            )}
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

          {/* Dedicated Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refetch Property from Database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#ea110d]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Pause / Resume Bookings Button */}
          <button
            type="button"
            onClick={handleToggleBooking}
            title={property.acceptingBookings === false ? 'Click to resume accepting bookings' : 'Click to pause bookings'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
              property.acceptingBookings === false
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {property.acceptingBookings === false ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume Bookings</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause Bookings</span>
              </>
            )}
          </button>

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      Badge (Optional)
                    </label>
                    <input
                      type="text"
                      value={property.badge || ''}
                      onChange={(e) => handleFieldChange('badge', e.target.value)}
                      placeholder="e.g. Top Rated Villa"
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

            {/* Badge Chips Row */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap">
              {property.badge && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ea110d] text-xs font-bold font-poppins border border-red-100">
                  <Award className="w-3.5 h-3.5" />
                  <span>{property.badge}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Building className="w-3.5 h-3.5 text-slate-700" />
                <span>{property.propertyType?.toUpperCase() || 'VILLA'}</span>
              </span>
              {property.city && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium font-poppins">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{property.city}</span>
                </span>
              )}
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
                multiple
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
                    <span>Upload Photos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

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
              <div className="relative group shrink-0">
                {property.host?.avatar ? (
                  <img
                    src={property.host.avatar}
                    alt={property.host?.name || 'Host'}
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-rose-100 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0B0A06] text-white font-extrabold text-lg flex items-center justify-center font-poppins shrink-0 shadow-sm">
                    {property.host?.name ? property.host.name[0] : 'K'}
                  </div>
                )}
                {isEditMode && (
                  <>
                    <button
                      type="button"
                      disabled={isUploadingHostAvatar}
                      onClick={() => hostAvatarInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold"
                      title="Upload Host Photo / Logo"
                    >
                      {isUploadingHostAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={hostAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHostAvatarUpload(file);
                      }}
                    />
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isEditMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Host:</span>
                      <input
                        type="text"
                        value={property.host?.name || ''}
                        onChange={(e) => handleHostChange('name', e.target.value)}
                        placeholder="Host Name"
                        className="text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Role:</span>
                      <input
                        type="text"
                        value={property.host?.role || ''}
                        onChange={(e) => handleHostChange('role', e.target.value)}
                        placeholder="Property Owner & Manager"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Exp:</span>
                      <input
                        type="text"
                        value={property.host?.experience || ''}
                        onChange={(e) => handleHostChange('experience', e.target.value)}
                        placeholder="e.g. Host since 2021"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Stays:</span>
                      <input
                        type="text"
                        value={property.host?.staysCount || ''}
                        onChange={(e) => handleHostChange('staysCount', e.target.value)}
                        placeholder="e.g. 50+ Verified Stays"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isUploadingHostAvatar}
                        onClick={() => hostAvatarInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#ea110d] text-[11px] font-bold border border-rose-200 transition cursor-pointer"
                      >
                        {isUploadingHostAvatar ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3" />
                            <span>{property.host?.avatar ? 'Change Host Photo / Logo' : 'Upload Host Photo / Logo'}</span>
                          </>
                        )}
                      </button>
                      {property.host?.avatar && (
                        <button
                          type="button"
                          onClick={() => handleHostChange('avatar', '')}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                      <span>Hosted by {property.host?.name || property.vendorName || 'Property Host'}</span>
                      {(property.host?.verified ?? true) && (
                        <span
                          className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                          title="Verified Host"
                        >
                          ✓
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                      {property.host?.role || 'Property Manager'}
                      {property.host?.experience ? ` • ${property.host.experience}` : ''}
                      {property.host?.staysCount ? ` • ${property.host.staysCount}` : ''}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              {isEditMode ? (
                <div className="flex flex-col gap-1.5 items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Badge:</span>
                    <input
                      type="text"
                      value={property.host?.confirmationBadge || 'Instant Booking Confirmed'}
                      onChange={(e) => handleHostChange('confirmationBadge', e.target.value)}
                      placeholder="Badge"
                      className="text-xs font-semibold text-[#ea110d] border border-red-200 rounded-lg px-2 py-1 w-44"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.host?.verified ?? true}
                      onChange={(e) => handleHostChange('verified', e.target.checked)}
                      className="accent-[#ea110d]"
                    />
                    <span>Verified Host</span>
                  </label>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/80 text-[#ea110d] text-xs font-semibold font-poppins shadow-2xs">
                  <span className="text-[#ea110d] font-bold">✓</span>
                  <span>{property.host?.confirmationBadge || 'Instant Booking Confirmed'}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Quick Feature Cards Strip (Dynamic: Edit / Remove / Add) ─── */}
          {((property.keyAmenities && property.keyAmenities.length > 0) || isEditMode) && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Key Feature Cards ({property.keyAmenities?.length || 0})
                </span>
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#ea110d] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Cards</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddKeyAmenity}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#ea110d] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Feature Card</span>
                    </button>
                  )}
                </div>
              </div>
              {!isEditMode ? (
                (property.keyAmenities && property.keyAmenities.length > 0) ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80">
                      {property.keyAmenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          title={amenity.desc ? `${amenity.name} • ${amenity.desc}` : amenity.name}
                          className="group flex items-center justify-center sm:justify-start gap-2.5 px-3.5 sm:px-5 py-3 sm:py-3.5 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="relative w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 flex items-center justify-center">
                            <Image
                              src="/brand/mahastays-logo-main.png"
                              alt="Mahastays"
                              width={22}
                              height={22}
                              className="w-full h-full object-contain filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                            />
                          </div>
                          <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#ea110d] transition-colors font-poppins truncate tracking-tight">
                            {amenity.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-2.5 text-center text-xs text-slate-400 italic">
                    No custom feature cards added. Click &quot;Edit Cards&quot; to add cards to this strip.
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(property.keyAmenities || []).length === 0 ? (
                    <div className="col-span-full py-2 text-center text-xs text-slate-400 italic">
                      No custom feature cards added. Click &quot;Add Feature Card&quot; to highlight amenities.
                    </div>
                  ) : (
                    (property.keyAmenities || []).map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100 relative group"
                      >
                        <div className="relative w-8 h-8 rounded-lg bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 p-1 mt-0.5">
                          <Image
                            src="/brand/mahastays-logo-main.png"
                            alt="Mahastays"
                            width={20}
                            height={20}
                            className="w-full h-full object-contain filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 transition-all"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <input
                            type="text"
                            value={amenity.name}
                            onChange={(e) => handleKeyAmenityChange(idx, 'name', e.target.value)}
                            placeholder="Card Title"
                            className="text-xs font-bold text-slate-900 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                          />
                          <input
                            type="text"
                            value={amenity.desc}
                            onChange={(e) => handleKeyAmenityChange(idx, 'desc', e.target.value)}
                            placeholder="Card Description"
                            className="text-[10px] text-slate-500 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyAmenity(idx)}
                          className="text-slate-400 hover:text-[#ea110d] p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove this card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

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
          {activeDetailTab === 'rooms' && (
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
                      {isEditMode && (
                        <label className="absolute inset-0 bg-black/50 hover:bg-black/70 flex flex-col items-center justify-center gap-1 text-white text-[10px] font-bold cursor-pointer transition-all">
                          <UploadCloud className="w-4 h-4 text-white" />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !property) return;
                              try {
                                const res = await uploadImageToCloudinary(file, 'listing_media');
                                if (res?.url) {
                                  const updatedRooms = [...property.rooms];
                                  updatedRooms[idx] = {
                                    ...updatedRooms[idx],
                                    images: [res.url, ...(updatedRooms[idx].images || []).slice(1)],
                                  };
                                  setProperty({ ...property, rooms: updatedRooms });
                                }
                              } catch (err: any) {
                                alert(`Failed to upload room photo: ${err?.message || 'Please try again'}`);
                              }
                            }}
                          />
                        </label>
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

                      {/* Amenities Chips / Bullet Points */}
                      {isEditMode ? (
                        <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                          {(room.amenities || []).map((am, amIdx) => (
                            <div
                              key={amIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px]"
                            >
                              <input
                                type="text"
                                value={am}
                                onChange={(e) => handleUpdateRoomAmenity(idx, amIdx, e.target.value)}
                                className="bg-transparent border-0 p-0 text-[11px] text-slate-700 focus:outline-none min-w-[60px]"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveRoomAmenity(idx, amIdx);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddRoomAmenity(idx, 'Free Breakfast');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-red-300 bg-red-50/40 text-[10px] font-bold text-[#ea110d] hover:bg-red-50 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Amenity</span>
                          </button>
                        </div>
                      ) : (
                        room.amenities && room.amenities.length > 0 && (
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
                        )
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
        {activeDetailTab === 'about' && (
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

              {/* Video Tour Banner & YouTube Editor */}
              <div className="flex flex-col gap-2">
                <div
                  onClick={() => setVideoModalOpen(true)}
                  className="relative rounded-2xl overflow-hidden h-44 sm:h-48 bg-slate-900 group cursor-pointer border border-slate-200 shadow-sm"
                >
                  <Image
                    src={getYouTubeThumbnailUrl(property.videoUrl, allPhotos[2] || allPhotos[0])}
                    alt="Video Tour Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
                  <div className="absolute bottom-3 right-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                      <span className="text-[#ea110d] text-xs">▶</span>
                      <span>Watch Video Tour</span>
                    </div>
                  </div>
                </div>

                {isEditMode && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                    <Video className="w-3.5 h-3.5 text-[#ea110d] shrink-0" />
                    <input
                      type="text"
                      value={property.videoUrl || ''}
                      onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                      placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                      className="w-full text-xs bg-transparent border-0 focus:outline-none font-mono text-slate-800 placeholder-slate-400"
                    />
                  </div>
                )}
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
                {(property.highlights && property.highlights.length > 0) ? (
                  property.highlights.map((hl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Sparkles className="w-4 h-4 text-[#ea110d] shrink-0" />
                      {isEditMode ? (
                        <input
                          type="text"
                          value={hl.title}
                          onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                          className="text-xs font-medium text-slate-700 bg-transparent border-b border-slate-300 w-full focus:outline-none"
                        />
                      ) : (
                        <span className="text-xs font-medium text-slate-700 truncate">{hl.title}</span>
                      )}
                    </div>
                    {isEditMode ? (
                      <button
                        type="button"
                        onClick={() => requestDeleteHighlight(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">›</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {isEditMode ? 'No highlights added. Click "Add" above to add a highlight.' : 'No highlights listed.'}
                </p>
              )}
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
        {activeDetailTab === 'rules' && (
        <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-poppins">
                House Rules &amp; Policies
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Check-in timings, cancellation terms, and stay suitability guidelines.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Check-in & Check-out */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 font-poppins">Check-in &amp; Check-out</div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-2">
                  {isEditMode ? (
                    <>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Check-in Time</label>
                        <input
                          type="text"
                          value={property.policies?.checkInTime || '1:00 PM'}
                          onChange={(e) => handlePolicyChange('checkInTime', e.target.value)}
                          className="text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Check-out Time</label>
                        <input
                          type="text"
                          value={property.policies?.checkOutTime || '10:00 AM'}
                          onChange={(e) => handlePolicyChange('checkOutTime', e.target.value)}
                          className="text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Early Check-in Note</label>
                        <input
                          type="text"
                          value={property.policies?.earlyCheckInNote || 'Early check-in subject to availability.'}
                          onChange={(e) => handlePolicyChange('earlyCheckInNote', e.target.value)}
                          className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p>Check-in: {property.policies?.checkInTime || '1:00 PM'} onwards</p>
                      <p>Check-out: by {property.policies?.checkOutTime || '10:00 AM'}</p>
                      <p className="text-slate-400">
                        {property.policies?.earlyCheckInNote || 'Early check-in subject to availability.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Cancellation Policy */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 font-poppins">Cancellation Policy</div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-1.5">
                  <p className="font-semibold text-emerald-700">Free Cancellation Option</p>
                  {isEditMode ? (
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Cancellation Terms</label>
                      <textarea
                        rows={3}
                        value={
                          property.policies?.cancellationPolicy ||
                          'Full refund up to 48 hours before check-in. 50% refund thereafter.'
                        }
                        onChange={(e) => handlePolicyChange('cancellationPolicy', e.target.value)}
                        className="text-xs text-slate-700 border border-slate-200 rounded-lg p-2 w-full bg-white focus:outline-rose-500"
                      />
                    </div>
                  ) : (
                    <p>
                      {property.policies?.cancellationPolicy ||
                        'Full refund up to 48 hours before check-in. 50% refund thereafter.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Suitability & Rules */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-poppins">Suitability &amp; Rules</div>
                  </div>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleAddSuitabilityRule}
                      className="text-[11px] font-bold text-[#ea110d] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Rule</span>
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 space-y-2 mt-2">
                  {(property.policies?.suitabilityRules && property.policies.suitabilityRules.length > 0) ? (
                    property.policies.suitabilityRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-1.5">
                      {isEditMode ? (
                        <>
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) => handleUpdateSuitabilityRule(idx, e.target.value)}
                            className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 flex-1 bg-white focus:outline-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSuitabilityRule(idx)}
                            className="text-slate-400 hover:text-[#ea110d] p-1 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <p>• {rule}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {isEditMode ? 'No suitability rules added. Click "Add Rule" to add a rule.' : 'No suitability rules specified.'}
                  </p>
                )}
                </div>
              </div>
            </div>

            {/* Card 4: Guidelines & Address */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 font-poppins">Guidelines &amp; Address</div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-2">
                  {isEditMode ? (
                    <>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Quiet Hours</label>
                        <input
                          type="text"
                          value={property.policies?.quietHours || '10:00 PM - 7:00 AM'}
                          onChange={(e) => handlePolicyChange('quietHours', e.target.value)}
                          placeholder="e.g. 10:00 PM - 7:00 AM"
                          className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Guidelines Note</label>
                        <input
                          type="text"
                          value={property.policies?.guidelinesNote || 'Government ID required at check-in'}
                          onChange={(e) => handlePolicyChange('guidelinesNote', e.target.value)}
                          className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Full Address</label>
                        <input
                          type="text"
                          value={property.address?.fullAddress || property.policies?.fullAddress || property.location}
                          onChange={(e) =>
                            handleFieldChange('address', {
                              ...(property.address || {}),
                              fullAddress: e.target.value,
                            })
                          }
                          className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p>• Quiet hours: {property.policies?.quietHours || '10:00 PM - 7:00 AM'}</p>
                      <p>• {property.policies?.guidelinesNote || 'Government ID required'}</p>
                      <p className="truncate">
                        {property.address?.fullAddress || property.policies?.fullAddress || property.location}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ─── Tab 3: Facilities / What this Resort/Villa offers ─── */}
        {activeDetailTab === 'facilities' && (
        <div id="facilities" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-poppins">
                What this {property.propertyType ? (property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1).toLowerCase()) : 'Resort'} Offers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All facilities and amenities have been verified by Mahastays quality inspection team.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <button
                  type="button"
                  onClick={handleAddFacilityCategory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category Card</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Facilities</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Cards Grid (Matches User Reference Image 4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilityCategories.map((cat, catIdx) => (
              <div
                key={catIdx}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ea110d] shrink-0" />
                      {isEditMode ? (
                        <input
                          type="text"
                          value={cat.category}
                          onChange={(e) => handleFacilityCategoryTitleChange(catIdx, e.target.value)}
                          placeholder="Category Title"
                          className="text-xs font-bold text-slate-900 border-b border-slate-300 w-full p-0.5 bg-transparent focus:outline-hidden"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-900 font-poppins">{cat.category}</span>
                      )}
                    </div>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFacilityCategory(catIdx)}
                        className="text-slate-400 hover:text-[#ea110d] p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600">
                    {cat.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-center gap-2">
                        <span className="text-[#ea110d] font-bold text-[11px] shrink-0">✓</span>
                        {isEditMode ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleFacilityItemChange(catIdx, itemIdx, e.target.value)}
                              className="text-xs text-slate-700 border-b border-slate-200 flex-1 p-0.5 bg-transparent focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFacilityItem(catIdx, itemIdx)}
                              className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span>{item}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleAddFacilityItem(catIdx)}
                    className="mt-3.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#ea110d] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ─── Tab 5: Location & Map ─── */}
        {activeDetailTab === 'location' && (
          <div id="location">
            <LocationMapPicker
              propertyName={property.name}
              locationArea={property.location || property.city}
              initialCoordinates={{
                lat: property.address?.lat,
                lng: property.address?.lng,
                fullAddress: property.address?.fullAddress || property.location,
                mapLink: property.address?.mapLink,
              }}
              isEditMode={isEditMode}
              nearbyAttractions={property.nearbyAttractions}
              onChange={(coords) => {
                setProperty((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    location: coords.fullAddress || prev.location,
                    address: {
                      ...(prev.address || { fullAddress: '' }),
                      lat: coords.lat,
                      lng: coords.lng,
                      fullAddress: coords.fullAddress || prev.address?.fullAddress || prev.location || '',
                      mapLink: coords.mapLink || `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
                    },
                  };
                });
              }}
              onAttractionsChange={(attractions) => {
                setProperty((prev) => (prev ? { ...prev, nearbyAttractions: attractions } : prev));
              }}
            />
          </div>
        )}

        {/* ─── Tab 6: Reviews & Ratings ─── */}
        {activeDetailTab === 'reviews' && (
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
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Folio Breakdown</span>
                <button
                  type="button"
                  onClick={() => setShowPricingEdit(!showPricingEdit)}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-1 cursor-pointer"
                >
                  {showPricingEdit ? '✓ Close Edit Rates' : '⚙ Edit Fees & Discounts'}
                </button>
              </div>

              {/* Inline Rates & Fees Customizer */}
              {showPricingEdit && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 mb-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Pricing, Fees &amp; GST Settings</span>
                    <span className="text-[10px] text-amber-600 font-normal">Saves on &ldquo;Save to Backend&rdquo;</span>
                  </div>

                  {/* 1. Discount Percentage / Flat */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Mahastays / Vendor Discount (%)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Currently {discountPercent}%</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => handlePricingRuleChange('memberDiscountPercent', Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {[0, 8, 12, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handlePricingRuleChange('memberDiscountPercent', pct)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              discountPercent === pct
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {pct === 0 ? 'None' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Cleaning & Sanitization Fee */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Cleaning &amp; Sanitization Fee (₹)</span>
                      <span className={`text-[10px] font-bold ${includeCleaningFee ? 'text-slate-700 dark:text-slate-300' : 'text-red-500 line-through'}`}>
                        {includeCleaningFee ? `₹${cleaningFee}` : 'Fee Removed'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          disabled={!includeCleaningFee}
                          value={configuredCleaningFee}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            handlePricingRuleChange('cleaningFee', val);
                          }}
                          className={`w-full pl-6 pr-2 py-1.5 rounded-xl border text-xs font-bold ${
                            includeCleaningFee
                              ? 'bg-white dark:bg-slate-900 border-slate-200 text-slate-900 dark:text-slate-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          }`}
                        />
                      </div>

                      {/* Remove / Restore Fee Button */}
                      {includeCleaningFee ? (
                        <button
                          type="button"
                          onClick={() => {
                            handlePricingRuleChange('includeCleaningFee', false);
                            handlePricingRuleChange('cleaningFee', 0);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                          title="Remove cleaning fee from this property"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Remove Fee</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handlePricingRuleChange('includeCleaningFee', true);
                            handlePricingRuleChange('cleaningFee', 445);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>Restore (₹445)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Taxes & GST Rate */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Taxes &amp; GST Rate (%)</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{includeGst ? `${gstPercent}% GST` : 'Exempt'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="28"
                        disabled={!includeGst}
                        value={gstPercent}
                        onChange={(e) => handlePricingRuleChange('gstPercent', Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className={`w-20 p-2 rounded-xl border text-xs font-bold ${
                          includeGst
                            ? 'bg-white dark:bg-slate-900 border-slate-200 text-slate-900 dark:text-slate-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>

                      <div className="flex items-center gap-1 ml-auto">
                        {[0, 5, 12, 18].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              handlePricingRuleChange('includeGst', g > 0);
                              handlePricingRuleChange('gstPercent', g);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              gstPercent === g && (g === 0 || includeGst)
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {g === 0 ? '0% Ex' : `${g}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span>
                  ₹{roomPricePerNight.toLocaleString('en-IN')} × {nights} nights
                </span>
                <span className="text-slate-900 font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {memberDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Mahastays Member Discount ({discountPercent}%)</span>
                  <span>-₹{memberDiscount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Member Discount</span>
                  <span>₹0 (None)</span>
                </div>
              )}

              {includeCleaningFee && cleaningFee > 0 ? (
                <div className="flex justify-between">
                  <span>Cleaning &amp; Sanitization Fee</span>
                  <span className="text-slate-900 font-semibold">₹{cleaningFee.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Cleaning &amp; Sanitization Fee</span>
                  <span className="text-emerald-600 font-semibold">₹0 (Removed / Waived)</span>
                </div>
              )}

              {includeGst && gstPercent > 0 ? (
                <div className="flex justify-between">
                  <span>Taxes &amp; GST ({gstPercent}%)</span>
                  <span className="text-slate-900 font-semibold">₹{taxesGst.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Taxes &amp; GST</span>
                  <span>₹0 (GST Exempt)</span>
                </div>
              )}

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

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={property.videoUrl}
        title={`Video Walkthrough: ${property.name}`}
        isEditMode={isEditMode}
        onUpdateUrl={(newUrl) => handleFieldChange('videoUrl', newUrl)}
      />
    </div>
  );
}
