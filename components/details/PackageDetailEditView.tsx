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
  Users,
  Sparkles,
  Calendar,
  Check,
  Building,
  Camera,
  Layers,
  ListOrdered,
  Award,
  ShieldCheck,
  ChevronRight,
  Share2,
  Heart,
  Utensils,
  Compass,
  UploadCloud,
  Loader2,
  RotateCw,
  Video,
  X,
} from 'lucide-react';
import { VideoPlayerModal, getYouTubeThumbnailUrl } from '../modals/VideoPlayerModal';
import { uploadImageToCloudinary } from '@/lib/upload';
import LocationMapPicker from '../maps/LocationMapPicker';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPackageById,
  updatePackageAsync,
  approvePackageAsync,
  rejectPackageAsync,
} from '@/store/slices/packagesSlice';
import { PackageItem, PackageCategory, PackageType, PackageTierItem } from '@/types';
import { toast } from '@/components/ui/Toast';

interface PackageDetailEditViewProps {
  id: string;
}

const PACKAGE_CATEGORIES: PackageCategory[] = ['Honeymoon', 'Luxury', 'Adventure', 'Heritage'];
const PACKAGE_TYPES: PackageType[] = ['couple', 'bachelor_party', 'corporate', 'birthday'];

export default function PackageDetailEditView({ id }: PackageDetailEditViewProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const dispatch = useAppDispatch();
  const { items, selectedPackage, saving } = useAppSelector((state) => state.packages);

  const isAdmin = activeViewMode === 'admin';

  const [pkg, setPkg] = useState<PackageItem | null>(() => {
    return items.find((p) => p.id === id || p.code === id || p.slug === id) || null;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
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
      toast.success('Host profile / logo updated!', 'Host Updated');
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
      await dispatch(fetchPackageById(id)).unwrap();
    } catch (err) {
      console.error('Refresh package error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Booking preview calculator states
  const [startDate, setStartDate] = useState('2026-10-15');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showPricingEdit, setShowPricingEdit] = useState(false);

  // Frontend-matching Detail Tabs State
  const [activeDetailTab, setActiveDetailTab] = useState<string>('tiers');
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
    if (id && typeof fetchPackageById === 'function') {
      dispatch(fetchPackageById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    const found = items.find((p) => p.id === id || p.code === id || p.slug === id);
    if (found) {
      setPkg(found);
    } else if (
      selectedPackage &&
      (selectedPackage.id === id || selectedPackage.code === id || selectedPackage.slug === id)
    ) {
      setPkg(selectedPackage);
    }
  }, [items, selectedPackage, id]);

  if (!pkg) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading tour package details...</p>
        <Link
          href="/dashboard/packages"
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Packages Catalog
        </Link>
      </div>
    );
  }

  const isOwnerVendor = !isAdmin && (user?.vendorId === pkg.vendorId || user?.id === pkg.vendorId);

  if (!isAdmin && !isOwnerVendor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md text-center">
          You only have permission to view and edit packages assigned to your vendor account ({user?.businessName || user?.name}).
        </p>
        <Link
          href="/dashboard/packages"
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Packages
        </Link>
      </div>
    );
  }

  const isApproved = pkg.status === 'active';
  const isPending = pkg.status === 'pending_approval';
  const isRejected = pkg.status === 'rejected';

  const allPhotos = pkg.images && pkg.images.length > 0
    ? pkg.images
    : pkg.thumbnail ? [pkg.thumbnail] : [];

  const tiers: PackageTierItem[] = pkg.tiers && pkg.tiers.length > 0
    ? pkg.tiers
    : [
        {
          tierId: 'standard',
          name: 'Standard Package',
          hotelType: 'Accommodation Included',
          pricePerPerson: pkg.numericPrice || 5000,
          originalPrice: pkg.originalPrice || pkg.numericPrice || 5000,
          features: Array.isArray(pkg.inclusions)
            ? pkg.inclusions.map((inc: any) => (typeof inc === 'string' ? inc : inc.title || ''))
            : ['Guided Tour', 'Standard Transfers'],
        },
      ];

  const itinerary = pkg.itinerary && pkg.itinerary.length > 0
    ? pkg.itinerary
    : [];

  const selectedTier = tiers[selectedTierIndex] || tiers[0];
  const isPerNight = pkg.priceType === 'per_night';
  const personLimit = pkg.personLimit || 6;
  const pricePerPerson = selectedTier.pricePerPerson || pkg.numericPrice || 8500;
  const originalPricePerPerson = selectedTier.originalPrice || pricePerPerson + 3000;
  const savingsPerPerson = Math.max(0, originalPricePerPerson - pricePerPerson);

  const baseCost = isPerNight
    ? pricePerPerson * Math.max(1, pkg.durationNights || 1)
    : pricePerPerson * Math.max(1, adults) + Math.round(pricePerPerson * 0.6) * children;

  // Custom Pricing, Discounts & GST Rules
  const pricingRules = pkg.pricingRules || {};
  const discountPercent = typeof pricingRules.memberDiscountPercent === 'number' ? pricingRules.memberDiscountPercent : 8;
  const discountType = pricingRules.discountType || 'percentage';
  const customDiscountAmount = typeof pricingRules.customDiscountAmount === 'number' ? pricingRules.customDiscountAmount : 0;
  const includeCleaningFee = pricingRules.includeCleaningFee !== false;
  const configuredFee = typeof pricingRules.cleaningFee === 'number' ? pricingRules.cleaningFee : 445;
  const conciergeFee = includeCleaningFee ? configuredFee : 0;
  const includeGst = pricingRules.includeGst !== false;
  const gstPercent = typeof pricingRules.gstPercent === 'number' ? pricingRules.gstPercent : 5;

  const memberDiscount =
    discountType === 'flat'
      ? customDiscountAmount
      : discountType === 'none' || discountPercent === 0
      ? 0
      : Math.round(baseCost * (discountPercent / 100));

  const taxableAmount = Math.max(0, baseCost - memberDiscount + conciergeFee);
  const taxesGst = includeGst ? Math.round(taxableAmount * (gstPercent / 100)) : 0;
  const grandTotal = baseCost - memberDiscount + conciergeFee + taxesGst;

  const handlePricingRuleChange = (key: string, value: any) => {
    if (!pkg) return;
    setPkg({
      ...pkg,
      pricingRules: {
        ...(pkg.pricingRules || {}),
        [key]: value,
      },
    });
  };

  const handleFieldChange = (field: keyof PackageItem, value: any) => {
    setPkg((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleHostChange = (field: string, val: any) => {
    if (!pkg) return;
    setPkg({
      ...pkg,
      host: {
        name: pkg.host?.name || 'Vikramaditya & Concierge Team',
        role: pkg.host?.role || 'Holiday Specialist & Concierge',
        experience: pkg.host?.experience || '5 Years hosting',
        staysCount: pkg.host?.staysCount || '1,200+ Verified Guests',
        verified: pkg.host?.verified ?? true,
        avatar: pkg.host?.avatar || '',
        confirmationBadge: pkg.host?.confirmationBadge || 'Instant Booking Confirmed',
        [field]: val,
      },
    });
  };

  const handleAddTierFeature = (tierIndex: number, featureText: string) => {
    if (!pkg || !tiers[tierIndex]) return;
    const currentFeatures = tiers[tierIndex].features ? [...tiers[tierIndex].features] : [];
    currentFeatures.push(featureText);
    handleUpdateTier(tierIndex, 'features', currentFeatures);
  };

  const handleUpdateTierFeature = (tierIndex: number, featureIndex: number, val: string) => {
    if (!pkg || !tiers[tierIndex]) return;
    const currentFeatures = [...(tiers[tierIndex].features || [])];
    currentFeatures[featureIndex] = val;
    handleUpdateTier(tierIndex, 'features', currentFeatures);
  };

  const handleRemoveTierFeature = (tierIndex: number, featureIndex: number) => {
    if (!pkg || !tiers[tierIndex]) return;
    const currentFeatures = (tiers[tierIndex].features || []).filter((_, i) => i !== featureIndex);
    handleUpdateTier(tierIndex, 'features', currentFeatures);
  };

  const handleUpdateHighlight = (index: number, val: string) => {
    if (!pkg) return;
    const updated = [...pkg.highlights];
    updated[index] = val;
    setPkg({ ...pkg, highlights: updated });
  };

  const handleUpdateInclusion = (index: number, field: 'title' | 'desc', val: string) => {
    if (!pkg || !pkg.inclusions) return;
    const updated = [...pkg.inclusions];
    updated[index] = { ...updated[index], [field]: val };
    setPkg({ ...pkg, inclusions: updated });
  };

  const handleUpdateExclusion = (index: number, val: string) => {
    if (!pkg || !pkg.exclusions) return;
    const updated = [...pkg.exclusions];
    updated[index] = val;
    setPkg({ ...pkg, exclusions: updated });
  };

  const handleAddItineraryActivity = (dayIndex: number, act: string) => {
    if (!pkg || !itinerary[dayIndex]) return;
    const currentActs = itinerary[dayIndex].activities ? [...itinerary[dayIndex].activities] : [];
    currentActs.push(act);
    handleUpdateItineraryDay(dayIndex, 'activities', currentActs);
  };

  const handleUpdateItineraryActivity = (dayIndex: number, actIndex: number, val: string) => {
    if (!pkg || !itinerary[dayIndex]) return;
    const currentActs = [...(itinerary[dayIndex].activities || [])];
    currentActs[actIndex] = val;
    handleUpdateItineraryDay(dayIndex, 'activities', currentActs);
  };

  const handleRemoveItineraryActivity = (dayIndex: number, actIndex: number) => {
    if (!pkg || !itinerary[dayIndex]) return;
    const currentActs = (itinerary[dayIndex].activities || []).filter((_, i) => i !== actIndex);
    handleUpdateItineraryDay(dayIndex, 'activities', currentActs);
  };

  const handleAddTier = () => {
    if (!pkg) return;
    const newTier: PackageTierItem = {
      tierId: `tier_${Date.now()}`,
      name: 'Deluxe Suite Package',
      hotelType: '5-Star Luxury Resort',
      pricePerPerson: pricePerPerson + 4000,
      originalPrice: pricePerPerson + 7000,
      features: ['Upgraded Suite', 'Buffet Breakfast & Dinner', 'Private Excursions Pass'],
    };
    setPkg({
      ...pkg,
      tiers: [...tiers, newTier],
    });
    setSelectedTierIndex(tiers.length);
  };

  const handleUpdateTier = (index: number, field: keyof PackageTierItem, value: any) => {
    if (!pkg) return;
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setPkg({ ...pkg, tiers: updated });
  };

  const handleRemoveTier = (index: number) => {
    if (!pkg || tiers.length <= 1) {
      toast.warning('Package must have at least one pricing tier.', 'Action Blocked');
      return;
    }
    const updated = tiers.filter((_, i) => i !== index);
    setPkg({ ...pkg, tiers: updated });
    if (selectedTierIndex >= updated.length) {
      setSelectedTierIndex(0);
    }
  };

  const handleAddItineraryDay = () => {
    if (!pkg) return;
    const newDay = {
      day: itinerary.length + 1,
      title: `Day ${itinerary.length + 1}: Adventure & Sightseeing`,
      desc: 'Exciting activities, curated local dining, and relaxing leisure time.',
      activities: ['Guided Excursion', 'Local Sightseeing'],
      meals: 'Breakfast & Dinner Included',
      stay: 'Resort Stay',
    };
    setPkg({
      ...pkg,
      itinerary: [...itinerary, newDay],
    });
  };

  const handleUpdateItineraryDay = (index: number, field: string, val: any) => {
    if (!pkg) return;
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: val };
    setPkg({ ...pkg, itinerary: updated });
  };

  const handleRemoveItineraryDay = (index: number) => {
    if (!pkg || itinerary.length <= 1) return;
    const updated = itinerary.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
    setPkg({ ...pkg, itinerary: updated });
  };

  const handleAddHighlight = () => {
    if (!newHighlight.trim() || !pkg) return;
    setPkg({ ...pkg, highlights: [...pkg.highlights, newHighlight.trim()] });
    setNewHighlight('');
  };

  const handleRemoveHighlight = (idx: number) => {
    if (!pkg) return;
    setPkg({ ...pkg, highlights: pkg.highlights.filter((_, i) => i !== idx) });
  };

  const handleAddInclusion = () => {
    if (!newInclusion.trim() || !pkg) return;
    const current = pkg.inclusions || [];
    setPkg({
      ...pkg,
      inclusions: [...current, { title: newInclusion.trim(), desc: 'Included in package' }],
    });
    setNewInclusion('');
  };

  const handleRemoveInclusion = (idx: number) => {
    if (!pkg || !pkg.inclusions) return;
    setPkg({
      ...pkg,
      inclusions: pkg.inclusions.filter((_, i) => i !== idx),
    });
  };

  const handleAddExclusion = () => {
    if (!newExclusion.trim() || !pkg) return;
    const current = pkg.exclusions || [];
    setPkg({
      ...pkg,
      exclusions: [...current, newExclusion.trim()],
    });
    setNewExclusion('');
  };

  const handleRemoveExclusion = (idx: number) => {
    if (!pkg || !pkg.exclusions) return;
    setPkg({
      ...pkg,
      exclusions: pkg.exclusions.filter((_, i) => i !== idx),
    });
  };

  const handleKeyHighlightChange = (index: number, field: 'name' | 'desc', val: string) => {
    if (!pkg) return;
    const current = (pkg as any).keyHighlights ? [...(pkg as any).keyHighlights] : [
      { name: '4-Star Resort Stay', desc: 'Hilltop valley view rooms' },
      { name: 'All Meals & Decor', desc: 'Candlelight dinner setup' },
      { name: 'Dedicated Chauffeur', desc: 'AC sedan sightseeing' },
      { name: 'Venna Lake Boating', desc: 'Free activity pass' },
    ];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      setPkg({ ...pkg, keyHighlights: current } as any);
    }
  };

  const handleRemoveKeyHighlight = (index: number) => {
    if (!pkg) return;
    const current = (pkg as any).keyHighlights ? [...(pkg as any).keyHighlights] : [
      { name: '4-Star Resort Stay', desc: 'Hilltop valley view rooms' },
      { name: 'All Meals & Decor', desc: 'Candlelight dinner setup' },
      { name: 'Dedicated Chauffeur', desc: 'AC sedan sightseeing' },
      { name: 'Venna Lake Boating', desc: 'Free activity pass' },
    ];
    const filtered = current.filter((_: any, i: number) => i !== index);
    setPkg({ ...pkg, keyHighlights: filtered } as any);
  };

  const handleAddKeyHighlight = () => {
    if (!pkg) return;
    const current = (pkg as any).keyHighlights ? [...(pkg as any).keyHighlights] : [
      { name: '4-Star Resort Stay', desc: 'Hilltop valley view rooms' },
      { name: 'All Meals & Decor', desc: 'Candlelight dinner setup' },
      { name: 'Dedicated Chauffeur', desc: 'AC sedan sightseeing' },
      { name: 'Venna Lake Boating', desc: 'Free activity pass' },
    ];
    setPkg({
      ...pkg,
      keyHighlights: [...current, { name: 'New Highlight', desc: 'Highlight description' }],
    } as any);
  };

  const handlePolicyChange = (field: string, val: any) => {
    if (!pkg) return;
    setPkg({
      ...pkg,
      policies: {
        ...((pkg as any).policies || {}),
        [field]: val,
      },
    } as any);
  };

  const handleAddSuitabilityRule = () => {
    if (!pkg) return;
    const current = (pkg as any).policies?.suitabilityRules ? [...(pkg as any).policies.suitabilityRules] : [
      'Suitable for senior citizens and children',
      'Verified chauffeur with background check',
      'Emergency first-aid kit onboard',
    ];
    setPkg({
      ...pkg,
      policies: {
        ...((pkg as any).policies || {}),
        suitabilityRules: [...current, 'New safety & suitability rule'],
      },
    } as any);
  };

  const handleRemoveSuitabilityRule = (index: number) => {
    if (!pkg) return;
    const current = (pkg as any).policies?.suitabilityRules ? [...(pkg as any).policies.suitabilityRules] : [
      'Suitable for senior citizens and children',
      'Verified chauffeur with background check',
      'Emergency first-aid kit onboard',
    ];
    setPkg({
      ...pkg,
      policies: {
        ...((pkg as any).policies || {}),
        suitabilityRules: current.filter((_: any, i: number) => i !== index),
      },
    } as any);
  };

  const handleUpdateSuitabilityRule = (index: number, val: string) => {
    if (!pkg) return;
    const current = (pkg as any).policies?.suitabilityRules ? [...(pkg as any).policies.suitabilityRules] : [
      'Suitable for senior citizens and children',
      'Verified chauffeur with background check',
      'Emergency first-aid kit onboard',
    ];
    current[index] = val;
    setPkg({
      ...pkg,
      policies: {
        ...((pkg as any).policies || {}),
        suitabilityRules: current,
      },
    } as any);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim() || !pkg) return;
    setPkg({
      ...pkg,
      images: [...allPhotos, newImageUrl.trim()],
    });
    setNewImageUrl('');
    setShowAddImage(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !pkg) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const res = await uploadImageToCloudinary(file, 'listing_media');
        if (res?.url) uploadedUrls.push(res.url);
      }
      if (uploadedUrls.length) {
        setPkg({
          ...pkg,
          images: [...allPhotos, ...uploadedUrls],
        });
        toast.success(`Uploaded ${uploadedUrls.length} photo(s)`, 'Gallery Updated');
        setUploadSuccessToast(`Uploaded ${uploadedUrls.length} photo(s)`);
        setTimeout(() => setUploadSuccessToast(null), 4000);
      }
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message || 'Please try again'}`, 'Upload Failed');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (!pkg || allPhotos.length <= 1) return;
    const updated = allPhotos.filter((_, i) => i !== indexToRemove);
    setPkg({ ...pkg, images: updated });
    if (activePhotoIndex >= updated.length) {
      setActivePhotoIndex(0);
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

  const requestDeleteTier = (index: number) => {
    if (!pkg || tiers.length <= 1) {
      toast.warning('Package must have at least one pricing tier.', 'Action Blocked');
      return;
    }
    const tier = tiers[index];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Package Tier?',
      itemName: tier.name,
      message: (
        <p>
          Are you sure you want to delete tier <strong className="text-slate-800 dark:text-slate-200">{tier.name}</strong>?
          This pricing option will be permanently removed from this package.
        </p>
      ),
      onConfirm: () => {
        handleRemoveTier(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteItineraryDay = (index: number) => {
    if (!pkg || itinerary.length <= 1) return;
    const dayItem = itinerary[index];
    setConfirmDeleteState({
      isOpen: true,
      title: `Delete Day ${dayItem.day} Itinerary?`,
      itemName: dayItem.title,
      message: (
        <p>
          Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">Day {dayItem.day}: {dayItem.title}</strong> from this tour package?
        </p>
      ),
      onConfirm: () => {
        handleRemoveItineraryDay(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteImage = (indexToRemove: number) => {
    if (!pkg || allPhotos.length <= 1) {
      toast.warning('Package must have at least one showcase photo.', 'Action Blocked');
      return;
    }
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Package Photo?',
      message: (
        <p>
          Are you sure you want to remove photo #{indexToRemove + 1} from this package showcase?
        </p>
      ),
      onConfirm: () => {
        handleRemoveImage(indexToRemove);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteInclusion = (idx: number) => {
    if (!pkg?.inclusions) return;
    const item = pkg.inclusions[idx];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Inclusion?',
      itemName: item.title,
      onConfirm: () => {
        handleRemoveInclusion(idx);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteExclusion = (idx: number) => {
    if (!pkg?.exclusions) return;
    const item = pkg.exclusions[idx];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Exclusion?',
      itemName: item,
      onConfirm: () => {
        handleRemoveExclusion(idx);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSaveChanges = async () => {
    if (!pkg) return;
    const payload: PackageItem = {
      ...pkg,
      tiers,
      itinerary,
      images: allPhotos,
    };
    try {
      await dispatch(updatePackageAsync(payload)).unwrap();
      toast.success('Package updated successfully', 'Changes Saved');
      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 3500);
      setIsEditMode(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update package', 'Save Failed');
    }
  };

  const handleApprove = async () => {
    if (!pkg) return;
    try {
      await dispatch(approvePackageAsync({ id: pkg.id, adminId: user?.id })).unwrap();
      setPkg({ ...pkg, status: 'active' });
      toast.success('Tour package approved and published', 'Package Approved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve package', 'Approval Failed');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for rejecting this tour package:');
    if (reason && pkg) {
      try {
        await dispatch(rejectPackageAsync({ id: pkg.id, reason })).unwrap();
        setPkg({ ...pkg, status: 'rejected', rejectionReason: reason });
        toast.success('Tour package rejected', 'Status Updated');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to reject package', 'Rejection Failed');
      }
    }
  };

  const guestPackageUrl = `http://localhost:3000/packages/${pkg.slug || pkg.code || pkg.id}`;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {saveSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Tour package data successfully saved to backend database!</span>
        </div>
      )}

      {/* ─── Top Admin / Vendor Control Bar ─── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/packages"
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
              {isApproved ? 'Active Package' : isPending ? 'Pending Moderation' : 'Rejected'}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <Building className="w-3 h-3 text-slate-400" />
              <span>{pkg.vendorName || 'Holiday Concierge'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={guestPackageUrl}
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
            title="Refetch Package from Database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#ea110d]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
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
              <span className="font-bold">Package Live Edit Mode: </span>
              <span>
                You can directly edit the package title, category, duration, package tiers & pricing, itinerary days,
                inclusions, and policies. Click &quot;Save to Backend&quot; when done.
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
          <Link href="/dashboard/packages" className="hover:text-slate-900">
            Tour Packages
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{pkg.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(guestPackageUrl);
                toast.success('Copied guest package URL to clipboard!', 'Link Copied');
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

      {/* ─── Header: Title, Rating & Destination ─── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            {isEditMode ? (
              <div className="space-y-3 mb-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Package Title
                  </label>
                  <input
                    type="text"
                    value={pkg.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full text-xl sm:text-2xl font-extrabold text-slate-900 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Category
                    </label>
                    <select
                      value={pkg.category}
                      onChange={(e) => handleFieldChange('category', e.target.value as PackageCategory)}
                      className="w-full text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500 bg-white"
                    >
                      {PACKAGE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Duration (Days / Nights)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={pkg.durationDays}
                        onChange={(e) => handleFieldChange('durationDays', Number(e.target.value))}
                        className="w-16 text-xs text-slate-700 border border-slate-200 rounded-xl px-2 py-1.5"
                      />
                      <span className="text-xs">D /</span>
                      <input
                        type="number"
                        value={pkg.durationNights}
                        onChange={(e) => handleFieldChange('durationNights', Number(e.target.value))}
                        className="w-16 text-xs text-slate-700 border border-slate-200 rounded-xl px-2 py-1.5"
                      />
                      <span className="text-xs">N</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={pkg.badge || ''}
                      onChange={(e) => handleFieldChange('badge', e.target.value)}
                      placeholder="e.g. Best Seller"
                      className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">
                  {pkg.title}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold font-poppins">
                  <span className="text-amber-500">★</span>
                  <span>{pkg.rating || 4.9}</span>
                  <span className="text-amber-700 font-normal">({pkg.reviewsCount || 86} reviews)</span>
                </div>
              </div>
            )}

            {isEditMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Destination Location
                  </label>
                  <input
                    type="text"
                    value={pkg.location}
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
                    value={pkg.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-rose-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 flex-wrap">
                <MapPin className="w-4 h-4 text-[#ea110d] shrink-0" />
                <span>{pkg.location}</span>
                <span className="text-slate-300">•</span>
                <span>{pkg.city}, India</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-900">
                  {pkg.durationDays} Days / {pkg.durationNights} Nights
                </span>
              </div>
            )}

            {/* Badge Chips Row */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Award className="w-3.5 h-3.5 text-slate-700" />
                <span>{pkg.badge || 'Best Value Tour'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Building className="w-3.5 h-3.5 text-slate-700" />
                <span>Resort Stay Included</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Utensils className="w-3.5 h-3.5 text-slate-700" />
                <span>All Meals &amp; Decor</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold font-poppins">
                <Compass className="w-3.5 h-3.5 text-slate-700" />
                <span>100% Curated &amp; Hosted</span>
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
              Tour Photo Showcase ({allPhotos.length} Images)
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
          {/* Main Hero */}
          <div className="lg:col-span-7 relative rounded-[24px] overflow-hidden bg-slate-100 group h-[280px] sm:h-[420px] lg:h-full border border-slate-100 shadow-xs">
            <Image
              src={allPhotos[activePhotoIndex] || allPhotos[0]}
              alt={pkg.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

            <button
              type="button"
              onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer z-10 text-sm font-bold"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer z-10 text-sm font-bold"
            >
              ›
            </button>

            <div className="absolute bottom-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>Featured Tour View</span>
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
                  alt={`${pkg.title} thumbnail ${idx + 2}`}
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
        {/* LEFT COLUMN: Host Card, 4 Highlights, Package Tiers, Days      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Host Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="relative group shrink-0">
                {pkg.host?.avatar ? (
                  <img
                    src={pkg.host.avatar}
                    alt={pkg.host?.name || 'Host'}
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-rose-100 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0B0A06] text-white font-extrabold text-lg flex items-center justify-center font-poppins shrink-0 shadow-sm">
                    {(pkg.host?.name || 'V')[0].toUpperCase()}
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
                        value={pkg.host?.name || 'Vikramaditya & Concierge Team'}
                        onChange={(e) => handleHostChange('name', e.target.value)}
                        placeholder="Host Name"
                        className="text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Role:</span>
                      <input
                        type="text"
                        value={pkg.host?.role || 'Holiday Specialist & Concierge'}
                        onChange={(e) => handleHostChange('role', e.target.value)}
                        placeholder="Role / Subtitle"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Exp:</span>
                      <input
                        type="text"
                        value={pkg.host?.experience || '5 Years hosting'}
                        onChange={(e) => handleHostChange('experience', e.target.value)}
                        placeholder="e.g. 5 Years hosting"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Guests:</span>
                      <input
                        type="text"
                        value={pkg.host?.staysCount || '1,200+ Verified Guests'}
                        onChange={(e) => handleHostChange('staysCount', e.target.value)}
                        placeholder="e.g. 1,200+ Verified Guests"
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
                            <span>{pkg.host?.avatar ? 'Change Host Photo / Logo' : 'Upload Host Photo / Logo'}</span>
                          </>
                        )}
                      </button>
                      {pkg.host?.avatar && (
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
                      <span>Hosted by {pkg.host?.name || 'Vikramaditya & Concierge Team'}</span>
                      {(pkg.host?.verified ?? true) && (
                        <span className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0" title="Verified Host">
                          ✓
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                      {pkg.host?.role || 'Holiday Specialist & Concierge'} • {pkg.host?.experience || '5 Years hosting'} • {pkg.host?.staysCount || '1,200+ Verified Guests'}
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
                      value={pkg.host?.confirmationBadge || 'Instant Booking Confirmed'}
                      onChange={(e) => handleHostChange('confirmationBadge', e.target.value)}
                      placeholder="Badge"
                      className="text-xs font-semibold text-[#ea110d] border border-red-200 rounded-lg px-2 py-1 w-44"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkg.host?.verified ?? true}
                      onChange={(e) => handleHostChange('verified', e.target.checked)}
                      className="accent-[#ea110d]"
                    />
                    <span>Verified Badge</span>
                  </label>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/80 text-[#ea110d] text-xs font-semibold font-poppins shadow-2xs">
                  <span className="text-[#ea110d] font-bold">✓</span>
                  <span>{pkg.host?.confirmationBadge || 'Instant Booking Confirmed'}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Quick Feature Cards Strip (Dynamic: Edit / Remove / Add) ─── */}
          {(((pkg as any).keyHighlights && (pkg as any).keyHighlights.length > 0) || isEditMode) && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Key Feature Cards ({(pkg as any).keyHighlights?.length ?? 4})
                </span>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddKeyHighlight}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ea110d] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Feature Card</span>
                  </button>
                )}
              </div>
              {!isEditMode ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80">
                    {(((pkg as any).keyHighlights && (pkg as any).keyHighlights.length > 0)
                      ? (pkg as any).keyHighlights
                      : [
                          { name: '4-Star Resort Stay', desc: 'Hilltop valley view rooms' },
                          { name: 'All Meals & Decor', desc: 'Candlelight dinner setup' },
                          { name: 'Dedicated Chauffeur', desc: 'AC sedan sightseeing' },
                          { name: 'Venna Lake Boating', desc: 'Free activity pass' },
                        ]
                    ).map((hl: any, idx: number) => (
                      <div
                        key={idx}
                        title={hl.desc ? `${hl.name} • ${hl.desc}` : hl.name}
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
                          {hl.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(((pkg as any).keyHighlights && (pkg as any).keyHighlights.length > 0)
                    ? (pkg as any).keyHighlights
                    : [
                        { name: '4-Star Resort Stay', desc: 'Hilltop valley view rooms' },
                        { name: 'All Meals & Decor', desc: 'Candlelight dinner setup' },
                        { name: 'Dedicated Chauffeur', desc: 'AC sedan sightseeing' },
                        { name: 'Venna Lake Boating', desc: 'Free activity pass' },
                      ]
                  ).map((hl: any, idx: number) => (
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
                          value={hl.name}
                          onChange={(e) => handleKeyHighlightChange(idx, 'name', e.target.value)}
                          placeholder="Card Title"
                          className="text-xs font-bold text-slate-900 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                        />
                        <input
                          type="text"
                          value={hl.desc}
                          onChange={(e) => handleKeyHighlightChange(idx, 'desc', e.target.value)}
                          placeholder="Card Description"
                          className="text-[10px] text-slate-500 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyHighlight(idx)}
                        className="text-slate-400 hover:text-[#ea110d] p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Remove this card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
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
                { id: 'tiers', label: 'Package Tiers & Pricing', icon: <Award className="w-4 h-4" /> },
                { id: 'about', label: 'About & Highlights', icon: <Building className="w-4 h-4" /> },
                { id: 'facilities', label: 'Inclusions & Amenities', icon: <Sparkles className="w-4 h-4" /> },
                { id: 'itinerary', label: 'Day-wise Itinerary', icon: <ListOrdered className="w-4 h-4" /> },
                { id: 'rules', label: 'Policies & Rules', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'location', label: 'Location & Meeting Point', icon: <MapPin className="w-4 h-4" /> },
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

          {/* ─── Tab 1: Package Tiers ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'tiers') && (
          <div id="tiers" className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                  CURATED OPTIONS
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-poppins">
                  Available Package Tiers
                </h2>
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ea110d] text-white text-xs font-bold shadow-xs hover:bg-[#d00f0c] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tier</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {tiers.map((tier, idx) => {
                const isSelected = idx === selectedTierIndex;
                const tPrice = tier.pricePerPerson || pricePerPerson;
                const tOrig = tier.originalPrice || tPrice + 3000;
                const tSavings = Math.max(0, tOrig - tPrice);

                return (
                  <div
                    key={tier.tierId || idx}
                    onClick={() => setSelectedTierIndex(idx)}
                    className={`relative bg-white rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-2 border-[#ea110d] shadow-[0_4px_20px_rgba(234,17,13,0.08)] bg-red-50/10'
                        : 'border border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex-1 flex flex-col gap-1 w-full min-w-0">
                      {isEditMode ? (
                        <div className="space-y-2 mb-1">
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => handleUpdateTier(idx, 'name', e.target.value)}
                            placeholder="Tier Name (e.g. Classic Honeymoon Tier)"
                            className="text-sm font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                          />
                          <input
                            type="text"
                            value={tier.hotelType || ''}
                            onChange={(e) => handleUpdateTier(idx, 'hotelType', e.target.value)}
                            placeholder="Hotel Type (e.g. 4-Star Valley View Resort)"
                            className="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                            {tier.name}
                          </h3>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#ea110d] text-[10px] font-bold font-poppins border border-red-200">
                              Active Selection
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500">
                        {tier.hotelType || '4-Star Valley View Resort Stay Included'}
                      </p>

                      {isEditMode ? (
                        <div className="flex flex-wrap gap-1.5 pt-1.5 items-center">
                          {tier.features.map((feat, fIdx) => (
                            <div
                              key={fIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-slate-800"
                            >
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              <input
                                type="text"
                                value={feat}
                                onChange={(e) => handleUpdateTierFeature(idx, fIdx, e.target.value)}
                                className="bg-transparent border-0 p-0 text-xs font-medium text-slate-800 focus:outline-none min-w-[70px]"
                                placeholder="Feature / Inclusion"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTierFeature(idx, fIdx);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                                title="Remove feature"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTierFeature(idx, 'New Inclusion');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-red-300 bg-red-50/40 text-[11px] font-bold text-[#ea110d] hover:bg-red-50 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Feature</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tier.features.map((feat, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
                            >
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>{feat}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 gap-1.5">
                      {isEditMode ? (
                        <div className="space-y-1 text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Orig ₹:</span>
                            <input
                              type="number"
                              value={tier.originalPrice || tOrig}
                              onChange={(e) => handleUpdateTier(idx, 'originalPrice', Number(e.target.value))}
                              className="border border-slate-200 rounded px-1 py-0.5 text-xs w-20 text-right"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-600">Price ₹:</span>
                            <input
                              type="number"
                              value={tier.pricePerPerson || tPrice}
                              onChange={(e) => handleUpdateTier(idx, 'pricePerPerson', Number(e.target.value))}
                              className="border border-slate-200 rounded px-1 py-0.5 text-xs font-bold w-20 text-right"
                            />
                          </div>
                          {tiers.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteTier(idx);
                              }}
                              className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 justify-end"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-left md:text-right">
                          <span className="text-[11px] text-slate-400 line-through block font-medium">
                            ₹{tOrig.toLocaleString('en-IN')}
                          </span>
                          <div className="text-base sm:text-lg font-extrabold text-slate-900 font-poppins">
                            ₹{tPrice.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-normal text-slate-500">/ person</span>
                          </div>
                          {tSavings > 0 && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                              Save ₹{tSavings.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTierIndex(idx);
                        }}
                        className={`mt-1 px-5 py-2 rounded-xl text-xs font-bold font-poppins transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ea110d] hover:bg-[#d00f0c] text-white shadow-sm'
                            : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-800 hover:text-slate-900'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select Tier'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* ─── Tab 2: About this Package & Highlights ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'about') && (
            <div id="about" className="flex flex-col gap-4">
              <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <h3 className="text-xl font-bold text-slate-900 font-poppins mb-3">
                      About this {pkg.title}
                    </h3>

                    {isEditMode ? (
                      <div className="space-y-3 mb-4">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                          Tour Overview / Description
                        </label>
                        <textarea
                          rows={5}
                          value={pkg.description}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl p-2.5 focus:outline-rose-500"
                        />
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-roboto mb-5">
                        {pkg.description}
                      </p>
                    )}

                    {/* 4 Info Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                        {isEditMode ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number"
                              value={pkg.durationDays || 3}
                              onChange={(e) => handleFieldChange('durationDays', Number(e.target.value))}
                              className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1 py-0.5 w-10 text-center"
                            />
                            <span className="text-xs">D /</span>
                            <input
                              type="number"
                              value={pkg.durationNights || 2}
                              onChange={(e) => handleFieldChange('durationNights', Number(e.target.value))}
                              className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1 py-0.5 w-10 text-center"
                            />
                            <span className="text-xs">N</span>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {pkg.durationDays || 3}D / {pkg.durationNights || 2}N
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Destinations</div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={pkg.destinations || pkg.location || pkg.city || ''}
                            onChange={(e) => {
                              handleFieldChange('destinations', e.target.value);
                              handleFieldChange('location', e.target.value);
                            }}
                            placeholder="e.g. Mahabaleshwar & Panchgani"
                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 w-full mt-0.5"
                          />
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                            {pkg.destinations || pkg.location || pkg.city || 'Mahabaleshwar & Panchgani'}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Package Type</div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={pkg.category || 'Luxury Holiday'}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                            placeholder="e.g. Honeymoon"
                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 w-full mt-0.5"
                          />
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {pkg.category || 'Luxury Holiday'}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Ideal For</div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={pkg.idealFor || 'Families & Couples'}
                            onChange={(e) => handleFieldChange('idealFor', e.target.value)}
                            placeholder="e.g. Couples & Families"
                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 w-full mt-0.5"
                          />
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                            {pkg.idealFor || 'Families & Couples'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Tour Banner & YouTube Link Editor */}
                  <div className="md:col-span-5 flex flex-col gap-2">
                    <div
                      onClick={() => setVideoModalOpen(true)}
                      className="relative rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 group cursor-pointer border border-slate-200 shadow-sm"
                    >
                      <Image
                        src={getYouTubeThumbnailUrl(pkg.videoUrl, allPhotos[1] || allPhotos[0])}
                        alt="Tour Preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
                      <div className="absolute bottom-3 right-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                          <span className="text-[#ea110d] text-xs">▶</span>
                          <span>Watch Tour Preview</span>
                        </div>
                      </div>
                    </div>

                    {isEditMode && (
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                        <Video className="w-3.5 h-3.5 text-[#ea110d] shrink-0" />
                        <input
                          type="text"
                          value={pkg.videoUrl || ''}
                          onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                          placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                          className="w-full text-xs bg-transparent border-0 focus:outline-none font-mono text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 font-poppins">
                    Trip Highlights &amp; Key Experiences
                  </h3>
                  {isEditMode && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newHighlight}
                        onChange={(e) => setNewHighlight(e.target.value)}
                        placeholder="New highlight"
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="px-2.5 py-1 rounded-lg bg-[#ea110d] text-white text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(pkg.highlights || [
                    'Hilltop luxury villa stay with private pool',
                    'Guided sightseeing of Venna Lake & Table Land',
                    'Candlelight dinner setup with live music',
                    'Dedicated chauffeur and AC sedan for local travel',
                  ]).map((hl, hIdx) => (
                    <div
                      key={hIdx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <Sparkles className="w-4 h-4 text-[#ea110d] shrink-0 mt-0.5" />
                        {isEditMode ? (
                          <input
                            type="text"
                            value={hl}
                            onChange={(e) => handleUpdateHighlight(hIdx, e.target.value)}
                            className="text-xs text-slate-700 font-medium bg-transparent border-b border-slate-300 w-full focus:outline-none"
                          />
                        ) : (
                          <span className="text-xs text-slate-700 font-medium">{hl}</span>
                        )}
                      </div>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(hIdx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0"
                          title="Remove highlight"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 3: Facilities / Inclusions & Exclusions ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'facilities') && (
          <div id="facilities" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Inclusions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Inclusions</span>
                </h4>
              </div>

              {isEditMode && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    placeholder="e.g. Private Sightseeing Cab"
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                {(pkg.inclusions || []).map((inc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50/50 border border-emerald-100/60 text-xs text-slate-700"
                  >
                    {isEditMode ? (
                      <input
                        type="text"
                        value={inc.title}
                        onChange={(e) => handleUpdateInclusion(i, 'title', e.target.value)}
                        className="font-medium text-emerald-900 bg-transparent border-0 p-0 text-xs w-full focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium text-emerald-900">{inc.title}</span>
                    )}
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => requestDeleteInclusion(i)}
                        className="text-slate-400 hover:text-rose-600 ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Exclusions</span>
                </h4>
              </div>

              {isEditMode && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    placeholder="e.g. Personal expenses"
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddExclusion}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                {(pkg.exclusions || ['Personal expenses & laundry', 'Flights or train tickets to base city']).map(
                  (ex, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-50/40 border border-rose-100/60 text-xs text-slate-700"
                    >
                      {isEditMode ? (
                        <input
                          type="text"
                          value={ex}
                          onChange={(e) => handleUpdateExclusion(i, e.target.value)}
                          className="text-slate-700 bg-transparent border-0 p-0 text-xs w-full focus:outline-none"
                        />
                      ) : (
                        <span>{ex}</span>
                      )}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => requestDeleteExclusion(i)}
                          className="text-slate-400 hover:text-rose-600 ml-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          )}

          {/* ─── Tab 4: Day-by-Day Itinerary ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'itinerary') && (
          <div id="itinerary" className="bg-white rounded-[26px] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                  EXPERIENCE TIMELINE
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">
                  Day-by-Day Tour Itinerary ({itinerary.length} Days)
                </h3>
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleAddItineraryDay}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Day</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {itinerary.map((dayItem, dIdx) => (
                <div
                  key={dIdx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-[#ea110d] text-xs font-bold">
                      Day {dayItem.day}
                    </span>
                    {isEditMode && itinerary.length > 1 && (
                      <button
                        type="button"
                        onClick={() => requestDeleteItineraryDay(dIdx)}
                        className="text-xs text-rose-600 hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Day</span>
                      </button>
                    )}
                  </div>

                  {isEditMode ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={dayItem.title}
                        onChange={(e) => handleUpdateItineraryDay(dIdx, 'title', e.target.value)}
                        placeholder="Day Title"
                        className="text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white"
                      />
                      <textarea
                        rows={2}
                        value={dayItem.desc || ''}
                        onChange={(e) => handleUpdateItineraryDay(dIdx, 'desc', e.target.value)}
                        placeholder="Day Description"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg p-2 w-full bg-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-poppins">
                        {dayItem.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dayItem.desc}</p>
                    </div>
                  )}

                  {isEditMode ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Activities / Bullet Points:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(dayItem.activities || []).map((act, aIdx) => (
                          <div
                            key={aIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700"
                          >
                            <input
                              type="text"
                              value={act}
                              onChange={(e) => handleUpdateItineraryActivity(dIdx, aIdx, e.target.value)}
                              className="bg-transparent border-0 p-0 text-xs text-slate-700 focus:outline-none min-w-[60px]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItineraryActivity(dIdx, aIdx)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              title="Remove activity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddItineraryActivity(dIdx, 'New Activity')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-red-300 bg-red-50/40 text-[10px] font-bold text-[#ea110d] hover:bg-red-50 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Activity</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    dayItem.activities && dayItem.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {dayItem.activities.map((act, aIdx) => (
                          <span
                            key={aIdx}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-medium"
                          >
                            • {act}
                          </span>
                        ))}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          {/* ─── Tab 5: Policies & Rules ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'rules') && (
            <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
                  Package Policies &amp; Rules
                </h3>
                <p className="text-xs text-slate-500 font-roboto">
                  Review and customize pickup timings, cancellation terms, and travel guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Confirmation & Pickup */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-poppins">Confirmation &amp; Pickup</div>
                    <div className="text-[11px] text-slate-600 mt-2 space-y-1.5">
                      {isEditMode ? (
                        <>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Pickup Timing</label>
                            <input
                              type="text"
                              value={(pkg as any).policies?.pickupTiming || '08:30 AM onwards'}
                              onChange={(e) => handlePolicyChange('pickupTiming', e.target.value)}
                              className="text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Drop-off Timing</label>
                            <input
                              type="text"
                              value={(pkg as any).policies?.dropoffTiming || `06:00 PM on Day ${(pkg as any).durationDays || 3}`}
                              onChange={(e) => handlePolicyChange('dropoffTiming', e.target.value)}
                              className="text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Pickup Note</label>
                            <input
                              type="text"
                              value={(pkg as any).policies?.pickupNote || 'Doorstep pickup available in Panchgani / Mahabaleshwar'}
                              onChange={(e) => handlePolicyChange('pickupNote', e.target.value)}
                              className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p>Pickup: {(pkg as any).policies?.pickupTiming || '08:30 AM onwards'}</p>
                          <p>Drop-off: {(pkg as any).policies?.dropoffTiming || `06:00 PM on Day ${(pkg as any).durationDays || 3}`}</p>
                          <p className="text-slate-400">
                            {(pkg as any).policies?.pickupNote || 'Doorstep pickup available in Panchgani'}
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
                      <p className="font-semibold text-emerald-700">100% Full Refund Option</p>
                      {isEditMode ? (
                        <textarea
                          rows={3}
                          value={
                            (pkg as any).cancellationPolicy ||
                            (pkg as any).policies?.cancellationPolicy ||
                            'Cancel up to 48 hours prior to start date with zero fee.'
                          }
                          onChange={(e) => {
                            handlePolicyChange('cancellationPolicy', e.target.value);
                            setPkg({ ...pkg, cancellationPolicy: e.target.value });
                          }}
                          className="text-xs text-slate-700 border border-slate-200 rounded-lg p-2 w-full bg-white focus:outline-rose-500"
                        />
                      ) : (
                        <p>
                          {(pkg as any).cancellationPolicy ||
                            (pkg as any).policies?.cancellationPolicy ||
                            'Cancel up to 48 hours prior to start date with zero fee.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Suitability & Safety */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-slate-900 font-poppins">Suitability &amp; Safety</div>
                      </div>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={handleAddSuitabilityRule}
                          className="text-[11px] font-bold text-[#ea110d] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1.5 mt-2">
                      {((pkg as any).policies?.suitabilityRules || [
                        'Suitable for senior citizens and children',
                        'Verified chauffeur with background check',
                        'Emergency first-aid kit onboard',
                      ]).map((rule: string, idx: number) => (
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
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <p>• {rule}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 4: Documents Required */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-poppins">Documents Required</div>
                    <div className="text-[11px] text-slate-600 mt-2 space-y-1.5">
                      {isEditMode ? (
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Travel Documents Note</label>
                          <input
                            type="text"
                            value={(pkg as any).policies?.documentsNote || 'Government photo ID & digital voucher'}
                            onChange={(e) => handlePolicyChange('documentsNote', e.target.value)}
                            className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                          />
                        </div>
                      ) : (
                        <>
                          <p>• {(pkg as any).policies?.documentsNote || 'Government photo ID for all travelers'}</p>
                          <p>• Digital booking voucher</p>
                          <p>• Safe travel guarantee included</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 6: Location & Meeting Point ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'location') && (
            <div id="location">
              <LocationMapPicker
                propertyName={pkg.title}
                locationArea={pkg.location || pkg.city || 'Panchgani & Mahabaleshwar'}
                initialCoordinates={{
                  lat: pkg.address?.lat || 17.9242,
                  lng: pkg.address?.lng || 73.8015,
                  fullAddress: pkg.address?.fullAddress || pkg.location || pkg.city,
                  mapLink: pkg.address?.mapLink || `https://www.google.com/maps?q=17.9242,73.8015`,
                }}
                isEditMode={isEditMode}
                nearbyAttractions={pkg.nearbyAttractions || [
                  { name: 'Panchgani Bus Depot', distance: '1.2 km • 5 mins', desc: 'Complimentary pickup point' },
                  { name: 'Venna Lake Boating Jetty', distance: '3.5 km • 10 mins', desc: 'Activity starting point' },
                  { name: 'Table Land Plateau', distance: '2.4 km • 7 mins drive', desc: "Asia's 2nd largest volcanic plateau" },
                ]}
                onChange={(coords) => {
                  setPkg((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      location: coords.fullAddress || prev.location,
                      address: {
                        lat: coords.lat,
                        lng: coords.lng,
                        fullAddress: coords.fullAddress || prev.address?.fullAddress || prev.location || '',
                        mapLink: coords.mapLink || `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
                      },
                    };
                  });
                }}
                onAttractionsChange={(attractions) => {
                  setPkg((prev) => (prev ? { ...prev, nearbyAttractions: attractions } : prev));
                }}
              />
            </div>
          )}

          {/* ─── Tab 7: Host & Reviews ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'reviews') && (
            <div id="reviews" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins flex items-center gap-2">
                    <span>Tour Reviews &amp; Ratings</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                      ★ {pkg.rating || 4.95} / 5.0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto mt-0.5">
                    Based on {pkg.reviewsCount || 84} verified traveler experiences
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-poppins">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>100% Verified Traveler Reviews</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Itinerary Pacing', score: '5.0' },
                  { label: 'Chauffeur & Vehicle', score: '4.9' },
                  { label: 'Food & Dining', score: '4.9' },
                  { label: 'Sightseeing & Entry', score: '5.0' },
                  { label: 'Host Assistance', score: '4.9' },
                  { label: 'Value for Money', score: '4.8' },
                ].map((cat, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">{cat.label}</span>
                      <span className="text-slate-900 font-bold">{cat.score}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full w-[96%]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-2">
                {[
                  {
                    name: 'Rahul Deshmukh',
                    date: 'October 2026',
                    rating: 5,
                    comment: 'Flawlessly planned package! The villa stay was super luxurious and our chauffeur Vikram knew all the scenic spots without any rush.',
                  },
                  {
                    name: 'Sneha & Rohan',
                    date: 'September 2026',
                    rating: 5,
                    comment: 'Celebrated our anniversary with this package. The candlelight dinner setup and lakeside boat ride were unforgettable.',
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
        {/* RIGHT COLUMN: Sticky Calculation Card                          */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 sticky top-6 z-20">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">
                  ₹{pricePerPerson.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-normal"> / person</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 line-through block font-poppins">
                  ₹{originalPricePerPerson.toLocaleString('en-IN')}
                </span>
                {savingsPerPerson > 0 && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                    Save ₹{savingsPerPerson.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                  SELECTED TIER
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins truncate max-w-[210px]">
                  {selectedTier.name}
                </div>
              </div>
              <span className="text-xs font-bold text-[#ea110d] font-poppins">Active</span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/40 flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Travelers</div>
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

            <button
              type="button"
              onClick={() => toast.info(`Simulating package booking for ${pkg.title}.`, 'Booking Preview')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Reserve &amp; Book Package</span>
              <span>→</span>
            </button>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pricing Breakdown</span>
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
                    <span>Package Pricing &amp; Fees</span>
                    <span className="text-[10px] text-amber-600 font-normal">Saves on &ldquo;Save to Backend&rdquo;</span>
                  </div>

                  {/* 0. Pricing Model (Per Person vs Per Night) */}
                  <div className="space-y-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Price Model</span>
                      <span className="text-[10px] text-rose-600 font-bold uppercase">{pkg.priceType || 'per_person'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPkg({ ...pkg, priceType: 'per_person' })}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                          (pkg.priceType || 'per_person') === 'per_person'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        👤 Per Person
                      </button>
                      <button
                        type="button"
                        onClick={() => setPkg({ ...pkg, priceType: 'per_night' })}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                          pkg.priceType === 'per_night'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        🌙 Per Night / Flat
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {(pkg.priceType || 'per_person') === 'per_person'
                        ? 'Price multiplies with each person added.'
                        : 'Flat package price per night with maximum guest limit.'}
                    </p>
                  </div>

                  {/* 0B. Person Limit */}
                  <div className="space-y-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Person Limit (Max Guests)</span>
                      <span className="text-[10px] text-slate-400">Capacity</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={pkg.personLimit || 6}
                        onChange={(e) => setPkg({ ...pkg, personLimit: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">travelers limit</span>
                    </div>
                  </div>

                  {/* 1. Discount Percentage */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Member Discount (%)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{discountPercent}%</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => handlePricingRuleChange('memberDiscountPercent', Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {[0, 8, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handlePricingRuleChange('memberDiscountPercent', pct)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              discountPercent === pct ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {pct === 0 ? 'None' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Concierge & Booking Fee */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Concierge &amp; Booking Fee (₹)</span>
                      <span className={`text-[10px] font-bold ${includeCleaningFee ? 'text-slate-700 dark:text-slate-300' : 'text-red-500 line-through'}`}>
                        {includeCleaningFee ? `₹${conciergeFee}` : 'Fee Removed'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          disabled={!includeCleaningFee}
                          value={configuredFee}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            handlePricingRuleChange('cleaningFee', val);
                          }}
                          className={`w-full pl-6 pr-2 py-1.5 rounded-xl border text-xs font-bold ${
                            includeCleaningFee ? 'bg-white dark:bg-slate-900 border-slate-200' : 'bg-slate-100 text-slate-400 line-through'
                          }`}
                        />
                      </div>
                      {includeCleaningFee ? (
                        <button
                          type="button"
                          onClick={() => {
                            handlePricingRuleChange('includeCleaningFee', false);
                            handlePricingRuleChange('cleaningFee', 0);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
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
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. GST Rate */}
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
                        className="w-20 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-xs font-bold"
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
                              gstPercent === g && (g === 0 || includeGst) ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {g === 0 ? 'Exempt' : `${g}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Person Limit Exceeded Warning */}
              {adults + children > personLimit && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <span className="font-bold block">⚠️ Traveler limit exceeded!</span>
                  <span>This package is limited to {personLimit} guests ({isPerNight ? 'per-night flat rate' : 'max capacity'}). You have {adults + children} travelers.</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>
                  {isPerNight
                    ? `₹${pricePerPerson.toLocaleString('en-IN')} / night × ${Math.max(1, pkg.durationNights || 1)} nights (flat up to ${personLimit} guests)`
                    : `₹${pricePerPerson.toLocaleString('en-IN')} × ${adults} adults${children > 0 ? ` + ${children} kids` : ''}`}
                </span>
                <span className="text-slate-900 font-semibold">₹{baseCost.toLocaleString('en-IN')}</span>
              </div>

              {memberDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Member Discount ({discountPercent}%)</span>
                  <span>-₹{memberDiscount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Member Discount</span>
                  <span>₹0 (None)</span>
                </div>
              )}

              {includeCleaningFee && conciergeFee > 0 ? (
                <div className="flex justify-between">
                  <span>Concierge &amp; Booking Fee</span>
                  <span className="text-slate-900 font-semibold">₹{conciergeFee.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Concierge &amp; Booking Fee</span>
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

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% Verified Package Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Free Cancellation up to 48 hours prior</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
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
        videoUrl={pkg.videoUrl}
        title={`Tour Preview: ${pkg.title}`}
        isEditMode={isEditMode}
        onUpdateUrl={(newUrl) => handleFieldChange('videoUrl', newUrl)}
      />
    </div>
  );
}
