'use client';

import React, { useState } from 'react';
import { X, Compass, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PackageCategory, PackageType } from '../../types';

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
  const [numericPrice, setNumericPrice] = useState('22000');
  const [shortDesc, setShortDesc] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedProp = properties.find((p) => p.id === propertyId);

    createPackage({
      title: title.trim(),
      propertyId,
      propertyName: matchedProp?.name || 'HillView Heritage Resort & Spa',
      vendorId: user?.vendorId || 'vnd_resort_01',
      vendorName: user?.businessName || 'HillView Hospitality Pvt Ltd',
      packageType,
      category,
      durationDays: parseInt(durationDays, 10) || 3,
      durationNights: parseInt(durationNights, 10) || 2,
      numericPrice: parseInt(numericPrice, 10) || 22000,
      shortDesc: shortDesc.trim() || 'Curated romantic getaway with all inclusions.',
      thumbnail,
      images: [thumbnail],
      inclusions: [
        { title: 'Accommodation', desc: `${durationNights} nights luxury valley view stay` },
        { title: 'Meals', desc: 'Complimentary breakfast & chef dinner' },
        { title: 'Activities', desc: 'Strawberry plucking tour & evening bonfire' },
      ],
      exclusions: ['Flight / Railway tickets', 'Personal laundry'],
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
              <label className="font-semibold text-slate-700 dark:text-slate-300">Price (₹ / Person)</label>
              <input
                type="number"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                required
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
            <label className="font-semibold text-slate-700 dark:text-slate-300">Cover Thumbnail URL</label>
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
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
