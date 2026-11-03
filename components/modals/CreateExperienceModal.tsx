'use client';

import React, { useState } from 'react';
import { X, Sparkles, Timer, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
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
  const [numericPrice, setNumericPrice] = useState('1500');
  const [description, setDescription] = useState('');
  const [guideName, setGuideName] = useState('Rajesh Gaikwad');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80');

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
      numericPrice: parseInt(numericPrice, 10) || 1500,
      description: description.trim() || 'Exciting guided mountain trek with safety gear included.',
      image: imageUrl.trim(),
      vendorId: user?.vendorId || 'vnd_adv_02',
      vendorName: user?.businessName || 'Sahyadri Adventure & Treks',
      guide: {
        name: guideName.trim() || 'Certified Mountaineering Guide',
        role: 'Naturalist & Mountain Guide',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      slots: [
        { slotId: 'slot_morn', time: '06:00 AM - 10:00 AM', label: 'Morning Slot', capacity: 15, price: parseInt(numericPrice, 10) || 1500 },
        { slotId: 'slot_eve', time: '03:30 PM - 07:00 PM', label: 'Sunset Slot', capacity: 15, price: parseInt(numericPrice, 10) || 1500 },
      ],
      highlights: ['Safety Trekking Poles Included', 'Herbal Mountain Tea & Snacks', 'Certified Guide'],
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Price per Person (₹)</label>
              <input
                type="number"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                required
              />
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
            <label className="font-semibold text-slate-700 dark:text-slate-300">Photo URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
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
              Submit Activity for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
