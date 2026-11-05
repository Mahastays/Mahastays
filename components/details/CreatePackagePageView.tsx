'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Compass,
  Calendar,
  Sparkles,
  Video,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
  Clock,
  MapPin,
  Building2,
  Save,
  Layers,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useAppDispatch } from '@/store/hooks';
import { createPackageAsync } from '@/store/slices/packagesSlice';
import { uploadImageToCloudinary } from '@/lib/upload';
import { PackageItem, PackageCategory, PackageType, PackageTierItem } from '@/types';

const PACKAGE_CATEGORIES: PackageCategory[] = [
  'Honeymoon',
  'Luxury',
  'Adventure',
  'Heritage',
];

const PACKAGE_TYPES: { value: PackageType; label: string }[] = [
  { value: 'couple', label: 'Couple / Honeymoon Romantic Special' },
  { value: 'bachelor_party', label: 'Friends & Bachelor Party Getaway' },
  { value: 'corporate', label: 'Corporate Retreat & Offsite' },
  { value: 'birthday', label: 'Birthday & Anniversary Celebration' },
];

export default function CreatePackagePageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { user, activeViewMode } = useAuth();
  const { vendors, properties } = useData();

  const isAdmin = activeViewMode === 'admin';
  const preselectedVendorId = searchParams?.get('vendorId') || '';

  // Vendor / Host assignment state
  const [selectedVendorId, setSelectedVendorId] = useState<string>(() => {
    if (isAdmin) {
      if (preselectedVendorId) return preselectedVendorId;
      return vendors[0]?.id || '';
    }
    return user?.vendorId || user?.id || '';
  });

  useEffect(() => {
    if (isAdmin && !selectedVendorId && vendors.length > 0) {
      setSelectedVendorId(preselectedVendorId || vendors[0].id);
    }
  }, [isAdmin, selectedVendorId, vendors, preselectedVendorId]);

  const activeVendor = vendors.find((v) => v.id === selectedVendorId || v.vendorCode === selectedVendorId);

  // Associated property
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');

  // Form Fields State
  const [title, setTitle] = useState('');
  const [packageType, setPackageType] = useState<PackageType>('couple');
  const [category, setCategory] = useState<PackageCategory>('Honeymoon');
  const [badge, setBadge] = useState('All-Inclusive Romantic Special');
  const [durationDays, setDurationDays] = useState('3');
  const [durationNights, setDurationNights] = useState('2');
  const [numericPrice, setNumericPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [city, setCity] = useState('Mahabaleshwar');
  const [location, setLocation] = useState('Venna Lake Road, Mahabaleshwar');
  const [destinations, setDestinations] = useState('Plot 12, Venna Lake & Panchgani Viewpoints');
  const [idealFor, setIdealFor] = useState('Families & Couples');
  const [shortDesc, setShortDesc] = useState('');
  const [overview, setOverview] = useState('');

  // Pricing, Discounts & GST Rules
  const [memberDiscountPercent, setMemberDiscountPercent] = useState('8');
  const [includeCleaningFee, setIncludeCleaningFee] = useState(false);
  const [cleaningFeeAmount, setCleaningFeeAmount] = useState('0');
  const [gstPercentRate, setGstPercentRate] = useState('18');

  // Media & Upload States
  const [thumbnail, setThumbnail] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const thumbnailInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingThumbnail(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) setThumbnail(res.url);
    } catch (err: any) {
      alert(`Thumbnail upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setIsUploadingGallery(true);
      const uploaded: string[] = [];
      for (const file of files) {
        const res = await uploadImageToCloudinary(file, 'listing_media');
        if (res?.url) uploaded.push(res.url);
      }
      if (uploaded.length) {
        setGalleryImages((prev) => [...prev, ...uploaded]);
      }
    } catch (err: any) {
      alert(`Gallery upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Highlights Bullets
  const [highlights, setHighlights] = useState<string[]>([
    'Resort stay with lake view & private balcony',
    'Daily breakfast & candlelight dinner with wine',
    'Complimentary Venna lake sunset boating passes',
    'Chauffeured AC sedan for all local sightseeing points',
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  // Tiers & Pricing
  const [tierName, setTierName] = useState('Romantic Couple All-Inclusive');
  const [tierHotelType, setTierHotelType] = useState('4-Star Valley View Resort Stay Included');
  const [tierPrice, setTierPrice] = useState('');
  const [tierFeatures, setTierFeatures] = useState<string[]>([
    'Resort Room',
    'All Meals Included',
    'Private Sunset Boating',
    'Spa Credit Voucher',
  ]);
  const [newTierFeature, setNewTierFeature] = useState('');

  // Inclusions & Exclusions
  const [inclusions, setInclusions] = useState<Array<{ title: string; desc: string }>>([
    { title: '4-Star Resort Stay', desc: 'Hilltop valley view rooms with balcony' },
    { title: 'All Meals & Decor', desc: 'Breakfast, lunch & romantic candlelight dinner setup' },
    { title: 'Dedicated Chauffeur', desc: 'Private AC sedan for all scenic point tours' },
    { title: 'Venna Lake Boating', desc: 'Complimentary activity pass included' },
  ]);
  const [newIncTitle, setNewIncTitle] = useState('');
  const [newIncDesc, setNewIncDesc] = useState('');

  const [exclusions, setExclusions] = useState<string[]>([
    'Personal expenses, laundry, and telephone charges',
    'Entry tickets to viewpoints and monuments not specified',
    'Airfare / Train tickets to arrival destination',
  ]);
  const [newExclusion, setNewExclusion] = useState('');

  // Itinerary
  const [itinerary, setItinerary] = useState<Array<{ day: number; title: string; desc: string }>>([
    { day: 1, title: 'Arrival & Romantic Candlelight Dinner', desc: 'Check in to the resort, relax by the infinity pool, and enjoy a private 4-course dinner setup overlooking the misty valley.' },
    { day: 2, title: 'Panoramic Sightseeing & Venna Lake Sunset Boating', desc: 'Visit Arthur Seat, Elphinstone Point, and Mapro Garden followed by private sunset boating at Venna Lake.' },
    { day: 3, title: 'Pratapgad Fort Heritage & Farewell', desc: 'Explore historic Pratapgad Fort and local strawberry markets before departure.' },
  ]);

  // Host / Concierge Information
  const [hostName, setHostName] = useState('');
  const [hostRole, setHostRole] = useState('Holiday Specialist & Concierge');
  const [hostExperience, setHostExperience] = useState('5 Years Hosting • 1,200+ Verified Guests');
  const [hostBio, setHostBio] = useState('Specializing in bespoke couples retreats and curated hill station experiences.');
  const [hostAvatar, setHostAvatar] = useState('');
  const [isUploadingHostAvatar, setIsUploadingHostAvatar] = useState(false);
  const hostAvatarInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleHostAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHostAvatar(true);
    try {
      const res = await uploadImageToCloudinary(file, 'avatar');
      setHostAvatar(res.url);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload host avatar');
    } finally {
      setIsUploadingHostAvatar(false);
    }
  };

  useEffect(() => {
    if (activeVendor) {
      setHostName(activeVendor.displayName || activeVendor.businessName || '');
      if (activeVendor.avatarUrl && !hostAvatar) {
        setHostAvatar(activeVendor.avatarUrl);
      }
    } else if (!isAdmin && user) {
      setHostName(user.name || user.businessName || 'Holiday Concierge');
    }
  }, [activeVendor, isAdmin, user]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const handleAddTierFeature = () => {
    if (newTierFeature.trim()) {
      setTierFeatures([...tierFeatures, newTierFeature.trim()]);
      setNewTierFeature('');
    }
  };

  const handleRemoveTierFeature = (idx: number) => {
    setTierFeatures(tierFeatures.filter((_, i) => i !== idx));
  };

  const handleAddInclusion = () => {
    if (newIncTitle.trim()) {
      setInclusions([...inclusions, { title: newIncTitle.trim(), desc: newIncDesc.trim() }]);
      setNewIncTitle('');
      setNewIncDesc('');
    }
  };

  const handleRemoveInclusion = (idx: number) => {
    setInclusions(inclusions.filter((_, i) => i !== idx));
  };

  const handleAddExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const handleRemoveExclusion = (idx: number) => {
    setExclusions(exclusions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a package title.');
      return;
    }

    const assignedVendorId = isAdmin
      ? selectedVendorId
      : user?.vendorId || user?.id || '';

    if (isAdmin && !assignedVendorId) {
      setErrorMsg('Please select a partner vendor to assign this package to.');
      return;
    }

    const assignedVendorName = activeVendor
      ? activeVendor.businessName
      : user?.businessName || user?.name || 'Mahastays Partner';

    const matchedProp = properties.find((p) => p.id === selectedPropertyId);

    const priceNum = parseInt(numericPrice, 10) || 11550;
    const origPriceNum = parseInt(originalPrice, 10) || Math.round(priceNum * 1.3);
    const tierPriceNum = parseInt(tierPrice, 10) || priceNum;

    const allImages: string[] = [];
    if (thumbnail.trim()) allImages.push(thumbnail.trim());
    galleryImages.forEach((img) => {
      if (img.trim() && !allImages.includes(img.trim())) allImages.push(img.trim());
    });

    const primaryTier: PackageTierItem = {
      tierId: `tier_${Date.now()}_01`,
      name: tierName.trim() || 'Romantic Couple All-Inclusive',
      badge: tierHotelType.trim() || '4-Star Valley View Resort Stay Included',
      pricePerPerson: tierPriceNum,
      features: tierFeatures,
    };

    const newPackagePayload: Partial<PackageItem> = {
      title: title.trim(),
      propertyId: selectedPropertyId || '',
      propertyName: matchedProp?.name || '',
      vendorId: assignedVendorId,
      vendorName: assignedVendorName,
      packageType,
      category,
      badge: badge.trim(),
      durationDays: parseInt(durationDays, 10) || 3,
      durationNights: parseInt(durationNights, 10) || 2,
      location: location.trim(),
      city: city.trim(),
      destinations: destinations.trim(),
      idealFor: idealFor.trim(),
      numericPrice: priceNum,
      originalPrice: origPriceNum,
      shortDesc: shortDesc.trim() || overview.slice(0, 150),
      description: overview.trim(),
      overview: overview.trim(),
      thumbnail: thumbnail.trim(),
      images: allImages,
      videoUrl: videoUrl.trim() || undefined,
      highlights,
      inclusions,
      exclusions,
      itinerary,
      tiers: [primaryTier],
      host: {
        name: hostName.trim() || assignedVendorName,
        role: hostRole.trim(),
        experience: hostExperience.trim(),
        avatar: hostAvatar.trim() || activeVendor?.avatarUrl || '',
        verified: true,
        confirmationBadge: 'Instant Booking Confirmed',
      },
      pricingRules: {
        memberDiscountPercent: parseInt(memberDiscountPercent, 10) || 0,
        cleaningFee: includeCleaningFee ? (parseInt(cleaningFeeAmount, 10) || 0) : 0,
        includeCleaningFee,
        gstPercent: parseInt(gstPercentRate, 10) || 0,
        includeGst: (parseInt(gstPercentRate, 10) || 0) > 0,
      },
      status: 'pending_approval',
    };

    try {
      setSubmitting(true);
      const created = await dispatch(createPackageAsync(newPackagePayload)).unwrap();
      router.push(`/dashboard/packages/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create package:', err);
      setErrorMsg(err?.message || 'Failed to list package. Please verify your inputs.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/dashboard/packages" className="hover:text-rose-600 transition flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tour Packages</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Create Package</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Create Curated Tour Package
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish all-inclusive honeymoon, family, or holiday packages and assign to a hospitality partner.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ea110d] hover:bg-[#c50e0a] text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Submit Package &amp; Edit Full UI</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ============================================================== */}
        {/* 1. VENDOR / HOST ASSIGNMENT                                    */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Vendor &amp; Host Assignment
              </h2>
              <p className="text-xs text-slate-500">
                Designate the partner responsible for lodging and local itinerary fulfillment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assign to Partner Vendor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.businessName} ({v.displayName})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <User className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Hosting under: {user?.businessName || user?.name}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Associated Resort / Property (Optional)
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Standalone Tour (No specific property)</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.propertyType})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. PACKAGE IDENTITY & DURATION                                 */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Package Details &amp; Duration
              </h2>
              <p className="text-xs text-slate-500">
                Define the package title, category, night count, and pricing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Package Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Romantic Anniversary Getaway 💕"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Package Style / Type
              </label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value as PackageType)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {PACKAGE_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Holiday Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PackageCategory)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {PACKAGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Duration Days
              </label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Duration Nights
              </label>
              <input
                type="number"
                value={durationNights}
                onChange={(e) => setDurationNights(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Starting Package Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                placeholder="11550"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Original Package Price (₹)
              </label>
              <input
                type="number"
                placeholder="14999"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Destinations / Circuit
              </label>
              <input
                type="text"
                placeholder="Plot 12, Venna Lake, Panchgani Viewpoints"
                value={destinations}
                onChange={(e) => setDestinations(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ideal For
              </label>
              <input
                type="text"
                placeholder="Families &amp; Couples"
                value={idealFor}
                onChange={(e) => setIdealFor(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2B. PRICING RULES, DISCOUNTS, FEES & GST CONFIGURATION         */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center font-black text-sm">
                %
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Package Pricing Rules, Member Discount &amp; GST Rates
                </h2>
                <p className="text-xs text-slate-500">
                  Configure dynamic member discounts, concierge fees (or remove them), and statutory GST rates.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Per-Person Ledger
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Member Discount % */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Mahastays Member Discount (%)
                </label>
                <span className="text-[11px] text-slate-500">
                  Direct discount applied to base package total.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={memberDiscountPercent}
                  onChange={(e) => setMemberDiscountPercent(e.target.value)}
                  className="w-24 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">% off</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['0', '8', '10', '12', '15'].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setMemberDiscountPercent(pct)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      memberDiscountPercent === pct
                        ? 'bg-rose-500 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {pct === '0' ? 'None (0%)' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Concierge / Processing Fee */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
              includeCleaningFee
                ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Concierge &amp; Service Fee (₹)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Optional package concierge fee.
                  </span>
                </div>
                {includeCleaningFee ? (
                  <button
                    type="button"
                    onClick={() => setIncludeCleaningFee(false)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                  >
                    Remove Fee
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeCleaningFee(true);
                      if (cleaningFeeAmount === '0') setCleaningFeeAmount('445');
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                  >
                    + Add Fee
                  </button>
                )}
              </div>

              {includeCleaningFee ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={cleaningFeeAmount}
                      onChange={(e) => setCleaningFeeAmount(e.target.value)}
                      className="w-28 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-100/50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Fee is completely removed (waived ₹0). No additional surcharge.
                </div>
              )}
            </div>

            {/* Taxes & GST Rate % */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  GST &amp; Tourism Taxes (%)
                </label>
                <span className="text-[11px] text-slate-500">
                  Statutory package GST percentage.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={gstPercentRate}
                  onChange={(e) => setGstPercentRate(e.target.value)}
                  className="w-24 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">% GST</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['0', '5', '12', '18'].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setGstPercentRate(pct)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      gstPercentRate === pct
                        ? 'bg-rose-500 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {pct === '0' ? '0% Exempt' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. MEDIA & YOUTUBE PREVIEW                                     */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tour Preview &amp; Media
              </h2>
              <p className="text-xs text-slate-500">
                Cover thumbnail and optional YouTube video preview tour.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Package Thumbnail Upload (No URL input) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Package Thumbnail / Cover Photo <span className="text-rose-500">*</span>
              </label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />

              {thumbnail ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-52 sm:h-64 bg-slate-100 dark:bg-slate-800 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnail} alt="Package Thumbnail preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingThumbnail}
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition cursor-pointer"
                    >
                      {isUploadingThumbnail ? 'Uploading...' : 'Change Cover Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnail('')}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                    ✓ Package Cover Thumbnail
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingThumbnail && thumbnailInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 dark:bg-slate-800/40 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    {isUploadingThumbnail ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isUploadingThumbnail ? 'Uploading photo...' : 'Click to Upload Package Cover Photo'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Direct device file upload • PNG, JPG, WEBP up to 15MB
                  </span>
                </div>
              )}
            </div>

            {/* Additional Tour Gallery Photos */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Tour Gallery Photos ({galleryImages.length})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Upload scenic itinerary &amp; destination photos.
                  </span>
                </div>
                <div>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingGallery}
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingGallery ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading Photos...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>+ Upload Photos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-28 bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setGalleryImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Preview Link */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-rose-600" />
                <span>YouTube Tour Preview Link (Optional Video Demo)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. TRIP HIGHLIGHTS (FRONTEND BULLETS)                          */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Trip Highlights &amp; Key Experiences
              </h2>
              <p className="text-xs text-slate-500">
                Rendered as badge pills directly below the description on the package details page.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Candlelight poolside dining experience"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHighlight();
                  }
                }}
                className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddHighlight}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Highlight</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-800 dark:text-rose-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{h}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(idx)}
                    className="text-rose-400 hover:text-red-700 transition ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. PACKAGE TIERS & PRICING                                     */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Package Tier Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Setup the primary tier perks and pricing. Additional tiers can be added in the full editor.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tier Name
                </label>
                <input
                  type="text"
                  placeholder="Romantic Couple All-Inclusive"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tier Price (₹)
                </label>
                <input
                  type="number"
                  placeholder={numericPrice || '11550'}
                  value={tierPrice}
                  onChange={(e) => setTierPrice(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hotel Type / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="4-Star Valley View Resort Stay Included"
                  value={tierHotelType}
                  onChange={(e) => setTierHotelType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Included Features Chips
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Free Lake Boating Pass"
                  value={newTierFeature}
                  onChange={(e) => setNewTierFeature(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddTierFeature}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition shrink-0"
                >
                  Add Perk
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {tierFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTierFeature(idx)}
                      className="text-emerald-500 hover:text-red-700 ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 8. HOST & CONCIERGE INFORMATION                                */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Host &amp; Concierge Information
              </h2>
              <p className="text-xs text-slate-500">
                Displays in the package header and &ldquo;Hosted by&rdquo; card on the frontend.
              </p>
            </div>
          </div>

          {/* Host Profile Picture / Brand Logo Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {hostAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hostAvatar}
                  alt={hostName || 'Host'}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-rose-200 dark:ring-rose-900/50 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-extrabold text-xl flex items-center justify-center font-poppins shadow-sm">
                  {(hostName || 'H')[0]?.toUpperCase() || 'H'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Host / Concierge Profile Photo or Brand Logo
              </label>
              <p className="text-[11px] text-slate-400">
                Shows in the package details Host banner. Upload high-res photo or operator brand logo (PNG, JPG, WEBP).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1.5 justify-center sm:justify-start">
                <input
                  ref={hostAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHostAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingHostAvatar}
                  onClick={() => hostAvatarInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ea110d] hover:bg-[#c50e0a] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isUploadingHostAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{hostAvatar ? 'Change Photo / Logo' : 'Upload Host Photo / Logo'}</span>
                    </>
                  )}
                </button>
                {activeVendor?.avatarUrl && hostAvatar !== activeVendor.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setHostAvatar(activeVendor.avatarUrl || '')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 transition"
                  >
                    <span>Use Vendor Profile Logo</span>
                  </button>
                )}
                {hostAvatar && (
                  <button
                    type="button"
                    onClick={() => setHostAvatar('')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Host / Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vikramaditya & Concierge Team"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Host Role &amp; Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. Holiday Specialist & Concierge"
                value={hostRole}
                onChange={(e) => setHostRole(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hosting Experience / Badges
              </label>
              <input
                type="text"
                placeholder="e.g. 5 Years Hosting • 1,200+ Verified Guests"
                value={hostExperience}
                onChange={(e) => setHostExperience(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Host Bio
              </label>
              <textarea
                rows={2}
                value={hostBio}
                onChange={(e) => setHostBio(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500">
            Once submitted, you will be redirected to the full package editor to customize itineraries, inclusions, tiers, and media.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#ea110d] hover:bg-[#c50e0a] text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Submit &amp; Open Full Details Editor</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
