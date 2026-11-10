'use client';

import React, { useState, useRef } from 'react';
import { X, Building2, Plus, BedDouble, MapPin, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { uploadImageToCloudinary } from '@/lib/upload';
import { PropertyType } from '../../types';
import { toast } from '../ui/Toast';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePropertyModal({ isOpen, onClose }: CreatePropertyModalProps) {
  const { user } = useAuth();
  const { createProperty } = useData();

  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('resort');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Mahabaleshwar');
  const [numericPrice, setNumericPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomPrice, setRoomPrice] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) {
        setImageUrl(res.url);
        toast.success('Property photo uploaded', 'Image Uploaded');
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
    if (!name.trim()) return;

    createProperty({
      name: name.trim(),
      propertyType,
      tagline: tagline.trim() || undefined,
      description: description.trim(),
      location: location.trim(),
      city: city.trim(),
      numericPrice: parseInt(numericPrice, 10) || 0,
      images: imageUrl.trim() ? [imageUrl.trim()] : [],
      vendorId: user?.vendorId || user?.id || '',
      vendorName: user?.businessName || user?.name || '',
      address: {
        fullAddress: location.trim() || `${city.trim()}, Maharashtra`,
        lat: 17.9242,
        lng: 73.8015,
        mapLink: 'https://www.google.com/maps?q=17.9242,73.8015',
      },
      rooms: [
        {
          roomId: `rm_${Date.now()}`,
          name: roomName.trim() || 'Deluxe Room',
          maxGuests: 2,
          basePrice: parseInt(roomPrice, 10) || parseInt(numericPrice, 10) || 0,
          count: 1,
          images: imageUrl.trim() ? [imageUrl.trim()] : [],
          amenities: ['Free WiFi'],
        },
      ],
      amenities: ['Free WiFi'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              List New Hotel / Stay
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
            Note: New property submissions are automatically reviewed by the Mahastays compliance team before being shown to users.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Property Name</label>
              <input
                type="text"
                placeholder="e.g. Pine Forest Luxury Resort"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="resort">Resort</option>
                <option value="villa">Private Villa</option>
                <option value="hotel">Boutique Hotel</option>
                <option value="cottage">Alpine Cottage</option>
                <option value="apartment">Serviced Apartment</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Tagline</label>
            <input
              type="text"
              placeholder="e.g. Serene Mountain View Luxury with Private Jacuzzis"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Describe the hospitality, architecture, and scenic views..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Address / Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">City / Region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Starting Room Price (₹ / night)</label>
              <input
                type="number"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
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
                      <span>Upload Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-rose-500" />
              Primary Room Unit
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="number"
                placeholder="Room Price (₹)"
                value={roomPrice}
                onChange={(e) => setRoomPrice(e.target.value)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
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
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
