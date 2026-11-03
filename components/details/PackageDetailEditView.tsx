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
} from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/upload';
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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Booking preview calculator states
  const [startDate, setStartDate] = useState('2026-10-15');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

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
    : [
        pkg.thumbnail || 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
      ];

  const tiers: PackageTierItem[] = pkg.tiers && pkg.tiers.length > 0
    ? pkg.tiers
    : [
        {
          tierId: 'classic',
          name: 'Classic Honeymoon Tier',
          hotelType: '4-Star Valley View Resort',
          pricePerPerson: pkg.numericPrice || 8500,
          originalPrice: (pkg.numericPrice || 8500) + 3000,
          features: ['Executive Valley Suite', 'Daily Breakfast & Dinner', 'Private Cab for 3 Days', 'Candlelight Dinner Setup'],
        },
        {
          tierId: 'premium',
          name: 'Royal Heritage Villa Tier',
          hotelType: '5-Star Standalone Pool Villa',
          pricePerPerson: (pkg.numericPrice || 8500) + 5500,
          originalPrice: (pkg.numericPrice || 8500) + 9000,
          features: ['Private Heated Pool', 'Chef on Demand All Meals', 'Luxury SUV Chauffeur', 'Arthur Seat Valley Free Pass'],
        },
      ];

  const itinerary = pkg.itinerary && pkg.itinerary.length > 0
    ? pkg.itinerary
    : [
        {
          day: 1,
          title: 'Arrival, Sunset Point & Romantic Candlelight Dinner',
          desc: 'Private pickup from Pune/Mumbai, check-in to resort, evening visit to Bombay Point followed by 4-course candlelight dinner.',
          activities: ['Private Chauffeur Pickup', 'Welcome Drink & Fruit Basket', 'Sunset at Bombay Point', 'Candlelight Dinner'],
          meals: 'Dinner Included',
          stay: '4-Star Valley Resort',
        },
        {
          day: 2,
          title: 'Arthur Seat Trek, Strawberry Farms & Boating',
          desc: 'Morning valley excursion to Arthur Seat and Window Point, visit Mapro Garden for strawberry picking, sunset boating at Venna Lake.',
          activities: ['Arthur Seat Excursion', 'Mapro Garden Strawberry Tasting', 'Private Shikara Boating at Venna Lake'],
          meals: 'Breakfast & Dinner Included',
          stay: '4-Star Valley Resort',
        },
        {
          day: 3,
          title: 'Pratapgad Fort Heritage Tour & Departure',
          desc: 'Morning breakfast with Sahyadri view, guided heritage exploration of Pratapgad Fort, souvenir shopping in market, and return drop.',
          activities: ['Guided Fort Tour', 'Mahabaleshwar Market Spices & Honey', 'Return Drop-off'],
          meals: 'Breakfast Included',
          stay: 'Checkout at 11:00 AM',
        },
      ];

  const selectedTier = tiers[selectedTierIndex] || tiers[0];
  const pricePerPerson = selectedTier.pricePerPerson || pkg.numericPrice || 8500;
  const originalPricePerPerson = selectedTier.originalPrice || pricePerPerson + 3000;
  const savingsPerPerson = Math.max(0, originalPricePerPerson - pricePerPerson);

  const baseCost = pricePerPerson * Math.max(1, adults) + Math.round(pricePerPerson * 0.6) * children;
  const memberDiscount = Math.round(baseCost * 0.08);
  const conciergeFee = 445;
  const taxesGst = Math.round((baseCost - memberDiscount + conciergeFee) * 0.05);
  const grandTotal = baseCost - memberDiscount + conciergeFee + taxesGst;

  const handleFieldChange = (field: keyof PackageItem, value: any) => {
    setPkg((prev) => (prev ? { ...prev, [field]: value } : prev));
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
      alert('Package must have at least one pricing tier.');
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
    const file = e.target.files?.[0];
    if (!file || !pkg) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) {
        setPkg({
          ...pkg,
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
      alert('Package must have at least one pricing tier.');
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
      alert('Package must have at least one showcase photo.');
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
    await dispatch(updatePackageAsync(payload));
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3500);
    setIsEditMode(false);
  };

  const handleApprove = async () => {
    if (!pkg) return;
    await dispatch(approvePackageAsync({ id: pkg.id, adminId: user?.id }));
    setPkg({ ...pkg, status: 'active' });
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for rejecting this tour package:');
    if (reason && pkg) {
      await dispatch(rejectPackageAsync({ id: pkg.id, reason }));
      setPkg({ ...pkg, status: 'rejected', rejectionReason: reason });
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
                alert('Copied guest package URL to clipboard!');
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
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#0B0A06] text-white font-extrabold text-lg flex items-center justify-center font-poppins shrink-0 shadow-sm">
                V
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                  <span>Hosted by Vikramaditya &amp; Concierge Team</span>
                  <span className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    ✓
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                  Holiday Specialist &amp; Concierge • 5 Years hosting • 1,200+ Verified Guests
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/80 text-[#ea110d] text-xs font-semibold self-start sm:self-auto font-poppins shadow-2xs">
              <span className="text-[#ea110d] font-bold">✓</span>
              <span>Instant Booking Confirmed</span>
            </div>
          </div>

          {/* Quick 4-Column Highlights Strip */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Building className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-poppins">4-Star Resort Stay</div>
                <div className="text-[10px] text-slate-500">Hilltop valley view rooms</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Utensils className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-poppins">All Meals &amp; Decor</div>
                <div className="text-[10px] text-slate-500">Candlelight dinner setup</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-poppins">Dedicated Chauffeur</div>
                <div className="text-[10px] text-slate-500">AC sedan sightseeing</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Compass className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-poppins">Venna Lake Boating</div>
                <div className="text-[10px] text-slate-500">Free activity pass</div>
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
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          {pkg.durationDays || 3}D / {pkg.durationNights || 2}N
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Destinations</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                          {pkg.location || pkg.city || 'Mahabaleshwar & Panchgani'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Package Type</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          {pkg.category || 'Luxury Holiday'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Ideal For</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                          Families &amp; Couples
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Tour Banner */}
                  <div className="md:col-span-5 relative rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 group cursor-pointer border border-slate-200">
                    <Image
                      src={allPhotos[1] || allPhotos[0]}
                      alt="Tour Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-3 right-3">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                        <span className="text-[#ea110d] text-xs">▶</span>
                        <span>Watch Tour Preview</span>
                      </div>
                    </div>
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
                        className="px-2.5 py-1 rounded-lg bg-[#ea110d] text-white text-xs font-bold"
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
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#ea110d] shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 font-medium">{hl}</span>
                      </div>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(hIdx)}
                          className="text-slate-400 hover:text-rose-600"
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
                    <span className="font-medium text-emerald-900">{inc.title}</span>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => requestDeleteInclusion(i)}
                        className="text-slate-400 hover:text-rose-600 ml-2"
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
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold"
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
                      <span>{ex}</span>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => requestDeleteExclusion(i)}
                          className="text-slate-400 hover:text-rose-600 ml-2"
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

                  {dayItem.activities && dayItem.activities.length > 0 && (
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
                  Please review Mahastays transparent tour guidelines before booking
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Confirmation &amp; Pickup</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p>Pickup: 08:30 AM onwards</p>
                    <p>Drop-off: 06:00 PM on Day 3</p>
                    <p className="text-slate-400">Doorstep pickup available in Panchgani</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Cancellation Policy</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p className="font-semibold text-emerald-700">100% Full Refund</p>
                    <p>Cancel up to 48 hours prior to start date with zero fee.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Suitability &amp; Safety</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p>• Suitable for senior citizens and children</p>
                    <p>• Verified chauffeur with background check</p>
                    <p>• Emergency first-aid kit onboard</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Documents Required</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p>• Government photo ID for all travelers</p>
                    <p>• Digital booking voucher</p>
                    <p>• Safe travel guarantee included</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 6: Location & Meeting Point ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'location') && (
            <div id="location" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins">
                    Location &amp; Meeting Point
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto mt-0.5">
                    {pkg.location || pkg.city || 'Panchgani & Mahabaleshwar, Maharashtra'}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pkg.title + ' ' + (pkg.location || pkg.city || 'Mahabaleshwar'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-poppins transition"
                >
                  <span>Open in Maps</span>
                  <span>↗</span>
                </a>
              </div>

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
                    {pkg.title}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {[
                  { name: 'Panchgani Bus Depot', distance: '1.2 km • 5 mins', desc: 'Complimentary pickup point' },
                  { name: 'Venna Lake Boating Jetty', distance: '3.5 km • 10 mins', desc: 'Activity starting point' },
                  { name: 'Pune Airport / Station', distance: '105 km • 2.5 hrs', desc: 'Airport transfer available on request' },
                ].map((pt, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-900 font-poppins">{pt.name}</div>
                    <div className="text-[11px] font-semibold text-[#ea110d] mt-0.5">{pt.distance}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{pt.desc}</div>
                  </div>
                ))}
              </div>
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
              onClick={() => alert(`Simulating package booking for ${pkg.title}.`)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Reserve &amp; Book Package</span>
              <span>→</span>
            </button>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>
                  ₹{pricePerPerson.toLocaleString('en-IN')} × {adults} adults
                </span>
                <span className="text-slate-900 font-semibold">₹{baseCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Member Discount (8%)</span>
                <span>-₹{memberDiscount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Concierge &amp; Booking Fee</span>
                <span className="text-slate-900 font-semibold">₹{conciergeFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes &amp; GST (5%)</span>
                <span className="text-slate-900 font-semibold">₹{taxesGst.toLocaleString('en-IN')}</span>
              </div>
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
    </div>
  );
}
