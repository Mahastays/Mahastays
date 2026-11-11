'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  Sparkles,
  UploadCloud,
  Loader2,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  Percent,
  Check,
  Eye,
  DollarSign,
  Layers,
  Home,
  Hotel,
  Gift,
  Compass,
  Tag,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { uploadImageToCloudinary } from '@/lib/upload';
import { toast } from '@/components/ui/Toast';
import { AdPlacement, AdTargetType, AdType } from '@/types';

type BadgeStyle = 'hot' | 'seller' | 'new' | 'limited';

export default function CreateAdPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, activeViewMode } = useAuth();
  const { properties, packages, experiences, createAdCampaign } = useData();

  const isAdmin = activeViewMode === 'admin';
  const initialSection = searchParams?.get('section') || 'home';

  // Section / Placement
  const [placement, setPlacement] = useState<AdPlacement>(() => {
    if (initialSection === 'packages') return 'packages';
    if (initialSection === 'experiences') return 'experiences';
    if (initialSection === 'stays') return 'stays';
    return 'homepage';
  });

  const [adType, setAdType] = useState<AdType>(() => {
    if (initialSection === 'packages' || initialSection === 'experiences' || initialSection === 'stays') {
      return 'banner';
    }
    return 'card';
  });

  // Target Listing
  const [targetType, setTargetType] = useState<AdTargetType>(() => {
    if (initialSection === 'packages') return 'package';
    if (initialSection === 'experiences') return 'activity';
    return 'property';
  });
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  // Creative & Campaign Details
  const [adName, setAdName] = useState('');
  const [headline, setHeadline] = useState('');
  const [duration, setDuration] = useState('3D / 2N');
  const [viewType, setViewType] = useState('Scenic View');
  const [location, setLocation] = useState('Mahabaleshwar, India');
  const [originalPrice, setOriginalPrice] = useState('18500');
  const [discountedPrice, setDiscountedPrice] = useState('12499');
  const [badgeText, setBadgeText] = useState('Sponsored');
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>('hot');
  const [ctaLink, setCtaLink] = useState('/explore');
  const [buttonText, setButtonText] = useState('View Details');
  const [priority, setPriority] = useState<number>(8);
  const [isActive, setIsActive] = useState(true);

  // Budget
  const [totalBudget, setTotalBudget] = useState('25000');
  const [dailyBudget, setDailyBudget] = useState('1500');
  const [costPerClick, setCostPerClick] = useState('12');

  // Image Media & Cloudinary Upload State
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target Options
  const targetOptions =
    targetType === 'property'
      ? properties.map((p) => ({
          id: p.id,
          title: p.name,
          link: `/explore/${p.slug || p.code || p.id}`,
          price: p.numericPrice || 12000,
          location: p.location || p.city || 'Mahabaleshwar',
          image: p.images?.[0] || '',
        }))
      : targetType === 'package'
      ? packages.map((pkg) => ({
          id: pkg.id,
          title: pkg.title,
          link: `/packages/${pkg.code || pkg.id}`,
          price: pkg.numericPrice || 14000,
          location: pkg.location || pkg.city || 'Mahabaleshwar',
          image: pkg.images?.[0] || '',
        }))
      : experiences.map((exp) => ({
          id: exp.id,
          title: exp.title,
          link: `/experiences/${exp.code || exp.id}`,
          price: exp.numericPrice || 1200,
          location: exp.location || `${exp.city || 'Mahabaleshwar'}`,
          image: exp.image || (Array.isArray(exp.gallery) ? exp.gallery[0] : ''),
        }));

  // Auto-populate when target selection changes
  const handleSelectTarget = (targetId: string) => {
    setSelectedTargetId(targetId);
    const item = targetOptions.find((t) => t.id === targetId);
    if (item) {
      if (!adName) setAdName(`${item.title} Promo`);
      if (!headline) setHeadline(item.title);
      if (item.link) setCtaLink(item.link);
      if (item.location) setLocation(item.location);
      if (item.image && !imageUrl) setImageUrl(item.image);
      if (item.price) {
        const disc = Math.round(item.price * 0.85);
        setOriginalPrice(String(item.price));
        setDiscountedPrice(String(disc));
      }
    }
  };

  // Section change handler
  const handlePlacementChange = (sec: AdPlacement) => {
    setPlacement(sec);
    if (sec === 'packages') {
      setTargetType('package');
      setAdType('banner');
      setButtonText('Explore Packages');
      setCtaLink('/packages');
    } else if (sec === 'experiences') {
      setTargetType('activity');
      setAdType('banner');
      setButtonText('Explore Experiences');
      setCtaLink('/experiences');
    } else if (sec === 'stays') {
      setTargetType('property');
      setAdType('banner');
      setButtonText('Explore Stays');
      setCtaLink('/explore');
    } else {
      setTargetType('property');
      setAdType('card');
      setButtonText('View Details');
      setBadgeText('Sponsored');
      setCtaLink('/explore');
    }
  };

  // Auto-calculated discount percent
  const origNum = parseFloat(originalPrice) || 0;
  const discNum = parseFloat(discountedPrice) || 0;
  const discountPercent =
    origNum > discNum && origNum > 0 ? Math.round(((origNum - discNum) / origNum) * 100) : 0;

  // Image file dropzone & upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsUploading(true);
      toast.info('Uploading ad creative to Cloudinary...', 'Uploading Image');
      const res = await uploadImageToCloudinary(file, 'ad_creative');
      if (res?.url) {
        setImageUrl(res.url);
        toast.success('Ad image uploaded and optimized successfully!', 'Upload Complete');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload image. Please try again or paste image URL.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Handler
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) {
      toast.error('Please enter a card headline / resort title.');
      return;
    }
    if (!imageUrl.trim()) {
      toast.error('Please upload an image or provide an image URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Standard Mahastays subHeadline used by frontend homepage cards
      const computedSub = `${duration.trim()} · ${viewType.trim()} · ₹${parseInt(
        originalPrice,
        10
      ).toLocaleString('en-IN')} ₹${parseInt(discountedPrice, 10).toLocaleString(
        'en-IN'
      )} (${discountPercent}% OFF) · ${location.trim()}`;

      let targetPage = '/';
      if (placement === 'packages') targetPage = '/packages';
      else if (placement === 'experiences') targetPage = '/experiences';
      else if (placement === 'stays') targetPage = '/explore';

      createAdCampaign(
        {
          adName: adName.trim() || headline.trim(),
          adType,
          placement,
          target: {
            targetType,
            targetId: selectedTargetId || '',
            targetTitle: headline.trim(),
            ctaLink: ctaLink.trim() || targetPage,
          },
          creative: {
            headline: headline.trim(),
            subHeadline: computedSub,
            imageUrl: imageUrl.trim(),
            buttonText: buttonText.trim() || 'View Details',
            badgeText: badgeText.trim() || 'Sponsored',
            price: `₹${parseInt(discountedPrice || '12499', 10).toLocaleString('en-IN')}`,
            priceUnit: placement === 'packages' ? '/ package' : placement === 'experiences' ? '/ person' : '/ night',
          },
          budget: {
            totalBudget: parseFloat(totalBudget) || 25000,
            dailyBudget: parseFloat(dailyBudget) || 1500,
            costPerClick: parseFloat(costPerClick) || 12,
            costPerImpression: 0.15,
            spentSoFar: 0,
          },
          priority,
          isActive,
        },
        isAdmin ? 'admin' : 'vendor',
        user?.id || 'usr_admin',
        user?.name || (isAdmin ? 'Mahastays Operations' : 'Host Partner')
      );

      toast.success('Ad campaign published successfully and is now active!', 'Campaign Created');
      setTimeout(() => {
        router.push('/dashboard/ads');
      }, 500);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create ad campaign');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 space-y-6">
      {/* ─── Breadcrumb & Top Bar ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/ads" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
              Ad Campaigns
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">New Campaign</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/ads')}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Back to Ads Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-poppins flex items-center gap-2">
                <span>Create New Ad Campaign</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  Live Placement
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload image creative, configure deal pricing, and launch high-visibility promotional cards.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/dashboard/ads')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#ea110d] hover:bg-[#d00f0c] text-white transition shadow-md shadow-red-500/25 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Megaphone className="w-3.5 h-3.5" />
                <span>Publish Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ───────────────────────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Placement Section & Promoted Item */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm font-poppins pb-3 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-4 h-4 text-[#ea110d]" />
              <span>Target Placement & Promoted Listing</span>
            </div>

            {/* Section Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Where should this ad appear? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'homepage', label: 'Home Page', desc: 'Special Offers Card', icon: Home, color: 'text-amber-500' },
                  { id: 'stays', label: 'Stays Explore', desc: 'Top Blend Banner', icon: Hotel, color: 'text-rose-500' },
                  { id: 'packages', label: 'Packages', desc: 'Catalog Top Deal', icon: Gift, color: 'text-purple-500' },
                  { id: 'experiences', label: 'Experiences', desc: 'Adventure Spotlight', icon: Compass, color: 'text-emerald-500' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = placement === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePlacementChange(item.id as AdPlacement)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#ea110d] bg-red-50/50 dark:bg-red-950/20 ring-2 ring-red-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#ea110d]' : item.color}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#ea110d]" />}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{item.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Campaign Name (Internal Reference) *
              </label>
              <input
                type="text"
                value={adName}
                onChange={(e) => setAdName(e.target.value)}
                placeholder="e.g. 3 BHK Villa Near Mapro Garden Special Deal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                required
              />
            </div>

            {/* Target Listing Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Existing Listing to Promote (Optional Auto-Fill)
                </label>
                <span className="text-[10px] text-slate-400">Pulls image, title, price & link</span>
              </div>
              <select
                value={selectedTargetId}
                onChange={(e) => handleSelectTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
              >
                <option value="">-- Choose a {targetType === 'property' ? 'Stay' : targetType === 'package' ? 'Package' : 'Experience'} to auto-fill --</option>
                {targetOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title} ({opt.location}) — ₹{opt.price.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 2: Creative Content & Special Deal Pricing */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm font-poppins pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-[#ea110d]" />
              <span>Creative Content & Special Offer Pricing</span>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Card Headline / Resort Title *
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. 3 BHK Villa Near Mapro Garden"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                required
              />
            </div>

            {/* Duration, View Type, Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Stay Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="3D / 2N"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  View / Room Type
                </label>
                <input
                  type="text"
                  value={viewType}
                  onChange={(e) => setViewType(e.target.value)}
                  placeholder="Scenic View"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Destination / City
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Mahabaleshwar, India"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                />
              </div>
            </div>

            {/* Pricing Row: Original Price, Offer Price, Calculated Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="18500"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Special Offer Price (₹) *
                </label>
                <input
                  type="number"
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                  placeholder="12499"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Calculated Discount
                </label>
                <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-[#ea110d] flex items-center justify-between">
                  <span>{discountPercent}% OFF</span>
                  <Percent className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
            </div>

            {/* Badge Text & Color Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. Sponsored or Hot Deal"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Badge Style / Color
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'hot', label: 'Hot Deal', bg: 'bg-[#ea110d]', text: 'text-white' },
                    { id: 'seller', label: 'Best Seller', bg: 'bg-[#16a34a]', text: 'text-white' },
                    { id: 'new', label: 'New Offer', bg: 'bg-[#2563eb]', text: 'text-white' },
                    { id: 'limited', label: 'Limited', bg: 'bg-[#ea580c]', text: 'text-white' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setBadgeStyle(style.id as BadgeStyle)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        style.bg
                      } ${style.text} ${
                        badgeStyle === style.id ? 'ring-2 ring-offset-2 ring-slate-900 shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {badgeStyle === style.id && <Check className="w-2.5 h-2.5" />}
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Link URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Destination Link URL (When customer clicks card) *
              </label>
              <input
                type="text"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/explore/3-bhk-villa-near-mapro-garden"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                required
              />
            </div>
          </div>

          {/* Card 3: Cloudinary Image Upload & Web URL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm font-poppins">
                <UploadCloud className="w-4 h-4 text-[#ea110d]" />
                <span>Ad Creative Media & Cloudinary Upload *</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">WebP Auto-Optimized</span>
            </div>

            {/* Drag & Drop File Upload Zone */}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
                id="ad-image-file-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isUploading
                    ? 'border-[#ea110d] bg-red-50/20 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#ea110d] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <Loader2 className="w-8 h-8 text-[#ea110d] animate-spin" />
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Uploading to Cloudinary & converting to WebP...
                    </div>
                  </div>
                ) : imageUrl ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="w-24 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
                      <img src={imageUrl} alt="Uploaded creative" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Image ready & optimized</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Click here to replace with another file</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#ea110d] flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to upload creative image file
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WEBP (Max 10MB)
                    </div>
                  </div>
                )}
              </div>

              {/* URL Fallback Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Or enter direct Image Web URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#ea110d]/20 focus:border-[#ea110d]"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-2 text-slate-400 hover:text-rose-600 transition"
                      title="Clear image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Settings & Publishing Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Priority (1 - 10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">Higher priority appears first in carousels</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Campaign Visibility
                </label>
                <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ea110d] focus:ring-[#ea110d]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Live & Active</div>
                    <div className="text-[10px] text-slate-500">Instantly displayed on frontend customer view</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Card Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="sticky top-20 space-y-5">
            {/* Live Frontend Card Preview Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider font-poppins">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Frontend Card Preview</span>
                </div>
                <span className="text-[10px] text-slate-400">Real-Time Simulation</span>
              </div>

              {/* Exact Home Offer Card Mockup matching screenshot media_1794314442402_0af61476.jpg */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex justify-center">
                <div className="w-[310px] sm:w-[330px] h-[126px] sm:h-[130px] bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center gap-2.5 sm:gap-3 relative overflow-hidden select-none">
                  {/* Image with category badge */}
                  <div className="relative w-28 sm:w-30 h-full rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={
                        imageUrl ||
                        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={headline || 'Preview'}
                      className="w-full h-full object-cover"
                    />

                    {/* Top-Left Category Badge */}
                    <div
                      className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-xs text-white ${
                        badgeStyle === 'seller'
                          ? 'bg-[#16a34a]'
                          : badgeStyle === 'new'
                          ? 'bg-[#2563eb]'
                          : badgeStyle === 'limited'
                          ? 'bg-[#ea580c]'
                          : 'bg-[#ea110d]'
                      }`}
                    >
                      <span>{badgeText || 'Hot Deal'}</span>
                    </div>

                    {/* Bottom Location Overlay */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[8.5px] font-medium text-white bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{location || 'Mahabaleshwar, India'}</span>
                    </div>
                  </div>

                  {/* Right Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-[13px] leading-tight line-clamp-1 font-poppins">
                        {headline || '3 BHK Villa Near Mapro Garden'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                        {duration || '3D / 2N'} · {viewType || 'Scenic View'}
                      </p>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        {origNum > 0 && (
                          <span className="text-[11px] text-slate-400 line-through">
                            ₹{origNum.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-xs sm:text-[13px] font-extrabold text-slate-900">
                          ₹{(discNum || 12499).toLocaleString('en-IN')}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-[9px] font-bold text-[#ea110d] bg-red-50 px-1 py-0.2 rounded">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-slate-700">
                        <span className="text-slate-600 hover:text-[#ea110d] transition flex items-center gap-1">
                          View Details
                          <span className="text-xs">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span>Placement:</span>
                  <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{placement}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ad Format:</span>
                  <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{adType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isActive ? 'Active & Live' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 text-white space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Admin Direct Publishing</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                As an operations admin, this campaign will be instantly approved and immediately visible on customer-facing pages.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#ea110d] hover:bg-[#d00f0c] text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing Campaign...</span>
                  </>
                ) : (
                  <>
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Publish Ad Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
