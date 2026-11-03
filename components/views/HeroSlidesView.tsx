'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/upload';
import { HeroSlide } from '@/types';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';

export default function HeroSlidesView() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');
  const [badge, setBadge] = useState('Curated Collection');
  const [ctaText, setCtaText] = useState('Explore Stays');
  const [ctaLink, setCtaLink] = useState('/explore');
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<{ format?: string; bytes?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Preview Active Slide Index
  const [previewIndex, setPreviewIndex] = useState(0);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);
  const [isDeletingSlide, setIsDeletingSlide] = useState(false);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/hero-slides');
      const data = res.data?.data || res.data || [];
      setSlides(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load hero slides from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // Auto cycle preview slide every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingSlide(null);
    setTitle('');
    setSubtitle('');
    setParagraph('');
    setImageUrl('');
    setCloudinaryPublicId('');
    setBadge('Curated Collection');
    setCtaText('Explore Stays');
    setCtaLink('/explore');
    setOrder(slides.length);
    setIsActive(true);
    setUploadError(null);
    setUploadStats(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setTitle(slide.title);
    setSubtitle(slide.subtitle || '');
    setParagraph(slide.paragraph || '');
    setImageUrl(slide.image);
    setCloudinaryPublicId(slide.cloudinaryPublicId || '');
    setBadge(slide.badge || 'Curated Collection');
    setCtaText(slide.ctaText || 'Explore Stays');
    setCtaLink(slide.ctaLink || '/explore');
    setOrder(slide.order ?? 0);
    setIsActive(slide.isActive !== false);
    setUploadError(null);
    setUploadStats(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlide(null);
    setUploadError(null);
  };

  // Handle Image File Upload to Cloudinary with WebP conversion
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const result = await uploadImageToCloudinary(file, 'hero_slide');

      setImageUrl(result.url);
      setCloudinaryPublicId(result.publicId || '');
      setUploadStats({
        format: result.format || 'webp',
        bytes: result.bytes,
      });
      showNotification('Image uploaded and optimized to WebP successfully!');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload image to Cloudinary.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Heading title is required');
      return;
    }
    if (!imageUrl.trim()) {
      alert('Please provide a background image or upload one.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        paragraph: paragraph.trim(),
        image: imageUrl.trim(),
        cloudinaryPublicId: cloudinaryPublicId.trim() || undefined,
        badge: badge.trim(),
        ctaText: ctaText.trim(),
        ctaLink: ctaLink.trim(),
        order: Number(order) || 0,
        isActive,
      };

      if (editingSlide) {
        await api.put(`/admin/hero-slides/${editingSlide.id}`, payload);
        showNotification('Hero slide updated successfully.');
      } else {
        await api.post('/admin/hero-slides', payload);
        showNotification('New hero slide created successfully.');
      }

      closeModal();
      fetchSlides();
    } catch (err: any) {
      alert(err?.message || 'Failed to save hero slide.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      const nextActive = !slide.isActive;
      await api.patch(`/admin/hero-slides/${slide.id}/active`, { isActive: nextActive });
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, isActive: nextActive } : s))
      );
      showNotification(`Slide is now ${nextActive ? 'Active' : 'Hidden'}.`);
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle slide status.');
    }
  };

  // Delete Slide
  const handleDelete = async () => {
    if (!slideToDelete) return;
    try {
      setIsDeletingSlide(true);
      await api.delete(`/admin/hero-slides/${slideToDelete.id}`);
      setSlides((prev) => prev.filter((s) => s.id !== slideToDelete.id));
      showNotification(`Hero slide "${slideToDelete.title}" deleted.`);
      setSlideToDelete(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete hero slide.');
    } finally {
      setIsDeletingSlide(false);
    }
  };

  const activeSlides = slides.filter((s) => s.isActive);
  const currentPreview = slides[previewIndex] || slides[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ─── Top Notification Banner ─── */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-950/20 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Hero Section Carousel &amp; Banners
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage auto-carousel background images, dynamic headings, and subheadings. Images uploaded to Cloudinary are automatically converted to optimized WebP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSlides}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Refresh Slides"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hero Slide</span>
          </button>
        </div>
      </div>

      {/* ─── Live Preview Card ─── */}
      {currentPreview && (
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Live Auto-Carousel Preview (Slide {previewIndex + 1} of {slides.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === previewIndex ? 'w-6 bg-rose-600' : 'w-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label={`Jump to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="relative h-[280px] sm:h-[340px] w-full overflow-hidden bg-slate-900">
            {/* Background Image */}
            <img
              src={currentPreview.image}
              alt={currentPreview.title}
              className="w-full h-full object-cover object-[center_40%] transition-all duration-700"
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

            {/* Slide Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 z-10">
              {currentPreview.badge && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-600/90 text-white w-fit mb-2 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  {currentPreview.badge}
                </span>
              )}
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight max-w-2xl drop-shadow">
                {currentPreview.title}
                {currentPreview.subtitle && (
                  <span className="block font-medium opacity-95">{currentPreview.subtitle}</span>
                )}
              </h2>
              {currentPreview.paragraph && (
                <p className="mt-2 text-xs sm:text-sm text-slate-200/90 max-w-xl line-clamp-2">
                  {currentPreview.paragraph}
                </p>
              )}
              {currentPreview.ctaText && (
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-900 font-semibold text-xs shadow-md">
                    {currentPreview.ctaText}
                    <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
                  </span>
                </div>
              )}
            </div>

            {/* Cloudinary WebP pill */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-medium text-emerald-400">
              <Check className="w-3 h-3" />
              <span>Cloudinary WebP Auto-Optimized</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Slides List Table / Grid ─── */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Configured Carousel Slides ({slides.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeSlides.length} active on the homepage hero section. Order determines display sequence.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
            <p className="text-sm">Loading hero slides...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50/50 dark:bg-red-950/20 text-sm">
            {error}
          </div>
        ) : slides.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No Hero Slides Configured</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Add your first hero banner slide with a high-resolution background image, heading, and subheading.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Slide</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition group"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="relative w-28 h-20 sm:w-36 sm:h-22 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                      #{slide.order ?? index}
                    </span>
                  </div>

                  {/* Texts */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {slide.title}
                      </span>
                      {slide.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                          {slide.badge}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          slide.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {slide.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    {slide.subtitle && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                        {slide.subtitle}
                      </p>
                    )}

                    {slide.paragraph && (
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {slide.paragraph}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>CTA: {slide.ctaText || 'None'} ({slide.ctaLink || '/explore'})</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">WebP</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* Active Toggle Button */}
                  <button
                    onClick={() => handleToggleActive(slide)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      slide.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {slide.isActive ? 'Active' : 'Inactive'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(slide)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Slide"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setSlideToDelete(slide)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Create / Edit Slide Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set background banner image, heading headline, subheading, and CTA button.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Cloudinary Image Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Background Banner Image (Cloudinary WebP Auto-Optimized) *
                </label>

                {/* Upload Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-rose-500 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/40 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {isUploading ? 'Uploading & converting to WebP...' : 'Click to upload image'}
                      </span>
                      <span className="text-xs text-slate-500"> or drag and drop</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      PNG, JPG, WEBP up to 10MB. Images are automatically compressed &amp; converted to WebP.
                    </p>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {uploadError}
                  </p>
                )}

                {uploadStats && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                    <span>✓ Converted to WebP format ({uploadStats.format})</span>
                    {uploadStats.bytes && (
                      <span className="font-semibold">
                        {(uploadStats.bytes / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                )}

                {/* Image URL text fallback / preview */}
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Or paste direct image URL (https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {/* Thumbnail Preview */}
                {imageUrl && (
                  <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mt-2">
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-3 text-xs text-white font-medium drop-shadow">
                      Previewing Banner
                    </span>
                  </div>
                )}
              </div>

              {/* Heading Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Main Heading Title (Line 1) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unwind in Stunning Resorts,"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Subheading (Line 2) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subheading (Line 2)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stay in Elegant Hotels."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Paragraph Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description Paragraph (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handpicked luxury villas, beachfront retreats, and mountain estates across Maharashtra."
                  value={paragraph}
                  onChange={(e) => setParagraph(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Grid: Badge Tag & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Badge Tag (e.g. Curated Collection)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Display Order (0 = first)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Grid: CTA Text & CTA Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Stays"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    CTA Button Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /explore"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Active Toggle Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slideIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <label htmlFor="slideIsActive" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Activate this slide immediately on the homepage auto-carousel
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition"
                >
                  {isSubmitting ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Slide Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(slideToDelete)}
        onClose={() => setSlideToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Hero Banner Slide?"
        itemName={slideToDelete?.title}
        itemType="hero banner slide"
        isDeleting={isDeletingSlide}
        message={
          <p>
            Are you sure you want to permanently delete hero slide{' '}
            <strong className="text-slate-800 dark:text-slate-200">{slideToDelete?.title}</strong>? This slide will be removed from the customer homepage carousel immediately.
          </p>
        }
      />
    </div>
  );
}

