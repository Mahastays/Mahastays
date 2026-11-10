'use client';

import React, { useState, useRef } from 'react';
import { X, Compass, Calendar, UploadCloud, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { uploadImageToCloudinary } from '@/lib/upload';
import { PackageCategory, PackageType } from '../../types';
import { toast } from '../ui/Toast';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePackageModal({ isOpen, onClose }: CreatePackageModalProps) {
  const { user } = useAuth();
  const { properties, createPackage } = useData();

  const [title, setTitle] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [packageType, setPackageType] = useState<PackageType>('couple');
  const [category, setCategory] = useState<PackageCategory>('Honeymoon');
  const [durationDays, setDurationDays] = useState('3');
  const [durationNights, setDurationNights] = useState('2');
  const [priceType, setPriceType] = useState<'per_person' | 'per_night'>('per_person');
  const [personLimit, setPersonLimit] = useState('6');
  const [numericPrice, setNumericPrice] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) {
        setThumbnail(res.url);
        toast.success('Package thumbnail uploaded', 'Image Uploaded');
      }
    } catch (err: any) {
      toast.error(`Photo upload failed: ${err.message || 'Please try again'}`, 'Upload Failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedProp = properties.find((p) => p.id === propertyId);

    createPackage({
      title: title.trim(),
      propertyId,
      propertyName: matchedProp?.name || '',
      vendorId: user?.vendorId || user?.id || '',
      vendorName: user?.businessName || user?.name || '',
      priceType,
      personLimit: parseInt(personLimit, 10) || 6,
      packageType,
      category,
      durationDays: parseInt(durationDays, 10) || 1,
      durationNights: parseInt(durationNights, 10) || 1,
      numericPrice: parseInt(numericPrice, 10) || 0,
      shortDesc: shortDesc.trim(),
      thumbnail,
      images: thumbnail ? [thumbnail] : [],
      inclusions: [
        { title: 'Accommodation', desc: `${durationNights} nights stay` },
        { title: 'Meals', desc: 'Complimentary breakfast' },
      ],
      exclusions: ['Personal expenses'],
      tiers: [
        {
          tierId: 'tier_classic',
          name: 'Classic Tier',
          pricePerPerson: parseInt(numericPrice, 10) || 22000,
          features: ['Valley Room Stay', 'All Meals Included', 'Free Sightseeing Pass'],
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Create New Tour Package
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-200">
            Tour packages must link to an approved host property and require admin review prior to user booking.
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Package Title</label>
            <input
              type="text"
              placeholder="e.g. 3-Day Strawberry Country Honeymoon Special"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Linked Hotel Stay</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PackageCategory)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Honeymoon">Honeymoon</option>
                <option value="Luxury">Luxury</option>
                <option value="Adventure">Adventure</option>
                <option value="Heritage">Heritage</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Days</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Nights</label>
              <input
                type="number"
                value={durationNights}
                onChange={(e) => setDurationNights(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Price (₹ {priceType === 'per_night' ? '/ Night' : '/ Person'})
              </label>
              <input
                type="number"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Pricing Model</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="per_person">👤 Per Person (Increases with guests)</option>
                <option value="per_night">🌙 Per Night / Flat</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Person Limit (Max Guests)</label>
              <input
                type="number"
                min="1"
                placeholder="6"
                value={personLimit}
                onChange={(e) => setPersonLimit(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Short Summary</label>
            <textarea
              rows={2}
              placeholder="Highlight meals, private candlelight dinner, or farm passes included..."
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Cover Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {thumbnail ? (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-[11px] text-emerald-600 font-bold flex-1 truncate">Photo Uploaded</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] px-2 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 text-slate-700 dark:text-slate-200 font-bold"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnail('')}
                  className="text-[10px] px-1.5 py-1 text-rose-500 font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-rose-500" />
                    <span>Upload Package Photo</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
            >
              Submit Package for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
