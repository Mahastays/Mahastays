'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  DollarSign,
  Image as ImageIcon,
  Star,
  Eye,
  Check,
  Percent,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AdCampaignItem, AdPlacement, AdType } from '../../types';

interface EditAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: AdCampaignItem | null;
}

export default function EditAdModal({ isOpen, onClose, ad }: EditAdModalProps) {
  const { user, activeViewMode } = useAuth();
  const { updateAdCampaign } = useData();

  const [adName, setAdName] = useState('');
  const [headline, setHeadline] = useState('');
  const [duration, setDuration] = useState('3D / 2N');
  const [viewType, setViewType] = useState('Ocean View');
  const [location, setLocation] = useState('Bali, Indonesia');
  const [originalPrice, setOriginalPrice] = useState('18500');
  const [discountedPrice, setDiscountedPrice] = useState('12499');
  const [badgeText, setBadgeText] = useState('Hot Deal');
  const [badgeType, setBadgeType] = useState<'hot' | 'seller' | 'new' | 'limited'>('hot');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaLink, setCtaLink] = useState('/explore');
  const [placement, setPlacement] = useState<AdPlacement>('homepage');
  const [priority, setPriority] = useState<number>(5);
  const [isActive, setIsActive] = useState(true);

  // Parse existing ad data when modal opens
  useEffect(() => {
    if (ad && isOpen) {
      setAdName(ad.adName || '');
      setHeadline(ad.creative?.headline || ad.adName || '');
      setImageUrl(ad.creative?.imageUrl || '');
      setCtaLink(ad.target?.ctaLink || '/explore');
      setPlacement(ad.placement || 'homepage');
      setPriority(ad.priority || 5);
      setIsActive(Boolean(ad.isActive));

      const sub = ad.creative?.subHeadline || '';
      // Format: "3D / 2N · Ocean View · ₹18,500 ₹12,499 (32% OFF) · Bali, Indonesia"
      const parts = sub.split(' · ');
      if (parts.length >= 4) {
        setDuration(parts[0] || '3D / 2N');
        setViewType(parts[1] || 'Ocean View');
        setLocation(parts[3] || 'Bali, Indonesia');

        const numMatches = parts[2]?.match(/₹?([\d,]+)/g);
        if (numMatches && numMatches.length >= 2) {
          setOriginalPrice(numMatches[0].replace(/[₹,]/g, ''));
          setDiscountedPrice(numMatches[1].replace(/[₹,]/g, ''));
        }
      } else {
        setDuration('3D / 2N');
        setViewType('Scenic View');
        setLocation('Mahabaleshwar, India');
        setOriginalPrice('18500');
        setDiscountedPrice('12499');
      }

      const bText = ad.creative?.badgeText || 'Hot Deal';
      setBadgeText(bText);
      const bLower = bText.toLowerCase();
      if (bLower.includes('seller')) setBadgeType('seller');
      else if (bLower.includes('new')) setBadgeType('new');
      else if (bLower.includes('limit')) setBadgeType('limited');
      else setBadgeType('hot');
    }
  }, [ad, isOpen]);

  if (!isOpen || !ad) return null;

  // Auto-calculated discount percent
  const origNum = parseFloat(originalPrice) || 0;
  const discNum = parseFloat(discountedPrice) || 0;
  const discountPercent =
    origNum > discNum && origNum > 0 ? Math.round(((origNum - discNum) / origNum) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) return;

    // Construct the standard Mahastays subHeadline used by the frontend home cards
    const computedSub = `${duration.trim()} · ${viewType.trim()} · ₹${parseInt(
      originalPrice,
      10
    ).toLocaleString('en-IN')} ₹${parseInt(discountedPrice, 10).toLocaleString(
      'en-IN'
    )} (${discountPercent}% OFF) · ${location.trim()}`;

    updateAdCampaign(ad.id, {
      adName: adName.trim() || headline.trim(),
      placement,
      priority,
      isActive,
      target: {
        ...ad.target,
        ctaLink: ctaLink.trim() || '/explore',
      },
      creative: {
        ...ad.creative,
        headline: headline.trim(),
        subHeadline: computedSub,
        imageUrl: imageUrl.trim(),
        badgeText: badgeText.trim() || 'Hot Deal',
        buttonText: 'View Details',
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ea110d]/10 text-[#ea110d] flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Edit Home Ad Campaign
              </h3>
              <p className="text-xs text-slate-400">
                Modify title, pricing, location, badge, and media for live display on the customer homepage
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
            {/* Live Frontend Card Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-500" />
                <span>Live Frontend Card Preview</span>
              </span>

              {/* Exact Card Preview */}
              <div className="w-full max-w-[340px] h-[130px] bg-white rounded-2xl p-3 border border-slate-100 shadow-md flex items-center gap-3 relative mx-auto">
                <div className="relative w-28 h-full rounded-xl overflow-hidden shrink-0 bg-slate-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={headline}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  {/* Badge */}
                  <div
                    className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs ${
                      badgeType === 'hot'
                        ? 'bg-[#ea110d]'
                        : badgeType === 'seller'
                        ? 'bg-[#16a34a]'
                        : badgeType === 'new'
                        ? 'bg-[#2563eb]'
                        : 'bg-[#ea580c]'
                    }`}
                  >
                    {badgeText || 'Special Offer'}
                  </div>

                  {/* Location pill */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[8px] font-semibold text-white flex items-center gap-1 truncate">
                    <MapPin className="w-2.5 h-2.5 shrink-0 text-white" />
                    <span className="truncate">{location || 'Location'}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 truncate font-poppins">
                      {headline || 'Resort Title'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {duration} · {viewType}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{parseInt(originalPrice || '0', 10).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-black text-slate-900 font-poppins">
                        ₹{parseInt(discountedPrice || '0', 10).toLocaleString('en-IN')}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-[9px] font-bold text-[#ea110d] bg-red-50 px-1 py-0.2 rounded">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 hover:text-[#ea110d] flex items-center gap-1 mt-1">
                      <span>View Details</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Name & Headline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={adName}
                  onChange={(e) => setAdName(e.target.value)}
                  placeholder="e.g. Evershine Grand Resort - Ocean View"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Card Headline / Resort Title *
                </label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Evershine Grand Resort"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>
            </div>

            {/* Duration, View Type, and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Stay Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3D / 2N"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  View / Room Type
                </label>
                <input
                  type="text"
                  value={viewType}
                  onChange={(e) => setViewType(e.target.value)}
                  placeholder="e.g. Ocean View or Private Pool"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Destination / City
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bali, Indonesia or Mahabaleshwar"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="18500"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Special Offer Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                  placeholder="12499"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[#ea110d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Calculated Discount
                </label>
                <div className="p-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>{discountPercent}% OFF</span>
                  <Percent className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Badge Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. Hot Deal, Best Seller, New Offer"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Badge Style / Color
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'hot', label: 'Hot Deal', color: 'bg-[#ea110d]' },
                      { id: 'seller', label: 'Best Seller', color: 'bg-[#16a34a]' },
                      { id: 'new', label: 'New Offer', color: 'bg-[#2563eb]' },
                      { id: 'limited', label: 'Limited', color: 'bg-[#ea580c]' },
                    ] as const
                  ).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBadgeType(b.id);
                        if (!badgeText || badgeText === 'Hot Deal' || badgeText === 'Best Seller' || badgeText === 'New Offer' || badgeText === 'Limited Offer') {
                          setBadgeText(b.label);
                        }
                      }}
                      className={`p-1.5 rounded-xl text-[10px] font-bold text-white transition ${b.color} ${
                        badgeType === b.id ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-102' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image URL & Destination Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Image Web URL *
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Destination Link URL
                </label>
                <input
                  type="text"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="e.g. /explore or /packages"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Priority & Live Status Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Display Priority (1 - 10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value, 10) || 5)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Live &amp; Active (Shown on Frontend)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl text-xs font-semibold bg-[#ea110d] hover:bg-[#d00f0c] text-white transition shadow-sm cursor-pointer"
            >
              Save Changes to Database
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

