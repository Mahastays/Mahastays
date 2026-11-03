'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Eye,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Plus,
  Trash2,
  MapPin,
  Star,
  Users,
  Sparkles,
  Check,
  Building,
  Camera,
  Layers,
  ListOrdered,
  Calendar,
  Compass,
  Award,
  ShieldCheck,
  ChevronRight,
  Info,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/upload';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchExperienceById,
  updateExperienceAsync,
  approveExperienceAsync,
  rejectExperienceAsync,
} from '@/store/slices/experiencesSlice';
import {
  ExperienceItem,
  ExperienceSlotItem,
  ExperienceTierItem,
  Difficulty,
} from '@/types';

interface ExperienceDetailEditViewProps {
  id: string;
}

const EXPERIENCE_CATEGORIES = [
  'Trekking',
  'Culture & Food',
  'Cruises',
  'Safari & Desert',
  'Adventure',
  'Nature & Sightseeing',
  'Water Sports',
];

const DIFFICULTY_LEVELS: Difficulty[] = ['Easy', 'Moderate', 'Challenging'];

export default function ExperienceDetailEditView({ id }: ExperienceDetailEditViewProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const dispatch = useAppDispatch();
  const { items, selectedExperience, saving } = useAppSelector((state) => state.experiences);

  const isAdmin = activeViewMode === 'admin';

  const [exp, setExp] = useState<ExperienceItem | null>(() => {
    return items.find((e) => e.id === id || e.code === id || e.slug === id) || null;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');
  const [newInclusion, setNewInclusion] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddImage, setShowAddImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Frontend-matching Detail Tabs State
  const [activeDetailTab, setActiveDetailTab] = useState<string>('tiers');
  const tabsScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(true);

  const checkTabScroll = () => {
    if (!tabsScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
    setCanScrollTabsLeft(scrollLeft > 10);
    setCanScrollTabsRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsScrollRef.current) return;
    tabsScrollRef.current.scrollBy({
      left: direction === 'left' ? -200 : 200,
      behavior: 'smooth',
    });
  };

  // Guest simulation for preview booking widget
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    if (id && typeof fetchExperienceById === 'function') {
      dispatch(fetchExperienceById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    const found = items.find((e) => e.id === id || e.code === id || e.slug === id);
    if (found) {
      setExp(found);
    } else if (
      selectedExperience &&
      (selectedExperience.id === id ||
        selectedExperience.code === id ||
        selectedExperience.slug === id)
    ) {
      setExp(selectedExperience);
    }
  }, [items, selectedExperience, id]);

  if (!exp) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading experience details...</p>
        <Link
          href="/dashboard/experiences"
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Experiences Catalog
        </Link>
      </div>
    );
  }

  const isOwnerVendor = !isAdmin && (user?.vendorId === exp.vendorId || user?.id === exp.vendorId);

  if (!isAdmin && !isOwnerVendor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md text-center">
          You only have permission to view and edit experiences assigned to your vendor account ({user?.businessName || user?.name}).
        </p>
        <Link
          href="/dashboard/experiences"
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Experiences
        </Link>
      </div>
    );
  }

  // Ensure default arrays if undefined
  const gallery = exp.gallery && exp.gallery.length > 0 ? exp.gallery : [exp.image];
  const slots: ExperienceSlotItem[] = exp.slots && exp.slots.length > 0
    ? exp.slots
    : [
        { slotId: 's1', time: '06:30 AM', label: 'Sunrise Batch', capacity: 12, price: exp.numericPrice },
        { slotId: 's2', time: '04:00 PM', label: 'Sunset Batch', capacity: 15, price: exp.numericPrice },
      ];
  const tiers: ExperienceTierItem[] = exp.tiers && exp.tiers.length > 0
    ? exp.tiers
    : [
        {
          tierId: 't1',
          name: 'Standard Experience',
          tagline: 'Ideal for solo & casual explorers',
          pricePerPerson: exp.numericPrice,
          originalPrice: exp.originalPrice || exp.numericPrice + 600,
          features: ['Certified Mountain Guide', 'Safety Harness & Gear', 'First-Aid Support'],
        },
        {
          tierId: 't2',
          name: 'VIP Private Trail',
          tagline: 'Private escort with refreshments & photos',
          pricePerPerson: exp.numericPrice + 1200,
          originalPrice: exp.originalPrice ? exp.originalPrice + 1500 : exp.numericPrice + 2000,
          features: ['Private Naturalist Guide', 'Breakfast & Refreshments', 'DSLR High-Res Photo Pack', 'Trek Certificate'],
        },
      ];
  const timeline = exp.timeline && exp.timeline.length > 0
    ? exp.timeline
    : [
        { time: '06:30 AM', title: 'Assembly & Safety Briefing', desc: 'Meet at basecamp, gear up, and undergo a quick 10-min safety briefing.' },
        { time: '07:15 AM', title: 'Trail Ascent & Nature Walk', desc: 'Guided ascent through evergreen forest trails and seasonal waterfalls.' },
        { time: '09:30 AM', title: 'Summit Viewpoint & Refreshments', desc: 'Reach the pinnacle for 360-degree views, photography session, and local snacks.' },
        { time: '11:00 AM', title: 'Descent & Debrief', desc: 'Gentle return trek back to basecamp with souvenir digital certificates.' },
      ];

  const isApproved = exp.status === 'active';
  const isPending = exp.status === 'pending_approval';
  const isRejected = exp.status === 'rejected';

  const handleFieldChange = (field: keyof ExperienceItem, value: any) => {
    setExp((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddSlot = () => {
    if (!exp) return;
    const newSlot: ExperienceSlotItem = {
      slotId: `slot_${Date.now()}`,
      time: '09:00 AM',
      label: 'Morning Slot',
      capacity: 10,
      price: exp.numericPrice,
    };
    setExp({ ...exp, slots: [...slots, newSlot] });
  };

  const handleUpdateSlot = (index: number, field: keyof ExperienceSlotItem, value: any) => {
    if (!exp) return;
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setExp({ ...exp, slots: updated });
  };

  const handleRemoveSlot = (index: number) => {
    if (!exp || slots.length <= 1) return;
    setExp({ ...exp, slots: slots.filter((_, i) => i !== index) });
  };

  const handleAddTier = () => {
    if (!exp) return;
    const newTier: ExperienceTierItem = {
      tierId: `tier_${Date.now()}`,
      name: 'Custom Package Tier',
      tagline: 'Premium all-inclusive experience',
      pricePerPerson: exp.numericPrice + 1500,
      features: ['All Inclusions', 'Exclusive Access', 'Dedicated Guide'],
    };
    setExp({ ...exp, tiers: [...tiers, newTier] });
  };

  const handleUpdateTier = (index: number, field: keyof ExperienceTierItem, value: any) => {
    if (!exp) return;
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setExp({ ...exp, tiers: updated });
  };

  const handleRemoveTier = (index: number) => {
    if (!exp || tiers.length <= 1) return;
    setExp({ ...exp, tiers: tiers.filter((_, i) => i !== index) });
  };

  const handleAddTimelineStep = () => {
    if (!exp) return;
    const newStep = {
      time: '12:00 PM',
      title: 'New Activity Phase',
      desc: 'Description of the planned activity during this segment.',
    };
    setExp({ ...exp, timeline: [...timeline, newStep] });
  };

  const handleUpdateTimelineStep = (index: number, field: 'time' | 'title' | 'desc', value: string) => {
    if (!exp) return;
    const updated = [...timeline];
    updated[index] = { ...updated[index], [field]: value };
    setExp({ ...exp, timeline: updated });
  };

  const handleRemoveTimelineStep = (index: number) => {
    if (!exp || timeline.length <= 1) return;
    setExp({ ...exp, timeline: timeline.filter((_, i) => i !== index) });
  };

  const handleAddHighlight = () => {
    if (!newHighlight.trim() || !exp) return;
    setExp({ ...exp, highlights: [...exp.highlights, newHighlight.trim()] });
    setNewHighlight('');
  };

  const handleRemoveHighlight = (idx: number) => {
    if (!exp) return;
    setExp({ ...exp, highlights: exp.highlights.filter((_, i) => i !== idx) });
  };

  const handleAddInclusion = () => {
    if (!newInclusion.trim() || !exp) return;
    const updatedInclusions = [...(exp.inclusions || []), { title: newInclusion.trim() }];
    setExp({ ...exp, inclusions: updatedInclusions });
    setNewInclusion('');
  };

  const handleRemoveInclusion = (idx: number) => {
    if (!exp || !exp.inclusions) return;
    setExp({ ...exp, inclusions: exp.inclusions.filter((_, i) => i !== idx) });
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim() || !exp) return;
    const updatedGallery = [...gallery, newImageUrl.trim()];
    setExp({ ...exp, gallery: updatedGallery });
    setNewImageUrl('');
    setShowAddImage(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !exp) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadImageToCloudinary(file, 'listing_media');
      if (res?.url) {
        setExp({
          ...exp,
          gallery: [...gallery, res.url],
          image: exp.image || res.url,
        });
        setUploadSuccessToast(`Uploaded & converted to WebP (${Math.round((res.bytes || 0) / 1024)} KB)`);
        setTimeout(() => setUploadSuccessToast(null), 4000);
      }
    } catch (err: any) {
      alert(`Image upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idx: number) => {
    if (!exp || gallery.length <= 1) return;
    const updatedGallery = gallery.filter((_, i) => i !== idx);
    setExp({ ...exp, gallery: updatedGallery, image: updatedGallery[0] || exp.image });
    if (activePhotoIndex >= updatedGallery.length) {
      setActivePhotoIndex(0);
    }
  };

  // Delete confirmation popup modal state
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    title: string;
    itemName?: string;
    message?: React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
  });

  const requestDeleteSlot = (index: number) => {
    if (!exp || slots.length <= 1) {
      alert('Experience must have at least one time slot.');
      return;
    }
    const slot = slots[index];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Time Slot?',
      itemName: slot.time,
      message: (
        <p>
          Are you sure you want to remove the time slot <strong className="text-slate-800 dark:text-slate-200">{slot.time}</strong>?
        </p>
      ),
      onConfirm: () => {
        handleRemoveSlot(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteTier = (index: number) => {
    if (!exp || tiers.length <= 1) {
      alert('Experience must have at least one pricing tier.');
      return;
    }
    const tier = tiers[index];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Pricing Tier?',
      itemName: tier.name,
      message: (
        <p>
          Are you sure you want to delete tier <strong className="text-slate-800 dark:text-slate-200">{tier.name}</strong>?
        </p>
      ),
      onConfirm: () => {
        handleRemoveTier(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteTimelineStep = (index: number) => {
    if (!exp || timeline.length <= 1) return;
    const step = timeline[index];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Timeline Step?',
      itemName: step.title,
      message: (
        <p>
          Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{step.time}: {step.title}</strong>?
        </p>
      ),
      onConfirm: () => {
        handleRemoveTimelineStep(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteHighlight = (index: number) => {
    if (!exp) return;
    const h = exp.highlights[index];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Highlight?',
      itemName: h,
      onConfirm: () => {
        handleRemoveHighlight(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteInclusion = (index: number) => {
    if (!exp?.inclusions) return;
    const item = exp.inclusions[index];
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Inclusion?',
      itemName: item.title,
      onConfirm: () => {
        handleRemoveInclusion(index);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestDeleteImage = (idx: number) => {
    if (!exp || gallery.length <= 1) {
      alert('Experience must have at least one showcase photo.');
      return;
    }
    setConfirmDeleteState({
      isOpen: true,
      title: 'Delete Experience Photo?',
      message: (
        <p>
          Are you sure you want to delete photo #{idx + 1} from this experience gallery?
        </p>
      ),
      onConfirm: () => {
        handleRemoveImage(idx);
        setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSaveChanges = async () => {
    if (!exp) return;
    const payload: ExperienceItem = {
      ...exp,
      slots,
      tiers,
      timeline,
      gallery,
    };
    await dispatch(updateExperienceAsync(payload));
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3500);
  };

  const handleApprove = async () => {
    if (!exp) return;
    await dispatch(approveExperienceAsync({ id: exp.id, adminId: user?.id }));
    setExp((prev) => (prev ? { ...prev, status: 'active', rejectionReason: undefined } : prev));
  };

  const handleReject = async () => {
    if (!exp) return;
    const reason = window.prompt(
      'Enter reason for rejection (compliance, license check, inaccurate itinerary, etc.):',
      'Missing safety certification or certified guide credentials'
    );
    if (reason) {
      await dispatch(rejectExperienceAsync({ id: exp.id, reason }));
      setExp((prev) => (prev ? { ...prev, status: 'rejected', rejectionReason: reason } : prev));
    }
  };

  // Pricing calculations for live preview ledger
  const currentTier = tiers[selectedTierIndex] || tiers[0];
  const pricePerPerson = currentTier?.pricePerPerson || exp.numericPrice;
  const originalPricePerPerson = currentTier?.originalPrice || exp.originalPrice || pricePerPerson + 800;
  const savingsPerPerson = Math.max(0, originalPricePerPerson - pricePerPerson);
  const baseCost = pricePerPerson * Math.max(1, adults) + Math.round(pricePerPerson * 0.7) * children;
  const memberDiscount = Math.round(baseCost * 0.08);
  const gearFee = 199;
  const taxesGst = Math.round((baseCost - memberDiscount + gearFee) * 0.05);
  const grandTotal = baseCost - memberDiscount + gearFee + taxesGst;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Experience details saved successfully to backend API!
          </span>
        </div>
      )}

      {/* Top Action & Mode Navigation Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/experiences"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                {exp.code}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isApproved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isPending
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isApproved && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {isPending && <Clock className="w-3 h-3 mr-1" />}
                {isRejected && <XCircle className="w-3 h-3 mr-1" />}
                {exp.status.toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Vendor: {exp.vendorName || 'Outdoor Mahabaleshwar Guild'}
              </span>
            </div>
            {isEditMode ? (
              <input
                type="text"
                value={exp.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="text-lg font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-0.5 mt-0.5 w-full max-w-md focus:outline-rose-500"
              />
            ) : (
              <h1 className="text-lg font-bold text-slate-900 mt-0.5 line-clamp-1">{exp.title}</h1>
            )}
          </div>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Mode Switch Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isEditMode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Preview Mode
            </button>
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isEditMode
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-rose-600" />
              Live Edit Mode
            </button>
          </div>

          {/* Admin Approval Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
              {!isApproved && (
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
              )}
              {!isRejected && (
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-xl transition-colors border border-slate-200 hover:border-rose-200 flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              )}
            </div>
          )}

          <a
            href={`http://localhost:3000/experiences/${exp.slug || exp.code || exp.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            title="Open Customer Front-end Page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Frontend UI ↗</span>
          </a>

          {/* Save to Backend Button */}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ea110d] hover:bg-[#d00f0c] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save to Backend
          </button>
        </div>
      </div>

      {/* Rejection Notice Banner */}
      {isRejected && exp.rejectionReason && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Experience Listing Rejected</h4>
            <p className="text-xs text-rose-700 mt-0.5">{exp.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/experiences" className="hover:text-slate-900">Experiences Catalog</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{exp.title}</span>
      </div>

      {/* ─── Hero Gallery Grid (Frontend Style) ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-poppins">
              Experience Photo Showcase ({gallery.length} Images)
            </span>
            {uploadSuccessToast && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-fadeIn">
                <Check className="w-3 h-3" />
                {uploadSuccessToast}
              </span>
            )}
          </div>
          {isEditMode && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-[#ea110d] hover:bg-rose-100 border border-rose-200 text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compressing &amp; Converting...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload WebP Photo</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddImage(!showAddImage)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Paste URL</span>
              </button>
            </div>
          )}
        </div>

        {showAddImage && isEditMode && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2 mb-3">
            <input
              type="url"
              placeholder="Paste image URL (https://...)"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-rose-500"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Add
            </button>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-md">
          <div className="relative h-80 sm:h-96 w-full">
            <Image
              src={gallery[activePhotoIndex] || exp.image}
              alt={exp.title}
              fill
              priority
              className="object-cover transition-all duration-300"
              sizes="(max-width: 1024px) 100vw, 80vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Badges on hero */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 rounded-full text-xs font-bold shadow-sm font-poppins">
                {exp.category}
              </span>
              <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-bold shadow-sm font-poppins">
                {exp.difficulty} Difficulty
              </span>
            </div>

            {/* Photo Indicator & Delete */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-xs font-bold flex items-center gap-1.5 font-poppins">
                <Camera className="w-3.5 h-3.5" />
                {activePhotoIndex + 1} / {gallery.length} Photos
              </div>
              {isEditMode && gallery.length > 1 && (
                <button
                  type="button"
                  onClick={() => requestDeleteImage(activePhotoIndex)}
                  className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-sm"
                  title="Delete current photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Title & Quick Info on Hero overlay */}
            <div className="absolute bottom-4 left-4 right-20 text-white">
              <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{exp.city} • Maharashtra</span>
                <span>•</span>
                <div className="flex items-center gap-1 text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold">{exp.rating || 4.9}</span>
                  <span className="text-white/70">({exp.reviewsCount || 124} reviews)</span>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold line-clamp-1 font-poppins">{exp.title}</h2>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {gallery.length > 1 && (
            <div className="p-3 bg-slate-950/80 backdrop-blur-md flex gap-2 overflow-x-auto">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhotoIndex(i)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    i === activePhotoIndex
                      ? 'border-[#ea110d] scale-105 shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumb ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Two-Column Layout: Left Content & Right Sticky Booking Ledger ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: Guide Card, Quick Specs, Sticky Tabs, Content    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Guide Card (Exact Frontend UI) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#0B0A06] text-white font-extrabold text-lg flex items-center justify-center font-poppins shrink-0 shadow-sm">
                {exp.guide?.name ? exp.guide.name[0] : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                {isEditMode ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Guide:</span>
                      <input
                        type="text"
                        value={exp.guide?.name || 'Sameer Patil'}
                        onChange={(e) => handleFieldChange('guide', { ...exp.guide, name: e.target.value })}
                        className="text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-0.5 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Role:</span>
                      <input
                        type="text"
                        value={exp.guide?.role || 'Lead Trek Leader & Naturalist'}
                        onChange={(e) => handleFieldChange('guide', { ...exp.guide, role: e.target.value })}
                        className="text-[11px] text-slate-600 border border-slate-200 rounded-lg px-2 py-0.5 flex-1"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                      <span>Curated &amp; Guided by {exp.guide?.name || 'Sameer Patil'}</span>
                      <span className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        ✓
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                      {exp.guide?.role || 'Lead Trek Leader & Naturalist'} • 8+ Years Expedition Experience • 350+ Treks Guided
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/80 text-[#ea110d] text-xs font-semibold self-start sm:self-auto font-poppins shadow-2xs">
              <span className="text-[#ea110d] font-bold">✓</span>
              <span>Instant Booking Confirmed</span>
            </div>
          </div>

          {/* Quick Specs 4-Pill Strip */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Clock className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                {isEditMode ? (
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => handleFieldChange('duration', e.target.value)}
                    className="text-xs font-bold text-slate-900 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate">{exp.duration}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Compass className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Difficulty</div>
                {isEditMode ? (
                  <select
                    value={exp.difficulty}
                    onChange={(e) => handleFieldChange('difficulty', e.target.value as Difficulty)}
                    className="text-xs font-bold text-slate-900 border-b border-slate-200 w-full p-0 bg-transparent focus:outline-hidden"
                  >
                    {DIFFICULTY_LEVELS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate">{exp.difficulty}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <Users className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Group Size</div>
                {isEditMode ? (
                  <input
                    type="number"
                    value={exp.maxGroupSize || 15}
                    onChange={(e) => handleFieldChange('maxGroupSize', Number(e.target.value))}
                    className="text-xs font-bold text-slate-900 border-b border-slate-200 w-full p-0 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate">Max {exp.maxGroupSize || 15} Explorers</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1">
              <div className="w-10 h-10 rounded-full bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Guide Status</div>
                <div className="text-xs font-bold text-slate-900 font-poppins truncate">100% Certified</div>
              </div>
            </div>
          </div>

          {/* ─── Sticky Navigation Tabs Bar with Left/Right Slide Buttons & White Gradient (Exact Frontend UI) ─── */}
          <div
            id="detail-tabs-bar"
            className="relative sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          >
            {/* Left Gradient & Slide Button */}
            <div
              className={`absolute left-1.5 top-1.5 bottom-1.5 z-10 flex items-center pr-8 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none rounded-l-xl transition-opacity duration-300 ${
                canScrollTabsLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                aria-label="Scroll tabs left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Scrollable Tabs Track */}
            <div
              ref={tabsScrollRef}
              onScroll={checkTabScroll}
              className="overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center gap-1 px-1"
            >
              {[
                { id: 'tiers', label: 'Pricing & Slots', icon: <Award className="w-4 h-4" /> },
                { id: 'about', label: 'About & Overview', icon: <Building className="w-4 h-4" /> },
                { id: 'timeline', label: 'Timeline & Schedule', icon: <ListOrdered className="w-4 h-4" /> },
                { id: 'facilities', label: 'Inclusions & Requirements', icon: <Sparkles className="w-4 h-4" /> },
                { id: 'rules', label: 'House Rules & Safety', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'location', label: 'Location & Basecamp', icon: <MapPin className="w-4 h-4" /> },
                { id: 'reviews', label: 'Guide & Reviews', icon: <Star className="w-4 h-4" /> },
                { id: 'all', label: 'All Details', icon: <Layers className="w-4 h-4" /> },
              ].map((tab) => {
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold font-poppins text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#ea110d] text-white shadow-sm shadow-red-500/20 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Gradient & Slide Button */}
            <div
              className={`absolute right-1.5 top-1.5 bottom-1.5 z-10 flex items-center pl-8 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none rounded-r-xl transition-opacity duration-300 ${
                canScrollTabsRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                aria-label="Scroll tabs right"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ─── Tab 1: Pricing & Slots (Package Tiers + Time Slots) ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'tiers') && (
            <div id="tiers" className="flex flex-col gap-4">
              {/* Package Tiers Cards */}
              <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                      PACKAGE OPTIONS
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-poppins">
                      Select Package Tier ({tiers.length} Options)
                    </h3>
                  </div>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleAddTier}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ea110d] text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tier</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiers.map((tier, idx) => {
                    const isSelected = selectedTierIndex === idx;
                    return (
                      <div
                        key={tier.tierId || idx}
                        onClick={() => setSelectedTierIndex(idx)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#ea110d] bg-red-50/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          {isEditMode ? (
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => handleUpdateTier(idx, 'name', e.target.value)}
                              className="text-sm font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-0.5"
                            />
                          ) : (
                            <h4 className="text-sm font-bold text-slate-900 font-poppins">{tier.name}</h4>
                          )}
                          {isEditMode ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">₹</span>
                              <input
                                type="number"
                                value={tier.pricePerPerson}
                                onChange={(e) => handleUpdateTier(idx, 'pricePerPerson', Number(e.target.value))}
                                className="w-20 text-xs font-bold border border-slate-200 rounded px-1 py-0.5 text-right"
                              />
                              {tiers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDeleteTier(idx);
                                  }}
                                  className="text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-extrabold text-[#ea110d] font-poppins">
                              ₹{tier.pricePerPerson.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={tier.tagline || ''}
                            onChange={(e) => handleUpdateTier(idx, 'tagline', e.target.value)}
                            placeholder="Tagline / brief"
                            className="text-xs text-slate-500 w-full border border-slate-200 rounded px-1.5 py-0.5 mb-2"
                          />
                        ) : (
                          tier.tagline && <p className="text-xs text-slate-500 mb-3">{tier.tagline}</p>
                        )}
                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          {tier.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Batching */}
              <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                      DEPARTURE BATCHES
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-poppins">
                      Daily Time Slots &amp; Capacity
                    </h3>
                  </div>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Slot</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slots.map((slot, idx) => {
                    const isSelected = selectedSlotIndex === idx;
                    return (
                      <div
                        key={slot.slotId || idx}
                        onClick={() => setSelectedSlotIndex(idx)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          {isEditMode ? (
                            <input
                              type="text"
                              value={slot.time}
                              onChange={(e) => handleUpdateSlot(idx, 'time', e.target.value)}
                              className="text-xs font-bold text-slate-900 border border-slate-300 rounded px-1 py-0.5 bg-white w-24"
                            />
                          ) : (
                            <span className={`text-xs font-bold ${isSelected ? 'text-rose-400' : 'text-[#ea110d]'}`}>
                              {slot.time}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            {isEditMode ? (
                              <input
                                type="number"
                                value={slot.capacity}
                                onChange={(e) => handleUpdateSlot(idx, 'capacity', Number(e.target.value))}
                                className="text-[10px] font-bold w-12 border border-slate-300 rounded px-1 py-0.5 bg-white text-slate-900"
                              />
                            ) : (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {slot.capacity} spots
                              </span>
                            )}
                            {isEditMode && slots.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestDeleteSlot(idx);
                                }}
                                className="text-rose-500 hover:text-rose-700 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={slot.label}
                            onChange={(e) => handleUpdateSlot(idx, 'label', e.target.value)}
                            placeholder="Slot Label"
                            className="text-xs font-bold text-slate-900 border border-slate-300 rounded px-1 py-0.5 bg-white w-full mt-1"
                          />
                        ) : (
                          <p className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {slot.label}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 2: About & Overview ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'about') && (
            <div id="about" className="flex flex-col gap-4">
              <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <h3 className="text-xl font-bold text-slate-900 font-poppins mb-3">
                      About this {exp.title}
                    </h3>

                    {isEditMode ? (
                      <div className="space-y-3 mb-4">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                          Overview &amp; Experience Details
                        </label>
                        <textarea
                          rows={5}
                          value={exp.description}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl p-2.5 focus:outline-rose-500"
                        />
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-roboto mb-5 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.duration}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Difficulty</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.difficulty}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Group Size</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">Max {exp.maxGroupSize || 15}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Language</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">English, Hindi, Marathi</div>
                      </div>
                    </div>
                  </div>

                  {/* Video Preview Banner */}
                  <div className="md:col-span-5 relative rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 group cursor-pointer border border-slate-200">
                    <Image
                      src={gallery[1] || gallery[0]}
                      alt="Action Video Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-3 right-3">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                        <span className="text-[#ea110d] text-xs">▶</span>
                        <span>Watch Action Preview</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 font-poppins">
                    Experience Highlights
                  </h3>
                  {isEditMode && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newHighlight}
                        onChange={(e) => setNewHighlight(e.target.value)}
                        placeholder="New highlight"
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="px-2.5 py-1 rounded-lg bg-[#ea110d] text-white text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {exp.highlights.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#ea110d] shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 font-medium">{h}</span>
                      </div>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => requestDeleteHighlight(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 3: Timeline & Schedule ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'timeline') && (
            <div id="timeline" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                    ACTIVITY TIMELINE
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 font-poppins">
                    Step-by-Step Schedule &amp; Itinerary
                  </h3>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddTimelineStep}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {timeline.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={step.time}
                          onChange={(e) => handleUpdateTimelineStep(idx, 'time', e.target.value)}
                          className="text-xs font-mono font-bold text-[#ea110d] bg-white border border-slate-300 rounded px-2 py-0.5"
                        />
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-[#ea110d] text-xs font-bold font-mono">
                          {step.time}
                        </span>
                      )}
                      {isEditMode && timeline.length > 1 && (
                        <button
                          type="button"
                          onClick={() => requestDeleteTimelineStep(idx)}
                          className="text-xs text-rose-600 hover:underline flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    {isEditMode ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateTimelineStep(idx, 'title', e.target.value)}
                          placeholder="Phase Title"
                          className="text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white"
                        />
                        <textarea
                          rows={2}
                          value={step.desc || ''}
                          onChange={(e) => handleUpdateTimelineStep(idx, 'desc', e.target.value)}
                          placeholder="Phase Description"
                          className="text-xs text-slate-600 border border-slate-200 rounded-lg p-2 w-full bg-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-poppins">{step.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Tab 4: Inclusions & Requirements ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'facilities') && (
            <div id="facilities" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inclusions */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Included in this Adventure</span>
                  </h4>
                </div>

                {isEditMode && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newInclusion}
                      onChange={(e) => setNewInclusion(e.target.value)}
                      placeholder="e.g. Certified Mountain Guide"
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddInclusion}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  {(exp.inclusions && exp.inclusions.length > 0
                    ? exp.inclusions
                    : [
                        { title: 'Certified Guide & Lead Naturalist' },
                        { title: 'Safety Harness, Helmet & Walking Poles' },
                        { title: 'Packaged Drinking Water & Energy Bars' },
                        { title: 'Forest Entry Permit & Trek Insurance' },
                      ]
                  ).map((inc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50/50 border border-emerald-100/60 text-xs text-slate-700"
                    >
                      <span className="font-medium text-emerald-900">{inc.title}</span>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => requestDeleteInclusion(i)}
                          className="text-slate-400 hover:text-rose-600 ml-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* What to Bring / Requirements */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>What to Bring &amp; Requirements</span>
                </h4>
                <div className="space-y-1.5">
                  {[
                    'Sturdy grip hiking shoes with socks',
                    'Comfortable breathable outdoor clothing',
                    'Light rain jacket / windcheater',
                    'Personal reusable water bottle & sun cap',
                    'Government ID for forest checkpoint',
                  ].map((req, i) => (
                    <div
                      key={i}
                      className="flex items-center px-3 py-1.5 rounded-xl bg-amber-50/40 border border-amber-100/60 text-xs text-slate-700"
                    >
                      <span>• {req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 5: House Rules & Safety ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'rules') && (
            <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
                  Safety Policies &amp; House Rules
                </h3>
                <p className="text-xs text-slate-500 font-roboto">
                  Please review Mahastays strict outdoor safety guidelines
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Reporting &amp; Briefing</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p>Report 15 mins prior to slot time</p>
                    <p>Mandatory 10-min safety drill</p>
                    <p className="text-slate-400">Late arrivals cannot be refunded</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Weather &amp; Cancellation</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p className="font-semibold text-emerald-700">100% Weather Refund</p>
                    <p>Full refund or free reschedule in case of heavy downpour or forest closure.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Fitness &amp; Age Limits</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p>• Min age: 8 years for moderate trails</p>
                    <p>• Not recommended for heart patients</p>
                    <p>• 1 Guide per 6 explorers guarantee</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">Insurance &amp; Medical</div>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <p>• Certified wilderness first-aid kit</p>
                    <p>• On-call rescue team coordination</p>
                    <p>• Complimentary trek badge</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 6: Location & Basecamp ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'location') && (
            <div id="location" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins">
                    Location &amp; Basecamp Assembly
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto mt-0.5">
                    {exp.location || 'Old Mahabaleshwar & Panchgani, Maharashtra'}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exp.title + ' ' + (exp.location || 'Mahabaleshwar'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-poppins transition"
                >
                  <span>Open in Maps</span>
                  <span>↗</span>
                </a>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-56 sm:h-64 bg-slate-100 border border-slate-200">
                <Image
                  src="/panchgani.jpg"
                  alt="Basecamp Location View"
                  fill
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#ea110d] text-white flex items-center justify-center shadow-xl animate-bounce">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-1 px-3 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-md backdrop-blur-sm">
                    {exp.title} Basecamp
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {[
                  { name: 'Basecamp Assembly Point', distance: '1.5 km • 5 mins', desc: 'Parking available for cars & bikes' },
                  { name: 'Venna Lake Boating Hub', distance: '4.2 km • 10 mins', desc: 'Nearby activity hotspot' },
                  { name: 'Forest Checkpost', distance: '800 m • 2 mins', desc: 'Permit entry & biometric registration' },
                ].map((pt, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-900 font-poppins">{pt.name}</div>
                    <div className="text-[11px] font-semibold text-[#ea110d] mt-0.5">{pt.distance}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{pt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Tab 7: Guide & Reviews ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'reviews') && (
            <div id="reviews" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins flex items-center gap-2">
                    <span>Explorer Reviews &amp; Ratings</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                      ★ {exp.rating || 4.9} / 5.0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto mt-0.5">
                    Based on {exp.reviewsCount || 124} verified participant ratings
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-poppins">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>100% Genuine Explorer Stays</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Safety & Briefing', score: '5.0' },
                  { label: 'Trail Guide Expertise', score: '5.0' },
                  { label: 'Gear Quality', score: '4.9' },
                  { label: 'Punctuality', score: '4.8' },
                  { label: 'Route Scenery', score: '5.0' },
                  { label: 'Value for Money', score: '4.9' },
                ].map((cat, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">{cat.label}</span>
                      <span className="text-slate-900 font-bold">{cat.score}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full w-[98%]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-2">
                {[
                  {
                    name: 'Karan Singhania',
                    date: 'October 2026',
                    rating: 5,
                    comment: 'Exhilarating experience! Sameer the guide was patient, knowledgeable about local flora and fauna, and helped everyone navigate the steep sections safely.',
                  },
                  {
                    name: 'Tanvi & Friends Group',
                    date: 'September 2026',
                    rating: 5,
                    comment: 'Top-notch organization. The sunrise viewpoint from the summit with hot tea and snacks was pure magic. Will definitely book again!',
                  },
                ].map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-poppins">
                          {rev.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-poppins">{rev.name}</div>
                          <div className="text-[10px] text-slate-400 font-roboto">{rev.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs">
                        {'★'.repeat(rev.rating)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-roboto leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN: Sticky Booking Calculation Card                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 sticky top-6 z-20">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">
                  ₹{pricePerPerson.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-normal"> / explorer</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 line-through block font-poppins">
                  ₹{originalPricePerPerson.toLocaleString('en-IN')}
                </span>
                {savingsPerPerson > 0 && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                    Save ₹{savingsPerPerson.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                  ACTIVE TIER &amp; SLOT
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins truncate max-w-[210px]">
                  {currentTier?.name} • {slots[selectedSlotIndex]?.time}
                </div>
              </div>
              <span className="text-xs font-bold text-[#ea110d] font-poppins">Active</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Explorers</div>
                <div className="text-xs font-bold text-slate-900">
                  {adults} Adults, {children} Child
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-bold w-4 text-center">{adults}</span>
                <button
                  type="button"
                  onClick={() => setAdults((prev) => prev + 1)}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(`Simulating experience booking for ${exp.title}.`)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Reserve &amp; Book Experience</span>
              <span>→</span>
            </button>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>
                  ₹{pricePerPerson.toLocaleString('en-IN')} × {adults} explorer{adults > 1 ? 's' : ''}
                </span>
                <span className="text-slate-900 font-semibold">₹{baseCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Mahastays Member Discount (8%)</span>
                <span>-₹{memberDiscount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Gear &amp; Trail Insurance Fee</span>
                <span className="text-slate-900 font-semibold">₹{gearFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes &amp; GST (5%)</span>
                <span className="text-slate-900 font-semibold">₹{taxesGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-200 pt-2.5 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 font-poppins">Total (INR)</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% Certified Safety Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Weather Cancellation Protection Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDeleteState.onConfirm}
        title={confirmDeleteState.title}
        itemName={confirmDeleteState.itemName}
        message={confirmDeleteState.message}
      />
    </div>
  );
}
