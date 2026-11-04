'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  DollarSign,
  Target,
  Sparkles,
  Image as ImageIcon,
  Home,
  Hotel,
  Gift,
  Compass,
  Layers,
  Star,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AdPlacement, AdTargetType, AdType } from '../../types';

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlacement?: AdPlacement;
  defaultTargetType?: AdTargetType;
}

export default function CreateAdModal({
  isOpen,
  onClose,
  defaultPlacement = 'homepage',
  defaultTargetType,
}: CreateAdModalProps) {
  const { user, activeViewMode } = useAuth();
  const { properties, packages, experiences, createAdCampaign } = useData();

  const isAdmin = activeViewMode === 'admin';

  const [adName, setAdName] = useState('');
  const [adType, setAdType] = useState<AdType>('banner');
  const [placement, setPlacement] = useState<AdPlacement>(defaultPlacement);
  const [targetType, setTargetType] = useState<AdTargetType>(
    defaultTargetType || (defaultPlacement === 'packages' ? 'package' : defaultPlacement === 'experiences' ? 'activity' : 'property')
  );
  const [targetId, setTargetId] = useState('');
  const [headline, setHeadline] = useState('');
  const [subHeadline, setSubHeadline] = useState('');
  const [badgeText, setBadgeText] = useState('Sponsored');
  const [buttonText, setButtonText] = useState('Explore Stays');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('/ night');
  const [features, setFeatures] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [totalBudget, setTotalBudget] = useState('10000');
  const [dailyBudget, setDailyBudget] = useState('1000');
  const [costPerClick, setCostPerClick] = useState('10');

  // Sync state whenever modal opens or defaultPlacement changes
  useEffect(() => {
    if (isOpen) {
      const pl = defaultPlacement || 'homepage';
      setPlacement(pl);

      if (pl === 'packages') {
        setTargetType('package');
        setButtonText('Explore Packages');
        setPriceUnit('/ package');
      } else if (pl === 'experiences') {
        setTargetType('activity');
        setButtonText('Explore Experiences');
        setPriceUnit('/ person');
      } else if (pl === 'stays') {
        setTargetType('property');
        setButtonText('Explore Stays');
        setPriceUnit('/ night');
      } else {
        setTargetType('property');
        setButtonText('Book Now');
        setPriceUnit('/ night');
      }
    }
  }, [isOpen, defaultPlacement]);

  if (!isOpen) return null;

  // Options for targets based on type
  const targetOptions =
    targetType === 'property'
      ? properties.map((p) => ({ id: p.id, title: p.name, link: `/explore/${p.code || p.id}` }))
      : targetType === 'package'
      ? packages.map((p) => ({ id: p.id, title: p.title, link: `/packages/${p.code || p.id}` }))
      : experiences.map((e) => ({ id: e.id, title: e.title, link: `/experiences/${e.code || e.id}` }));

  const handleSectionChange = (newPlacement: AdPlacement) => {
    setPlacement(newPlacement);
    if (newPlacement === 'packages') {
      setTargetType('package');
      setButtonText('Explore Packages');
      setPriceUnit('/ package');
      if (packages[0]?.id) setTargetId(packages[0].id);
    } else if (newPlacement === 'experiences') {
      setTargetType('activity');
      setButtonText('Explore Experiences');
      setPriceUnit('/ person');
      if (experiences[0]?.id) setTargetId(experiences[0].id);
    } else if (newPlacement === 'stays') {
      setTargetType('property');
      setButtonText('Explore Stays');
      setPriceUnit('/ night');
      if (properties[0]?.id) setTargetId(properties[0].id);
    } else {
      setAdType('card');
      setTargetType('property');
      setButtonText('View Details');
      setBadgeText('Hot Deal');
      setPriceUnit('/ night');
      if (properties[0]?.id) setTargetId(properties[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName.trim() || !headline.trim()) return;

    const currentTargetId = targetId || targetOptions[0]?.id || '';
    const selectedTarget = targetOptions.find((t) => t.id === currentTargetId) || targetOptions[0];

    // Backend-safe placement: map section to standard placement while storing targeting.showOnPages
    let backendPlacement: AdPlacement = 'homepage';
    let targetPage = '/';
    if (placement === 'packages') {
      backendPlacement = 'all';
      targetPage = '/packages';
    } else if (placement === 'experiences') {
      backendPlacement = 'all';
      targetPage = '/experiences';
    } else if (placement === 'stays') {
      backendPlacement = 'search_results';
      targetPage = '/explore';
    } else if (placement === 'homepage' || placement === 'home') {
      backendPlacement = 'homepage';
      targetPage = '/';
    } else {
      backendPlacement = 'all';
      targetPage = '/';
    }

    const featureList = features
      .split('•')
      .map((f) => f.trim())
      .filter(Boolean);

    createAdCampaign(
      {
        adName: adName.trim(),
        adType,
        placement, // preserves frontend tab placement (packages, experiences, stays, homepage)
        target: {
          targetType,
          targetId: selectedTarget?.id || currentTargetId,
          targetTitle: selectedTarget?.title || 'Selected Listing',
          ctaLink: selectedTarget?.link || targetPage,
        },
        creative: {
          headline: headline.trim(),
          subHeadline: subHeadline.trim() || undefined,
          imageUrl: imageUrl.trim(),
          buttonText: buttonText.trim() || 'Book Now',
          badgeText: badgeText.trim() || 'Sponsored',
          price: price.trim() || undefined,
          priceUnit: priceUnit.trim() || undefined,
          features: featureList,
        },
        budget: {
          totalBudget: parseFloat(totalBudget) || 25000,
          dailyBudget: parseFloat(dailyBudget) || 1500,
          costPerClick: parseFloat(costPerClick) || 12,
          costPerImpression: 0.15,
          spentSoFar: 0,
        },
        priority: isAdmin ? 8 : 5,
      },
      isAdmin ? 'admin' : 'vendor',
      user?.id || 'usr_demo',
      user?.name || (isAdmin ? 'Mahastays Operations' : 'Host Partner')
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isAdmin ? 'Create Page Header & Banner Ad' : 'Promote Your Listing'}
              </h3>
              <p className="text-xs text-slate-400">
                Publish white-to-image blend ads across Home, Stays, Packages, and Experience headers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-xs">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* ─── Page Section Selector (Home, Stays, Packages, Experiences) ─── */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              Target Page Section (Where will this ad appear?)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'homepage' as AdPlacement,
                  label: 'Home Page',
                  icon: Home,
                  color: 'text-amber-500',
                  badge: 'Hero / Spot',
                },
                {
                  id: 'stays' as AdPlacement,
                  label: 'Stays Header',
                  icon: Hotel,
                  color: 'text-rose-500',
                  badge: '/explore',
                },
                {
                  id: 'packages' as AdPlacement,
                  label: 'Packages Header',
                  icon: Gift,
                  color: 'text-purple-500',
                  badge: '/packages',
                },
                {
                  id: 'experiences' as AdPlacement,
                  label: 'Experience Header',
                  icon: Compass,
                  color: 'text-emerald-500',
                  badge: '/experiences',
                },
              ].map((sec) => {
                const Icon = sec.icon;
                const isSelected = placement === sec.id;
                return (
                  <button
                    type="button"
                    key={sec.id}
                    onClick={() => handleSectionChange(sec.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 shadow-xs ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${sec.color}`} />
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                        {sec.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs mt-1">{sec.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campaign Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Campaign Internal Name</label>
            <input
              type="text"
              placeholder="e.g. Monsoon 20% Off Luxury Villas Header"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-xs"
              required
            />
          </div>

          {/* Promoted Target & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Promoted Type</label>
              <select
                value={targetType}
                onChange={(e) => {
                  const t = e.target.value as AdTargetType;
                  setTargetType(t);
                  if (t === 'property') setTargetId(properties[0]?.id || '');
                  if (t === 'package') setTargetId(packages[0]?.id || '');
                  if (t === 'activity') setTargetId(experiences[0]?.id || '');
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="property">Hotel / Resort / Villa</option>
                <option value="package">Holiday Tour Package</option>
                <option value="activity">Experience / Outdoor Trek</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Listing</label>
              <select
                value={targetId || targetOptions[0]?.id || ''}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                {targetOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── Creative & Visual Inputs (White Blend Banner Spec) ─── */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-rose-500" />
                Ad Creative & Blend Banner Details
              </span>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                White Blend Header Design
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Headline (Title)</label>
              <input
                type="text"
                placeholder="e.g. Lakeview Luxury Villas"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                required
              />
            </div>

            {/* Sub-headline */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Subtitle Description</label>
              <input
                type="text"
                placeholder="e.g. Private pools, stunning views and curated experiences"
                value={subHeadline}
                onChange={(e) => setSubHeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            {/* Features Row */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Key Highlights (Separate with • symbol)
              </label>
              <input
                type="text"
                placeholder="Private Pool • Fine Dining • Curated Experiences"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            {/* Pricing & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Featured Price (₹)</label>
                <input
                  type="text"
                  placeholder="8,999"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-rose-600 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Price Unit</label>
                <input
                  type="text"
                  placeholder="/ night"
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Pill Badge</label>
                <input
                  type="text"
                  placeholder="Sponsored"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            {/* Image URL & Button CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Button CTA Text</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Right Panoramic Photo URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  required
                />
              </div>
            </div>

            {/* Live Visual Mini Preview */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Live White-Blend Header Preview
              </div>
              <div className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white select-none">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, #ffffff 0%, #ffffff 40%, rgba(255, 255, 255, 0.95) 52%, rgba(255, 255, 255, 0.4) 68%, rgba(255, 255, 255, 0) 80%)',
                  }}
                />
                <div className="absolute inset-y-0 left-0 p-3 flex flex-col justify-between max-w-[65%] z-10">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[#ea110d] text-[9px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-[#ea110d]" />
                      {badgeText || 'Sponsored'}
                    </span>
                    <h5 className="font-black text-xs text-slate-900 truncate mt-1">
                      {headline || 'Lakeview Luxury Villas'}
                    </h5>
                    <p className="text-[10px] text-slate-500 truncate">{subHeadline}</p>
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#ea110d] text-white text-[9px] font-bold">
                      {buttonText} →
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs rounded-xl p-1.5 px-2.5 shadow-sm border border-slate-100 flex items-center gap-2 z-10">
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">From</span>
                    <span className="text-xs font-black text-[#ea110d]">₹{price}</span>
                    <span className="text-[9px] text-slate-500 font-semibold">{priceUnit}</span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-slate-900 text-[10px] font-bold">
                    →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Total Budget (₹)</label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Daily Cap (₹)</label>
              <input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Max CPC (₹)</label>
              <input
                type="number"
                value={costPerClick}
                onChange={(e) => setCostPerClick(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-end gap-2.5 bg-slate-50/80 dark:bg-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ea110d] hover:bg-[#d00f0c] text-white transition shadow-md shadow-red-500/25 cursor-pointer"
            >
              {isAdmin ? 'Publish Ad Immediately' : 'Submit Ad for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
