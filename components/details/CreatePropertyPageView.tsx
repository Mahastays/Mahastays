'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Sparkles,
  BedDouble,
  Video,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
  Clock,
  Wifi,
  Waves,
  UtensilsCrossed,
  Car,
  Tv,
  Save,
  HelpCircle,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useAppDispatch } from '@/store/hooks';
import { createPropertyAsync } from '@/store/slices/propertiesSlice';
import { uploadImageToCloudinary } from '@/lib/upload';
import { PropertyItem, PropertyType, RoomItem } from '@/types';

const PROPERTY_TYPES: { value: PropertyType; label: string; desc: string }[] = [
  { value: 'resort', label: 'Luxury Resort', desc: 'Full-service hillside resort with pool & dining' },
  { value: 'villa', label: 'Standalone Private Villa', desc: 'Exclusive cliff villa with private pool/deck' },
  { value: 'hotel', label: 'Boutique Heritage Hotel', desc: 'Heritage colonial property with suites' },
  { value: 'cottage', label: 'Cozy Valley Cottage', desc: 'Rustic scenic mountain cottage' },
  { value: 'apartment', label: 'Serviced Luxury Apartment', desc: 'Modern serviced apartment suite' },
];

const STANDARD_AMENITIES = [
  'Free High-Speed Wi-Fi',
  'Heated Infinity Pool',
  'Private Chef on Demand',
  'Dedicated Butler Service',
  'Panoramic Mountain View Deck',
  'Bonfire & BBQ Setup',
  'Luxury Spa & Jacuzzi',
  '24x7 Power Backup',
  'Free Valet Parking',
  'Children Play Area',
  'In-house Multi-cuisine Restaurant',
  'Lawn & Landscaped Garden',
];

