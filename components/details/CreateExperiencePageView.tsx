'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Timer,
  Video,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
  Clock,
  MapPin,
  Save,
  Compass,
  Footprints,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useAppDispatch } from '@/store/hooks';
import { createExperienceAsync } from '@/store/slices/experiencesSlice';
import { uploadImageToCloudinary } from '@/lib/upload';
import { toast } from '@/components/ui/Toast';
import { ExperienceItem, Difficulty, ExperienceSlotItem } from '@/types';

const CATEGORIES = [
  'Fun Activity & Resort Games',
  'Night Karaoke & Entertainment',
  'Bonfire & Music',
  'Treasure Hunt',
  'Group Games & Team Building',
  'Tower Building',
  'Musical Chair',
  'Couple Balloon Games',
  'Antakshari & Musical Games',
  'Tambola & Housie',
  'Trekking & Hiking',
  'Watersports & Boating',
  'Stargazing & Camping',
  'Cycling & Mountain Biking',
  'Cultural & Heritage Walk',
  'Strawberry Farm Tour',
  'Adventure & Wildlife Safari',
  'Nature & Sightseeing',
];

const DIFFICULTIES: Difficulty[] = ['Easy', 'Moderate', 'Challenging'];

export default function CreateExperiencePageView() {
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

  useEffect(() => {
    if (isAdmin && !selectedVendorId && vendors.length > 0) {
      setSelectedVendorId(preselectedVendorId || vendors[0].id);
    }
  }, [isAdmin, selectedVendorId, vendors, preselectedVendorId]);

  const activeVendor = vendors.find((v) => v.id === selectedVendorId || v.vendorCode === selectedVendorId);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Trekking & Hiking');
  const [difficulty, setDifficulty] = useState<Difficulty>('Moderate');
  const [duration, setDuration] = useState('4 Hours');
  const [city, setCity] = useState('Mahabaleshwar');
  const [location, setLocation] = useState('Arthur Seat Base, Mahabaleshwar');
  const [locationType, setLocationType] = useState<'fixed_location' | 'customer_location' | 'both'>('fixed_location');
  const [serviceArea, setServiceArea] = useState('Across Mahabaleshwar & Panchgani stays/villas');
  const [numericPrice, setNumericPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [priceType, setPriceType] = useState<'per_person' | 'per_activity' | 'per_night'>('per_person');
  const [personLimit, setPersonLimit] = useState('15');
  const [description, setDescription] = useState('');
  const [maxGroupSize, setMaxGroupSize] = useState('15');
  const [idealFor, setIdealFor] = useState('Nature Lovers, Trekkers & Adventure Seekers');

  // Pricing, Discounts & GST Rules
  const [memberDiscountPercent, setMemberDiscountPercent] = useState('8');
  const [includeCleaningFee, setIncludeCleaningFee] = useState(false);
  const [cleaningFeeAmount, setCleaningFeeAmount] = useState('0');
  const [gstPercentRate, setGstPercentRate] = useState('18');

  // Child Pricing Configuration
  const [hasChildPrice, setHasChildPrice] = useState(false);
  const [childPrice, setChildPrice] = useState('');
  const [childAgeLimit, setChildAgeLimit] = useState('Below 12 years');

  // Media & Upload States
  const [image, setImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) setImage(res.url);
    } catch (err: any) {
      toast.error(err.message || 'Photo upload failed', 'Upload Failed');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
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
      toast.error(err.message || 'Gallery upload failed', 'Upload Failed');
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Highlights Bullets
  const [highlights, setHighlights] = useState<string[]>([
    'Certified mountain rescue & first-aid guide',
    'Spectacular sunrise views over the Savitri river valley',
    'Warm breakfast & local strawberry tea on the summit plateau',
    'Small curated group with safety equipment provided',
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  // Slots & Timings
  const [slots, setSlots] = useState<ExperienceSlotItem[]>([
    { slotId: 'slot_morning', time: '06:00 AM - 10:00 AM', label: 'Sunrise Batch', capacity: 15, price: 683 },
    { slotId: 'slot_evening', time: '03:30 PM - 07:00 PM', label: 'Sunset Batch', capacity: 15, price: 683 },
  ]);
  const [slotTime, setSlotTime] = useState('');
  const [slotLabel, setSlotLabel] = useState('');
  const [slotCapacity, setSlotCapacity] = useState('15');

  // Guide / Host Details
  const [guideName, setGuideName] = useState('');
  const [guideRole, setGuideRole] = useState('Certified Mountaineering Instructor');
  const [guideExperience, setGuideExperience] = useState('7 Years Guiding • 450+ Treks Led');
  const [guideBio, setGuideBio] = useState('Specializing in Western Ghats wilderness expeditions, safety briefings, and nature trails.');
  const [guideAvatar, setGuideAvatar] = useState('');
  const [isUploadingGuideAvatar, setIsUploadingGuideAvatar] = useState(false);
  const guideAvatarInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleGuideAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingGuideAvatar(true);
    try {
      const res = await uploadImageToCloudinary(file, 'avatar');
      setGuideAvatar(res.url);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload guide avatar', 'Upload Failed');
    } finally {
      setIsUploadingGuideAvatar(false);
    }
  };

  useEffect(() => {
    if (activeVendor) {
      setGuideName(activeVendor.displayName || activeVendor.businessName || '');
      if (activeVendor.avatarUrl && !guideAvatar) {
        setGuideAvatar(activeVendor.avatarUrl);
      }
    } else if (!isAdmin && user) {
      setGuideName(user.name || user.businessName || 'Lead Guide');
    }
  }, [activeVendor, isAdmin, user]);

  // Inclusions & What to bring
  const [inclusions, setInclusions] = useState<Array<{ title: string; desc: string }>>([
    { title: 'Trek Leader & Safety Gear', desc: 'Government certified guide and first-aid support' },
    { title: 'Forest Permits & Passes', desc: 'All local wildlife sanctuary entry tickets included' },
    { title: 'Peak Breakfast & Tea', desc: 'Traditional Maharashtrian breakfast with hot tea' },
  ]);
  const [newIncTitle, setNewIncTitle] = useState('');
  const [newIncDesc, setNewIncDesc] = useState('');

  const [whatToBring, setWhatToBring] = useState<string[]>([
    'Comfortable trekking shoes with good grip',
    'Windcheater or light warm layer for misty mornings',
    'Personal refillable water bottle (min 1 Liter)',
  ]);
  const [newWhatToBring, setNewWhatToBring] = useState('');

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

  const handleAddSlot = () => {
    if (slotTime.trim() && slotLabel.trim()) {
      const p = parseInt(numericPrice, 10) || 683;
      setSlots([
        ...slots,
        {
          slotId: `slot_${Date.now()}`,
          time: slotTime.trim(),
          label: slotLabel.trim(),
          capacity: parseInt(slotCapacity, 10) || 12,
          price: p,
        },
      ]);
      setSlotTime('');
      setSlotLabel('');
    }
  };

  const handleRemoveSlot = (idx: number) => {
    setSlots(slots.filter((_, i) => i !== idx));
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

  const handleAddWhatToBring = () => {
    if (newWhatToBring.trim()) {
      setWhatToBring([...whatToBring, newWhatToBring.trim()]);
      setNewWhatToBring('');
    }
  };

  const handleRemoveWhatToBring = (idx: number) => {
    setWhatToBring(whatToBring.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter an experience title.');
      return;
    }

    const assignedVendorId = isAdmin
      ? selectedVendorId
      : user?.vendorId || user?.id || '';

    if (isAdmin && !assignedVendorId) {
      setErrorMsg('Please select a partner vendor to assign this experience to.');
      return;
    }

    const assignedVendorName = activeVendor
      ? activeVendor.businessName
      : user?.businessName || user?.name || 'Mahastays Partner';

    const priceNum = parseInt(numericPrice, 10) || 683;
    const origPriceNum = parseInt(originalPrice, 10) || Math.round(priceNum * 1.3);

    const allImages: string[] = [];
    if (image.trim()) allImages.push(image.trim());
    galleryImages.forEach((img) => {
      if (img.trim() && !allImages.includes(img.trim())) allImages.push(img.trim());
    });

    const newExperiencePayload: Partial<ExperienceItem> = {
      title: title.trim(),
      priceType,
      personLimit: parseInt(personLimit, 10) || 15,
      vendorId: assignedVendorId,
      vendorName: assignedVendorName,
      category,
      difficulty,
      duration,
      city: city.trim(),
      locationType,
      serviceArea: locationType !== 'fixed_location' ? serviceArea.trim() : undefined,
      location: locationType === 'customer_location' ? 'Delivered at Customer Villa / Stay' : location.trim(),
      meetingPoint: locationType === 'customer_location' ? 'Delivered at customer stay / villa' : location.trim(),
      numericPrice: priceNum,
      originalPrice: origPriceNum,
      hasChildPrice,
      childPrice: hasChildPrice ? (parseInt(childPrice, 10) || Math.round(priceNum * 0.6)) : undefined,
      childAgeLimit: hasChildPrice ? (childAgeLimit.trim() || 'Below 12 years') : undefined,
      description: description.trim(),
      overview: description.trim(),
      image: image.trim(),
      gallery: allImages,
      videoUrl: videoUrl.trim() || undefined,
      highlights,
      slots,
      tiers: [
        {
          tierId: `tier-${Date.now()}-1`,
          name: 'Standard Experience Pass',
          tagline: 'Standard Admission & Guided Excursion',
          badge: 'Popular',
          priceType,
          personLimit: parseInt(personLimit, 10) || 15,
          pricePerPerson: priceNum,
          originalPrice: origPriceNum,
          hasChildPrice,
          childPricePerPerson: hasChildPrice ? (parseInt(childPrice, 10) || Math.round(priceNum * 0.6)) : undefined,
          childAgeLimit: hasChildPrice ? (childAgeLimit.trim() || 'Below 12 years') : undefined,
          features: ['Full Activity Access', 'Certified Guide Assistance', 'Safety Briefing & Equipment'],
        },
      ],
      inclusions,
      whatToBring,
      maxGroupSize: parseInt(maxGroupSize, 10) || 15,
      idealFor: idealFor.trim(),
      guide: {
        name: guideName.trim() || assignedVendorName,
        role: guideRole.trim(),
        experience: guideExperience.trim(),
        avatar: guideAvatar.trim() || activeVendor?.avatarUrl || '',
        verified: true,
        confirmationBadge: 'Certified Guide',
      },
      host: {
        name: guideName.trim() || assignedVendorName,
        role: guideRole.trim(),
        experience: guideExperience.trim(),
        avatar: guideAvatar.trim() || activeVendor?.avatarUrl || '',
        verified: true,
        confirmationBadge: 'Certified Guide',
      },
      pricingRules: {
        memberDiscountPercent: parseInt(memberDiscountPercent, 10) || 0,
        cleaningFee: includeCleaningFee ? (parseInt(cleaningFeeAmount, 10) || 0) : 0,
        includeCleaningFee,
        gstPercent: parseInt(gstPercentRate, 10) || 0,
        includeGst: (parseInt(gstPercentRate, 10) || 0) > 0,
        hasChildPrice,
        childPrice: hasChildPrice ? (parseInt(childPrice, 10) || Math.round(priceNum * 0.6)) : undefined,
        childAgeLimit: hasChildPrice ? (childAgeLimit.trim() || 'Below 12 years') : undefined,
      },
      status: 'pending_approval',
    };

    try {
      setSubmitting(true);
      const created = await dispatch(createExperienceAsync(newExperiencePayload)).unwrap();
      toast.success('Experience listing created successfully!', 'Experience Created');
      router.push(`/dashboard/experiences/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create experience:', err);
      const msg = err?.message || 'Failed to list experience. Please verify your inputs.';
      setErrorMsg(msg);
      toast.error(msg, 'Creation Failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/dashboard/experiences" className="hover:text-rose-600 transition flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Experiences</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Add Experience</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Add Mountain Experience or Trek
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish guided treks, watersports, or local tours and assign to a certified activity host.
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
            <span>Submit Experience &amp; Edit Full UI</span>
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
                Vendor &amp; Adventure Partner Assignment
              </h2>
              <p className="text-xs text-slate-500">
                Select the registered outdoor adventure operator managing this activity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assign to Adventure Partner <span className="text-rose-500">*</span>
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
                  Organizing under: {user?.businessName || user?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. EXPERIENCE IDENTITY & DIFFICULTY                            */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Activity Details &amp; Difficulty
              </h2>
              <p className="text-xs text-slate-500">
                Define the trek title, duration, physical level, and price per person.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Experience / Trek Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sunrise Trek to Arthur Seat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Duration (e.g. 4 Hours)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Starting Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                placeholder="683"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pricing Model
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="per_person">👤 Per Person (Multiplies price by guest count)</option>
                <option value="per_activity">🎪 Per Activity / Full Setup (Flat setup price, does NOT increase by person count)</option>
                <option value="per_night">🌙 Per Night / Flat Session</option>
              </select>
              {priceType === 'per_activity' && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  💡 Full Setup pricing: The booking total stays flat regardless of how many adults or children join (up to the Person Limit capacity).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Person Limit (Max Participants)
              </label>
              <input
                type="number"
                min="1"
                placeholder="15"
                value={personLimit}
                onChange={(e) => setPersonLimit(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Experience Location Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('fixed_location')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    locationType === 'fixed_location'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-100'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">📍 Specific Host Venue</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Fixed trailhead or meeting point (e.g. Trekking, Boating, Nature Trail).</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('customer_location')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    locationType === 'customer_location'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-100'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">🚗 At Customer's Location</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Delivered at user's villa/stay (e.g. Karaoke, Bonfire, Group games).</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('both')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    locationType === 'both'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-100'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">🔄 Flexible / Both</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Host can conduct at venue OR deliver setup to user's stay.</span>
                </button>
              </div>
            </div>

            {locationType !== 'customer_location' && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meeting Point / Landmark Address (Specific Location)
                </label>
                <input
                  type="text"
                  placeholder="Arthur Seat Point Road, Mahabaleshwar"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            {locationType !== 'fixed_location' && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Service Area / Delivery Radius (Customer's Stay / Villa)
                </label>
                <input
                  type="text"
                  placeholder="e.g. All villas, hotels & resorts across Mahabaleshwar & Panchgani (within 20 km)"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[11px] text-slate-500 font-normal">
                  💡 Customers will be prompted to provide their specific stay/villa name & room during checkout.
                </p>
              </div>
            )}
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
                  Experience Pricing Rules, Member Discount &amp; GST Rates
                </h2>
                <p className="text-xs text-slate-500">
                  Configure dynamic member discounts, safety/gear fees (or remove them), and statutory GST rates.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Per-Guest Ledger
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
                  Direct discount applied to base experience ticket.
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

            {/* Safety Gear / Permits Fee */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
              includeCleaningFee
                ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Safety Gear &amp; Forest Fee (₹)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Optional gear &amp; pass surcharge.
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
                      if (cleaningFeeAmount === '0') setCleaningFeeAmount('199');
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
                  GST &amp; Safety Cess (%)
                </label>
                <span className="text-[11px] text-slate-500">
                  Statutory experience GST percentage.
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

          {/* Child Pricing Toggle & Configuration */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Different Pricing for Children
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasChildPrice ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {hasChildPrice ? 'Custom Child Rate' : 'Default Adult Rate'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable if you want a separate discount or discounted ticket rate for children. If disabled, children are charged the default adult ticket price.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hasChildPrice}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasChildPrice(checked);
                    if (checked && !childPrice) {
                      const p = parseInt(numericPrice, 10);
                      setChildPrice(p ? String(Math.round(p * 0.6)) : '399');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {hasChildPrice && (
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Child Ticket Price (₹ per child) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 399"
                      value={childPrice}
                      onChange={(e) => setChildPrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Will be multiplied by number of children booked.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Child Age / Eligibility Limit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Below 12 years / Ages 3-12"
                    value={childAgeLimit}
                    onChange={(e) => setChildAgeLimit(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    Shown to customer during booking selection.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. MEDIA & YOUTUBE VIDEO DEMO                                  */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Media &amp; Video Walkthrough
              </h2>
              <p className="text-xs text-slate-500">
                Cover photo and optional YouTube video demo.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Experience Cover Image Upload (No URL input) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Primary Experience Photo <span className="text-rose-500">*</span>
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {image ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-52 sm:h-64 bg-slate-100 dark:bg-slate-800 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Experience preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition cursor-pointer"
                    >
                      {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                    ✓ Cover Activity Photo
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingImage && imageInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 dark:bg-slate-800/40 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    {isUploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isUploadingImage ? 'Uploading photo...' : 'Click to Upload Primary Activity Photo'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Direct device file upload • PNG, JPG, WEBP up to 15MB
                  </span>
                </div>
              )}
            </div>

            {/* Additional Activity Photos */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Experience Gallery Photos ({galleryImages.length})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Upload scenic viewpoints, trekking checkpoints &amp; activity snapshots.
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

            {/* Video Demo Link */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-rose-600" />
                <span>YouTube Video Demo Link (Optional Walkthrough)</span>
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
        {/* 4. HIGHLIGHTS BULLETS                                          */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Highlights &amp; Key Features
              </h2>
              <p className="text-xs text-slate-500">
                Featured bullet points for trek preview.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Certified mountain rescue guide"
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
        {/* 5. SLOTS & TIMINGS                                             */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Experience Slots &amp; Timings
              </h2>
              <p className="text-xs text-slate-500">
                Configure departure batches (e.g. Morning or Sunset batches).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Time (e.g. 06:00 AM - 10:00 AM)"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Label (e.g. Sunrise Batch)"
                value={slotLabel}
                onChange={(e) => setSlotLabel(e.target.value)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Capacity (e.g. 15)"
                  value={slotCapacity}
                  onChange={(e) => setSlotCapacity(e.target.value)}
                  className="w-24 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition"
                >
                  Add Slot
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {slots.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{s.label}</span>
                      <span className="text-slate-500 font-normal">({s.time})</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Capacity: {s.capacity} persons &bull; Price: ₹{s.price}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(idx)}
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
        {/* 8. GUIDE & HOST INFORMATION                                    */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Lead Guide &amp; Activity Host Information
              </h2>
              <p className="text-xs text-slate-500">
                Displays in the &ldquo;Guided by&rdquo; card and details overview on the frontend.
              </p>
            </div>
          </div>

          {/* Guide Profile Picture / Operator Brand Logo Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {guideAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={guideAvatar}
                  alt={guideName || 'Guide'}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-rose-200 dark:ring-rose-900/50 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-extrabold text-xl flex items-center justify-center font-poppins shadow-sm">
                  {(guideName || 'G')[0]?.toUpperCase() || 'G'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Guide Profile Photo or Company Brand Logo
              </label>
              <p className="text-[11px] text-slate-400">
                Shows in the guest experience page. Upload high-res photo or operator brand logo (PNG, JPG, WEBP).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1.5 justify-center sm:justify-start">
                <input
                  ref={guideAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGuideAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingGuideAvatar}
                  onClick={() => guideAvatarInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ea110d] hover:bg-[#c50e0a] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isUploadingGuideAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{guideAvatar ? 'Change Photo / Logo' : 'Upload Guide Photo / Logo'}</span>
                    </>
                  )}
                </button>
                {activeVendor?.avatarUrl && guideAvatar !== activeVendor.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setGuideAvatar(activeVendor.avatarUrl || '')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 transition"
                  >
                    <span>Use Vendor Profile Logo</span>
                  </button>
                )}
                {guideAvatar && (
                  <button
                    type="button"
                    onClick={() => setGuideAvatar('')}
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
                Guide / Leader Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Patil & Sahyadri Guides"
                value={guideName}
                onChange={(e) => setGuideName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Guide Certification &amp; Title
              </label>
              <input
                type="text"
                placeholder="e.g. Certified Mountaineering Instructor"
                value={guideRole}
                onChange={(e) => setGuideRole(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Guiding Experience / Badges
              </label>
              <input
                type="text"
                placeholder="e.g. 7 Years Guiding • 450+ Treks Led"
                value={guideExperience}
                onChange={(e) => setGuideExperience(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Guide Bio
              </label>
              <textarea
                rows={2}
                value={guideBio}
                onChange={(e) => setGuideBio(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500">
            Once submitted, you will be redirected to the full experience editor to customize slots, equipment, routes, and video.
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
