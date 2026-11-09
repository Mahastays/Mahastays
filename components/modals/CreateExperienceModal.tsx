'use client';

import React, { useState, useRef } from 'react';
import { X, Sparkles, Timer, MapPin, UploadCloud, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { uploadImageToCloudinary } from '@/lib/upload';
import { Difficulty } from '../../types';

interface CreateExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateExperienceModal({ isOpen, onClose }: CreateExperienceModalProps) {
  const { user } = useAuth();
  const { createExperience } = useData();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Trekking');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [duration, setDuration] = useState('4 Hours');
  const [city, setCity] = useState('Mahabaleshwar');
  const [priceType, setPriceType] = useState<'per_person' | 'per_night'>('per_person');
  const [personLimit, setPersonLimit] = useState('15');
  const [numericPrice, setNumericPrice] = useState('');
  const [description, setDescription] = useState('');
  const [guideName, setGuideName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) setImageUrl(res.url);
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createExperience({
      title: title.trim(),
      category,
      difficulty,
      duration,
      city,
      priceType,
      personLimit: parseInt(personLimit, 10) || 15,
      numericPrice: parseInt(numericPrice, 10) || 0,
      description: description.trim(),
      image: imageUrl.trim(),
      vendorId: user?.vendorId || user?.id || '',
      vendorName: user?.businessName || user?.name || '',
      guide: {
        name: guideName.trim() || user?.name || 'Lead Guide',
        role: 'Certified Guide',
        avatar: '',
      },
      slots: [
        { slotId: `slot_${Date.now()}`, time: '07:00 AM - 11:00 AM', label: 'Morning Batch', capacity: 10, price: parseInt(numericPrice, 10) || 0 },
      ],
      highlights: ['Certified Guide'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Add Mountain Experience / Trek
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
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Activity Title</label>
            <input
              type="text"
              placeholder="e.g. Lingmala Waterfall Hidden Trail Trek"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Trekking">Trekking</option>
                <option value="Adventure">Adventure</option>
                <option value="Culture & Food">Culture & Food</option>
                <option value="Cruises">Boating & Water</option>
                <option value="Safari & Desert">Wildlife Safari</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Easy">Easy (Family Friendly)</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Price (₹ {priceType === 'per_night' ? '/ Session' : '/ Person'})
              </label>
              <input
                type="number"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Pricing Model</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="per_person">👤 Per Person</option>
                <option value="per_night">🌙 Per Night / Flat</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Person Limit</label>
              <input
                type="number"
                min="1"
                placeholder="15"
                value={personLimit}
                onChange={(e) => setPersonLimit(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Lead Guide Name</label>
              <input
                type="text"
                value={guideName}
                onChange={(e) => setGuideName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              />
            </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Trail details, terrain info, views, and equipment provided..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Activity Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {imageUrl ? (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
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
                  onClick={() => setImageUrl('')}
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
                    <span>Upload Activity Photo</span>
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
              Submit Activity for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