export default function CreatePropertyPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { user, activeViewMode } = useAuth();
  const { vendors } = useData();

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

  // Keep selected vendor synced if vendors list loads later
  useEffect(() => {
    if (isAdmin && !selectedVendorId && vendors.length > 0) {
      setSelectedVendorId(preselectedVendorId || vendors[0].id);
    }
  }, [isAdmin, selectedVendorId, vendors, preselectedVendorId]);

  const activeVendor = vendors.find((v) => v.id === selectedVendorId || v.vendorCode === selectedVendorId);

  // Form Fields State
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('resort');
  const [tagline, setTagline] = useState('');
  const [badge, setBadge] = useState('Trending Mountain View');
  const [description, setDescription] = useState('');
  const [numericPrice, setNumericPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [city, setCity] = useState('Mahabaleshwar');
  const [location, setLocation] = useState('Venna Lake Road, Mahabaleshwar');
  const [mapLat, setMapLat] = useState('17.9242');
  const [mapLng, setMapLng] = useState('73.8015');
  const [idealFor, setIdealFor] = useState('Family, Couples & Private Celebrations');
  const [checkInTime, setCheckInTime] = useState('2:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');

  // Pricing, Discounts & GST Rules
  const [memberDiscountPercent, setMemberDiscountPercent] = useState('8');
  const [includeCleaningFee, setIncludeCleaningFee] = useState(true);
  const [cleaningFeeAmount, setCleaningFeeAmount] = useState('445');
  const [gstPercentRate, setGstPercentRate] = useState('18');

  // Media & Upload States
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const coverInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) setCoverImage(res.url);
    } catch (err: any) {
      alert(`Cover upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
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
    'Stunning valley & waterfall view deck',
    'Private infinity pool with heating option',
    'Dedicated chef and personalised butler service',
    'High-speed optical Wi-Fi across premises',
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  // Selected Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Free High-Speed Wi-Fi',
    'Heated Infinity Pool',
    'Private Chef on Demand',
    'Dedicated Butler Service',
  ]);

  // Primary Room Unit
  const [roomName, setRoomName] = useState('Executive Valley Suite');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomMaxGuests, setRoomMaxGuests] = useState('3');
  const [roomUnitsCount, setRoomUnitsCount] = useState('4');

  // House Rules
  const [rules, setRules] = useState<string[]>([
    'Valid government-issued photo ID required for all adult guests at check-in',
    'Smoking permitted in outdoor designated balcony areas only',
    'Quiet hours observed between 10:00 PM and 07:00 AM for serenity',
  ]);
  const [newRule, setNewRule] = useState('');

  // Host Details
  const [hostName, setHostName] = useState('');
  const [hostRole, setHostRole] = useState('Property Owner & Host');
  const [hostExperience, setHostExperience] = useState('5 Years Hosting • 1,200+ Verified Guests');
  const [hostBio, setHostBio] = useState('Passionate about authentic Western Ghats hospitality and local dining.');
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

  // Auto-sync host name when vendor changes
  useEffect(() => {
    if (activeVendor) {
      setHostName(activeVendor.displayName || activeVendor.businessName || '');
      if (activeVendor.avatarUrl && !hostAvatar) {
        setHostAvatar(activeVendor.avatarUrl);
      }
    } else if (!isAdmin && user) {
      setHostName(user.name || user.businessName || 'Host');
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

  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const handleRemoveRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a property name.');
      return;
    }

    const assignedVendorId = isAdmin
      ? selectedVendorId
      : user?.vendorId || user?.id || '';

    if (isAdmin && !assignedVendorId) {
      setErrorMsg('Please select a partner vendor to assign this property to.');
      return;
    }

    const assignedVendorName = activeVendor
      ? activeVendor.businessName
      : user?.businessName || user?.name || 'Mahastays Partner';

    const priceNum = parseInt(numericPrice, 10) || 5000;
    const origPriceNum = parseInt(originalPrice, 10) || Math.round(priceNum * 1.25);
    const primaryRoomRate = parseInt(roomPrice, 10) || priceNum;

    const allImages: string[] = [];
    if (coverImage.trim()) allImages.push(coverImage.trim());
    galleryImages.forEach((img) => {
      if (img.trim() && !allImages.includes(img.trim())) allImages.push(img.trim());
    });

    const primaryRoom: RoomItem = {
      roomId: `rm_${Date.now()}_01`,
      name: roomName.trim() || 'Executive Valley Suite',
      basePrice: primaryRoomRate,
      maxGuests: parseInt(roomMaxGuests, 10) || 2,
      count: parseInt(roomUnitsCount, 10) || 1,
      images: allImages.length ? [allImages[0]] : [],
      amenities: selectedAmenities.slice(0, 4),
    };

    const newPropertyPayload: Partial<PropertyItem> = {
      name: name.trim(),
      propertyType,
      tagline: tagline.trim() || undefined,
      badge: badge.trim() || undefined,
      description: description.trim(),
      location: location.trim(),
      city: city.trim(),
      numericPrice: priceNum,
      originalPrice: origPriceNum,
      rating: 0,
      reviewsCount: 0,
      images: allImages,
      gallery: allImages,
      videoUrl: videoUrl.trim() || undefined,
      vendorId: assignedVendorId,
      vendorName: assignedVendorName,
      idealFor: idealFor.trim(),
      address: {
        fullAddress: location.trim(),
        lat: parseFloat(mapLat) || 17.9242,
        lng: parseFloat(mapLng) || 73.8015,
        mapLink: `https://www.google.com/maps?q=${mapLat},${mapLng}`,
      },
      rooms: [primaryRoom],
      amenities: selectedAmenities,
      keyAmenities: [
        { name: 'Infinity Pool Deck', desc: 'Heated pool with valley view' },
        { name: 'Private Chef', desc: 'On-demand dining & BBQ' },
        { name: 'Butler Service', desc: 'Personalised assistance' },
        { name: 'High-Speed Wi-Fi', desc: 'Stay connected 250 Mbps' },
      ],
      facilityCategories: [
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
      ],
      highlights: highlights.map((text) => ({ title: text, desc: '' })),
      policies: {
        checkInTime,
        checkOutTime,
        suitabilityRules: rules,
        cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
      },
      host: {
        name: hostName.trim() || assignedVendorName,
        role: hostRole.trim(),
        experience: hostExperience.trim(),
        avatar: hostAvatar.trim() || activeVendor?.avatarUrl || '',
        verified: true,
        staysCount: '15+ Stays Hosted',
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
      const created = await dispatch(createPropertyAsync(newPropertyPayload)).unwrap();
      // Route immediately to full detail & edit page so the admin or vendor can edit every tab!
      router.push(`/dashboard/hotels/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create property:', err);
      setErrorMsg(err?.message || 'Failed to list property. Please check your inputs.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/dashboard/hotels" className="hover:text-rose-600 transition flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Properties</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">List New Property</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            List New Hotel or Resort Property
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Fill in the core property profile and assign to a vendor partner. You can edit all details and cards in full frontend UI view right after creation.
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
            <span>Submit for Approval &amp; Edit Full UI</span>
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
        {/* 1. VENDOR / HOST ASSIGNMENT CARD (CRUCIAL)                     */}
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
                Specify which verified partner vendor owns and manages this listing.
              </p>
            </div>
          </div>

          {isAdmin ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {v.businessName} — {v.displayName} ({v.vendorCode || v.id.slice(-6)})
                      </option>
                    ))}
                  </select>
                </div>

                {activeVendor && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">
                      {activeVendor.businessName?.[0] || 'V'}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{activeVendor.businessName}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {activeVendor.status === 'active' ? 'Verified' : 'Partner'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Contact: {activeVendor.displayName} &bull; {activeVendor.email}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <User className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Listing under your Partner Account: {user?.businessName || user?.name}
                </span>
                <p className="text-slate-500 text-[11px]">
                  This property will be listed in your portfolio and submitted to the Mahastays operations desk for approval.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 2. BASIC PROPERTY IDENTITY                                     */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Property Identity &amp; Type
              </h2>
              <p className="text-xs text-slate-500">
                Define the public title, hospitality style, and location.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Property Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Pine Forest Luxury Resort &amp; Spa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Property Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label} &mdash; {pt.desc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Badge / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Trending, Mountain View, Chef's Special"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tagline
              </label>
              <input
                type="text"
                placeholder="e.g. Serene Mountain View Luxury with Private Jacuzzis &amp; Forest Trails"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Starting Nightly Price (₹ / night) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 8500"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Original Rack Price (₹ / night)
              </label>
              <input
                type="number"
                placeholder="e.g. 11000"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                City / Region
              </label>
              <input
                type="text"
                placeholder="e.g. Mahabaleshwar"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ideal For
              </label>
              <input
                type="text"
                placeholder="e.g. Family, Couples, Large Group"
                value={idealFor}
                onChange={(e) => setIdealFor(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Address / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 14, Table Land Road, Panchgani, Maharashtra 412805"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Map Latitude
              </label>
              <input
                type="text"
                value={mapLat}
                onChange={(e) => setMapLat(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Map Longitude
              </label>
              <input
                type="text"
                value={mapLng}
                onChange={(e) => setMapLng(e.target.value)}
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
                  Pricing Rules, Discounts, Cleaning Fee &amp; GST Rates
                </h2>
                <p className="text-xs text-slate-500">
                  Configure dynamic member discounts, cleaning fee (or remove it), and tax rates stored per listing in database.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Live Breakdown Folio
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
                  Direct discount applied to base stay total.
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

            {/* Cleaning Fee */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
              includeCleaningFee
                ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Cleaning &amp; Sanitization Fee (₹)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    One-time stay cleaning charge.
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
                    onClick={() => setIncludeCleaningFee(true)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                  >
                    + Restore Fee
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['299', '445', '750', '999'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCleaningFeeAmount(amt)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          cleaningFeeAmount === amt
                            ? 'bg-rose-500 text-white'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-100/50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Cleaning fee is completely removed (waived ₹0). Guests will not be charged.
                </div>
              )}
            </div>

            {/* Taxes & GST Rate % */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Taxes &amp; GST Rate (%)
                </label>
                <span className="text-[11px] text-slate-500">
                  Government statutory GST percentage.
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

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Sample 3-Night Booking Folio Calculation
            </span>
            {(() => {
              const sampleNightly = parseInt(numericPrice, 10) || 8500;
              const sampleNights = 3;
              const sampleBase = sampleNightly * sampleNights;
              const discPct = parseInt(memberDiscountPercent, 10) || 0;
              const sampleDisc = Math.round(sampleBase * (discPct / 100));
              const sampleFee = includeCleaningFee ? (parseInt(cleaningFeeAmount, 10) || 0) : 0;
              const gstPct = parseInt(gstPercentRate, 10) || 0;
              const sampleTax = Math.round((sampleBase - sampleDisc + sampleFee) * (gstPct / 100));
              const sampleTotal = sampleBase - sampleDisc + sampleFee + sampleTax;

              return (
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <div>
                    Base: <span className="font-bold text-slate-900 dark:text-slate-100">₹{sampleBase.toLocaleString('en-IN')}</span> (₹{sampleNightly.toLocaleString('en-IN')} × 3 nights)
                  </div>
                  {discPct > 0 && (
                    <div className="text-emerald-600 font-semibold">
                      Discount ({discPct}%): -₹{sampleDisc.toLocaleString('en-IN')}
                    </div>
                  )}
                  <div>
                    Cleaning: {sampleFee > 0 ? (
                      <span className="font-bold text-slate-900 dark:text-slate-100">₹{sampleFee}</span>
                    ) : (
                      <span className="font-bold text-rose-500">₹0 (Removed)</span>
                    )}
                  </div>
                  <div>
                    GST ({gstPct}%): <span className="font-bold text-slate-900 dark:text-slate-100">₹{sampleTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="font-black text-rose-600 text-sm">
                    Total: ₹{sampleTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. DESCRIPTION & TIMINGS                                       */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                About &amp; Overview Description
              </h2>
              <p className="text-xs text-slate-500">
                Describe the property architecture, mountain views, and check-in timing.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Description / Overview
              </label>
              <textarea
                rows={4}
                placeholder="Nestled amongst misty pine forests and cascading waterfalls, this property provides panoramic valley viewpoints, luxury dining, heated pool decks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Standard Check-in Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2:00 PM"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Standard Check-out Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. MEDIA & YOUTUBE VIDEO TOUR                                  */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Media &amp; Video Tour
              </h2>
              <p className="text-xs text-slate-500">
                Add cover photography, gallery links, and optional YouTube video walkthrough demo.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Cover Image Upload (No URL input) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Primary Cover Photo <span className="text-rose-500">*</span>
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />

              {coverImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-52 sm:h-64 bg-slate-100 dark:bg-slate-800 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition cursor-pointer"
                    >
                      {isUploadingCover ? 'Uploading...' : 'Change Cover Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                    ✓ Primary Cover Photo
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 dark:bg-slate-800/40 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    {isUploadingCover ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isUploadingCover ? 'Uploading photo...' : 'Click to Upload Primary Cover Photo'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Direct device file upload • PNG, JPG, WEBP up to 15MB
                  </span>
                </div>
              )}
            </div>

            {/* Gallery Photos Upload (No URL input) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Property Gallery Photos ({galleryImages.length})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Upload multiple scenic angles, bedrooms, decks &amp; pool photos directly from your device.
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

              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-28 bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingGallery && galleryInputRef.current?.click()}
                  className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-850 hover:border-slate-300"
                >
                  <span className="text-xs text-slate-500">
                    No additional gallery photos yet. Click &ldquo;+ Upload Photos&rdquo; to browse and select files.
                  </span>
                </div>
              )}
            </div>

            {/* Video Tour Link */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-rose-600" />
                <span>YouTube Video Tour Link (Optional Walkthrough)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[11px] text-slate-400">
                Shows the interactive &ldquo;Watch Video Tour&rdquo; modal button on the guest details page.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. HIGHLIGHTS & KEY BULLETS (MATCHING FRONTEND UI)             */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Highlights &amp; Feature Bullets
              </h2>
              <p className="text-xs text-slate-500">
                These bullets render prominently in the &ldquo;Highlights&rdquo; card on the frontend details page.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Private infinity pool with valley view"
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
                <span>Add Bullet</span>
              </button>
            </div>

            <div className="space-y-2">
              {highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{h}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(idx)}
                    className="text-slate-400 hover:text-red-600 transition p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 6. AMENITIES & FACILITIES                                      */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Key Amenities &amp; Facilities
              </h2>
              <p className="text-xs text-slate-500">
                Click to toggle amenities included at this property.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {STANDARD_AMENITIES.map((amenity) => {
              const active = selectedAmenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between border cursor-pointer ${
                    active
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span>{amenity}</span>
                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 7. INITIAL ROOM UNIT                                           */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Primary Room / Suite Accommodation
              </h2>
              <p className="text-xs text-slate-500">
                Configure the primary room unit available for reservation. Additional rooms can be added in the full editor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Suite / Room Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Executive Valley Suite"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Base Room Price (₹ / night)
              </label>
              <input
                type="number"
                placeholder={numericPrice || '8500'}
                value={roomPrice}
                onChange={(e) => setRoomPrice(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Max Guests Capacity
              </label>
              <input
                type="number"
                value={roomMaxGuests}
                onChange={(e) => setRoomMaxGuests(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 8. HOUSE RULES & POLICIES                                      */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                House Rules &amp; Guest Policies
              </h2>
              <p className="text-xs text-slate-500">
                Set guest expectations, check-in requirements, and safety policies.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Pets allowed in designated ground floor cottages"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Rule</span>
              </button>
            </div>

            <div className="space-y-2">
              {rules.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <span>&bull; {r}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="text-slate-400 hover:text-red-600 transition p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 9. HOST PROFILE & BIO                                          */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Host Information &amp; Bio
              </h2>
              <p className="text-xs text-slate-500">
                Displays in the &ldquo;Host &amp; Reviews&rdquo; tab on the frontend.
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
                Host Profile Photo or Brand Logo
              </label>
              <p className="text-[11px] text-slate-400">
                Shows in the stay details Host Card to guests. Upload high-res photo or hotel brand logo (PNG, JPG, WEBP).
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
                Host Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vikramaditya Shinde"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Host Role &amp; Title
              </label>
              <input
                type="text"
                placeholder="e.g. Property Owner &amp; Resident Manager"
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
            Once submitted, you will be redirected to the full 7-tab editor to fine-tune cards, pricing, reviews, and rules.
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
