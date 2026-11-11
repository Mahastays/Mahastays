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
  RotateCw,
  Video,
  X,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { VideoPlayerModal, getYouTubeThumbnailUrl } from '../modals/VideoPlayerModal';
import { uploadImageToCloudinary } from '@/lib/upload';
import LocationMapPicker from '../maps/LocationMapPicker';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchExperienceById,
  updateExperienceAsync,
  approveExperienceAsync,
  rejectExperienceAsync,
  toggleExperienceBookingAsync,
} from '@/store/slices/experiencesSlice';
import {
  ExperienceItem,
  ExperienceSlotItem,
  ExperienceTierItem,
  Difficulty,
} from '@/types';
import { toast } from '@/components/ui/Toast';

interface ExperienceDetailEditViewProps {
  id: string;
}

const EXPERIENCE_CATEGORIES = [
  'Fun Activity & Resort Games',
  'Night Karaoke & Entertainment',
  'Bonfire & Music',
  'Treasure Hunt',
  'Group Games & Team Building',
  'Tower Building',
  'Musical Chair',
  'Couple Balloon Games',
  'Antakshari & Musical Games',
  'Tambola & Housie',
  'Trekking & Hiking',
  'Watersports & Boating',
  'Stargazing & Camping',
  'Cycling & Mountain Biking',
  'Cultural & Heritage Walk',
  'Strawberry Farm Tour',
  'Adventure & Wildlife Safari',
  'Nature & Sightseeing',
  'Trekking',
  'Culture & Food',
  'Cruises',
  'Safari & Desert',
  'Adventure',
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
  const [newExclusion, setNewExclusion] = useState('');
  const [newWhatToBring, setNewWhatToBring] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddImage, setShowAddImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const guideAvatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingGuideAvatar, setIsUploadingGuideAvatar] = useState(false);

  const handleGuideAvatarUpload = async (file: File) => {
    try {
      setIsUploadingGuideAvatar(true);
      const res = await uploadImageToCloudinary(file, 'hosts');
      handleHostChange('avatar', res.url);
      toast.success('Guide / host photo updated!', 'Host Updated');
      setUploadSuccessToast('Guide / host photo updated!');
      setTimeout(() => setUploadSuccessToast(null), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload guide photo', 'Upload Failed');
    } finally {
      setIsUploadingGuideAvatar(false);
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchExperienceById(id)).unwrap();
    } catch (err) {
      console.error('Refresh experience error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

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
  const [showPricingEdit, setShowPricingEdit] = useState(false);

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
  const gallery = exp.gallery && exp.gallery.length > 0 ? exp.gallery : exp.image ? [exp.image] : [];
  const slots: ExperienceSlotItem[] = exp.slots && exp.slots.length > 0
    ? exp.slots
    : [
        { slotId: 's1', time: '09:00 AM', label: 'Standard Batch', capacity: exp.maxGroupSize || 10, price: exp.numericPrice },
      ];
  const tiers: ExperienceTierItem[] = exp.tiers && exp.tiers.length > 0
    ? exp.tiers
    : [
        {
          tierId: 't1',
          name: 'Standard Experience',
          tagline: (exp as any).tagline || 'Full Experience Pass',
          pricePerPerson: exp.numericPrice,
          originalPrice: exp.originalPrice || exp.numericPrice,
          features: Array.isArray(exp.inclusions)
            ? exp.inclusions.map((inc: any) => (typeof inc === 'string' ? inc : inc.title || ''))
            : ['Guided Experience'],
        },
      ];
  const timeline = exp.timeline && exp.timeline.length > 0
    ? exp.timeline
    : [];

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

  const handleHostChange = (field: string, val: any) => {
    if (!exp) return;
    const currentGuide = exp.guide || { name: 'Sameer Patil', role: 'Lead Trek Leader & Naturalist' };
    const updated = {
      ...currentGuide,
      experience: (currentGuide as any).experience || '8+ Years Expedition Experience',
      staysCount: (currentGuide as any).staysCount || '350+ Treks Guided',
      verified: (currentGuide as any).verified ?? true,
      confirmationBadge: (currentGuide as any).confirmationBadge || 'Instant Booking Confirmed',
      [field]: val,
    };
    setExp({
      ...exp,
      guide: updated,
      host: updated as any,
    });
  };

  const handleUpdateHighlight = (idx: number, val: string) => {
    if (!exp) return;
    const updated = [...exp.highlights];
    updated[idx] = val;
    setExp({ ...exp, highlights: updated });
  };

  const handleUpdateInclusion = (idx: number, val: string) => {
    if (!exp || !exp.inclusions) return;
    const updated = [...exp.inclusions];
    updated[idx] = { ...updated[idx], title: val };
    setExp({ ...exp, inclusions: updated });
  };

  const handleAddExclusion = () => {
    if (!newExclusion.trim() || !exp) return;
    const current = exp.exclusions || [];
    setExp({ ...exp, exclusions: [...current, newExclusion.trim()] });
    setNewExclusion('');
  };

  const handleUpdateExclusion = (idx: number, val: string) => {
    if (!exp || !exp.exclusions) return;
    const updated = [...exp.exclusions];
    updated[idx] = val;
    setExp({ ...exp, exclusions: updated });
  };

  const handleRemoveExclusion = (idx: number) => {
    if (!exp || !exp.exclusions) return;
    setExp({ ...exp, exclusions: exp.exclusions.filter((_, i) => i !== idx) });
  };

  const handleAddWhatToBring = () => {
    if (!newWhatToBring.trim() || !exp) return;
    const current = exp.whatToBring || [];
    setExp({ ...exp, whatToBring: [...current, newWhatToBring.trim()] });
    setNewWhatToBring('');
  };

  const handleUpdateWhatToBring = (idx: number, val: string) => {
    if (!exp || !exp.whatToBring) return;
    const updated = [...exp.whatToBring];
    updated[idx] = val;
    setExp({ ...exp, whatToBring: updated });
  };

  const handleRemoveWhatToBring = (idx: number) => {
    if (!exp || !exp.whatToBring) return;
    setExp({ ...exp, whatToBring: exp.whatToBring.filter((_, i) => i !== idx) });
  };

  const handleAddTierFeature = (tierIndex: number, featureText: string) => {
    if (!exp || !tiers[tierIndex]) return;
    const currentFeatures = tiers[tierIndex].features ? [...tiers[tierIndex].features] : [];
    currentFeatures.push(featureText);
    handleUpdateTier(tierIndex, 'features', currentFeatures);
  };

  const handleUpdateTierFeature = (tierIndex: number, featureIndex: number, val: string) => {
    if (!exp || !tiers[tierIndex]) return;
    const currentFeatures = [...(tiers[tierIndex].features || [])];
    currentFeatures[featureIndex] = val;
    handleUpdateTier(tierIndex, 'features', currentFeatures);
  };

  const handleRemoveTierFeature = (tierIndex: number, featureIndex: number) => {
    if (!exp || !tiers[tierIndex]) return;
    const currentFeatures = (tiers[tierIndex].features || []).filter((_, i) => i !== featureIndex);
    handleUpdateTier(tierIndex, 'features', currentFeatures);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim() || !exp) return;
    const updatedGallery = [...gallery, newImageUrl.trim()];
    setExp({ ...exp, gallery: updatedGallery });
    setNewImageUrl('');
    setShowAddImage(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !exp) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const res = await uploadImageToCloudinary(file, 'listing_media');
        if (res?.url) uploadedUrls.push(res.url);
      }
      if (uploadedUrls.length) {
        setExp({
          ...exp,
          gallery: [...gallery, ...uploadedUrls],
          image: exp.image || uploadedUrls[0],
        });
        toast.success(`Uploaded ${uploadedUrls.length} photo(s)`, 'Gallery Updated');
        setUploadSuccessToast(`Uploaded ${uploadedUrls.length} photo(s)`);
        setTimeout(() => setUploadSuccessToast(null), 4000);
      }
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message || 'Please try again'}`, 'Upload Failed');
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

  const handleKeyHighlightChange = (index: number, field: 'name' | 'desc', val: string) => {
    if (!exp) return;
    const current = (exp as any).keyHighlights ? [...(exp as any).keyHighlights] : [
      { name: 'Duration', desc: exp.duration || '3.5 Hours' },
      { name: 'Difficulty', desc: exp.difficulty || 'Moderate' },
      { name: 'Group Size', desc: `Max ${exp.maxGroupSize || 15} Explorers` },
      { name: 'Guide Status', desc: '100% Certified' },
    ];
    if (current[index]) {
      current[index] = { ...current[index], [field]: val };
      setExp({ ...exp, keyHighlights: current } as any);
    }
  };

  const handleRemoveKeyHighlight = (index: number) => {
    if (!exp) return;
    const current = (exp as any).keyHighlights ? [...(exp as any).keyHighlights] : [
      { name: 'Duration', desc: exp.duration || '3.5 Hours' },
      { name: 'Difficulty', desc: exp.difficulty || 'Moderate' },
      { name: 'Group Size', desc: `Max ${exp.maxGroupSize || 15} Explorers` },
      { name: 'Guide Status', desc: '100% Certified' },
    ];
    setExp({ ...exp, keyHighlights: current.filter((_: any, i: number) => i !== index) } as any);
  };

  const handleAddKeyHighlight = () => {
    if (!exp) return;
    const current = (exp as any).keyHighlights ? [...(exp as any).keyHighlights] : [
      { name: 'Duration', desc: exp.duration || '3.5 Hours' },
      { name: 'Difficulty', desc: exp.difficulty || 'Moderate' },
      { name: 'Group Size', desc: `Max ${exp.maxGroupSize || 15} Explorers` },
      { name: 'Guide Status', desc: '100% Certified' },
    ];
    setExp({
      ...exp,
      keyHighlights: [...current, { name: 'New Spec', desc: 'Spec details' }],
    } as any);
  };

  const handlePolicyChange = (field: string, val: any) => {
    if (!exp) return;
    setExp({
      ...exp,
      policies: {
        ...((exp as any).policies || {}),
        [field]: val,
      },
    } as any);
  };

  const handleAddSafetyRule = () => {
    if (!exp) return;
    const current = (exp as any).policies?.safetyRules ? [...(exp as any).policies.safetyRules] : [
      'Min age: 8 years for moderate trails',
      'Not recommended for heart patients',
      '1 Guide per 6 explorers guarantee',
    ];
    setExp({
      ...exp,
      policies: {
        ...((exp as any).policies || {}),
        safetyRules: [...current, 'New safety guideline'],
      },
    } as any);
  };

  const handleRemoveSafetyRule = (index: number) => {
    if (!exp) return;
    const current = (exp as any).policies?.safetyRules ? [...(exp as any).policies.safetyRules] : [
      'Min age: 8 years for moderate trails',
      'Not recommended for heart patients',
      '1 Guide per 6 explorers guarantee',
    ];
    setExp({
      ...exp,
      policies: {
        ...((exp as any).policies || {}),
        safetyRules: current.filter((_: any, i: number) => i !== index),
      },
    } as any);
  };

  const handleUpdateSafetyRule = (index: number, val: string) => {
    if (!exp) return;
    const current = (exp as any).policies?.safetyRules ? [...(exp as any).policies.safetyRules] : [
      'Min age: 8 years for moderate trails',
      'Not recommended for heart patients',
      '1 Guide per 6 explorers guarantee',
    ];
    current[index] = val;
    setExp({
      ...exp,
      policies: {
        ...((exp as any).policies || {}),
        safetyRules: current,
      },
    } as any);
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
      toast.warning('Experience must have at least one time slot.', 'Action Blocked');
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
      toast.warning('Experience must have at least one pricing tier.', 'Action Blocked');
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
      toast.warning('Experience must have at least one showcase photo.', 'Action Blocked');
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
    try {
      await dispatch(updateExperienceAsync(payload)).unwrap();
      toast.success('Experience updated successfully', 'Changes Saved');
      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 3500);
      setIsEditMode(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update experience', 'Save Failed');
    }
  };

  const handleApprove = async () => {
    if (!exp) return;
    try {
      await dispatch(approveExperienceAsync({ id: exp.id, adminId: user?.id })).unwrap();
      setExp((prev) => (prev ? { ...prev, status: 'active', rejectionReason: undefined } : prev));
      toast.success('Experience approved and published', 'Experience Approved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve experience', 'Approval Failed');
    }
  };

  const handleReject = async () => {
    if (!exp) return;
    const reason = window.prompt(
      'Enter reason for rejection (compliance, license check, inaccurate itinerary, etc.):',
      'Missing safety certification or certified guide credentials'
    );
    if (reason) {
      try {
        await dispatch(rejectExperienceAsync({ id: exp.id, reason })).unwrap();
        setExp((prev) => (prev ? { ...prev, status: 'rejected', rejectionReason: reason } : prev));
        toast.success('Experience rejected', 'Status Updated');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to reject experience', 'Rejection Failed');
      }
    }
  };

  const handleToggleBooking = async () => {
    if (!exp) return;
    const next = exp.acceptingBookings === false ? true : false;
    setExp((prev) => (prev ? { ...prev, acceptingBookings: next } : prev));
    try {
      await dispatch(toggleExperienceBookingAsync({ id: exp.id, acceptingBookings: next })).unwrap();
      toast.success(
        next ? 'Experience is now accepting bookings.' : 'Experience bookings are now paused.',
        'Booking Status'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking status', 'Error');
    }
  };

  // Pricing calculations for live preview ledger
  const currentTier = tiers[selectedTierIndex] || tiers[0];
  const isFullSetup = exp.priceType === 'per_activity' || exp.priceType === 'full_setup' || exp.priceType === 'per_night';
  const isPerNight = exp.priceType === 'per_night';
  const personLimit = exp.personLimit || 15;
  const pricePerPerson = currentTier?.pricePerPerson || exp.numericPrice;
  const originalPricePerPerson = currentTier?.originalPrice || exp.originalPrice || pricePerPerson + 800;
  const savingsPerPerson = Math.max(0, originalPricePerPerson - pricePerPerson);
  const hasChildPrice = exp.hasChildPrice ?? exp.pricingRules?.hasChildPrice ?? false;
  const configuredChildPrice = exp.childPrice ?? exp.pricingRules?.childPrice ?? (currentTier as any)?.childPricePerPerson ?? null;
  const childPriceLimit = exp.childAgeLimit ?? exp.pricingRules?.childAgeLimit ?? 'Below 12 years';
  const effectiveChildPrice = hasChildPrice && configuredChildPrice !== null ? configuredChildPrice : pricePerPerson;

  const baseCost = isFullSetup
    ? pricePerPerson
    : pricePerPerson * Math.max(1, adults) + effectiveChildPrice * children;

  // Custom Pricing, Discounts & GST Rules
  const pricingRules = exp.pricingRules || {};
  const discountPercent = typeof pricingRules.memberDiscountPercent === 'number' ? pricingRules.memberDiscountPercent : 8;
  const discountType = pricingRules.discountType || 'percentage';
  const customDiscountAmount = typeof pricingRules.customDiscountAmount === 'number' ? pricingRules.customDiscountAmount : 0;
  const includeCleaningFee = pricingRules.includeCleaningFee !== false;
  const configuredFee = typeof pricingRules.cleaningFee === 'number' ? pricingRules.cleaningFee : 199;
  const gearFee = includeCleaningFee ? configuredFee : 0;
  const includeGst = pricingRules.includeGst !== false;
  const gstPercent = typeof pricingRules.gstPercent === 'number' ? pricingRules.gstPercent : 5;

  const memberDiscount =
    discountType === 'flat'
      ? customDiscountAmount
      : discountType === 'none' || discountPercent === 0
      ? 0
      : Math.round(baseCost * (discountPercent / 100));

  const taxableAmount = Math.max(0, baseCost - memberDiscount + gearFee);
  const taxesGst = includeGst ? Math.round(taxableAmount * (gstPercent / 100)) : 0;
  const grandTotal = baseCost - memberDiscount + gearFee + taxesGst;

  const handlePricingRuleChange = (key: string, value: any) => {
    if (!exp) return;
    setExp({
      ...exp,
      pricingRules: {
        ...(exp.pricingRules || {}),
        [key]: value,
      },
    });
  };

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
              {exp.acceptingBookings === false ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                  <PauseCircle className="w-3 h-3" />
                  BOOKINGS PAUSED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  BOOKINGS OPEN
                </span>
              )}
            </div>
            {isEditMode ? (
              <div className="space-y-2 mt-1 w-full max-w-xl">
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="text-lg font-bold text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 w-full focus:outline-rose-500"
                  placeholder="Experience title"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500">Category:</span>
                    <select
                      value={exp.category}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      className="text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-md px-2 py-0.5 focus:outline-rose-500 cursor-pointer"
                    >
                      {EXPERIENCE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500">Difficulty:</span>
                    <select
                      value={exp.difficulty}
                      onChange={(e) => handleFieldChange('difficulty', e.target.value as any)}
                      className="text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-md px-2 py-0.5 focus:outline-rose-500 cursor-pointer"
                    >
                      {DIFFICULTY_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-0.5">
                <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{exp.title}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                    📂 {exp.category}
                  </span>
                  <span>•</span>
                  <span>{exp.difficulty} Difficulty</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Dedicated Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refetch Experience from Database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#ea110d]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Pause / Resume Bookings Toggle */}
          <button
            type="button"
            onClick={handleToggleBooking}
            title={exp.acceptingBookings === false ? 'Click to resume accepting bookings' : 'Click to pause bookings'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
              exp.acceptingBookings === false
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {exp.acceptingBookings === false ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume Bookings</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause Bookings</span>
              </>
            )}
          </button>

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
                multiple
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
                    <span>Upload Photos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

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
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
              {isEditMode ? (
                <div className="flex flex-wrap items-center gap-2 bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
                  <div className="flex items-center gap-1.5 pl-1">
                    <span className="text-[10px] uppercase font-bold text-white/90">Category:</span>
                    <select
                      value={exp.category}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      className="px-2.5 py-1 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-xs cursor-pointer focus:outline-none"
                    >
                      {EXPERIENCE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 pl-1">
                    <span className="text-[10px] uppercase font-bold text-white/90">Difficulty:</span>
                    <select
                      value={exp.difficulty}
                      onChange={(e) => handleFieldChange('difficulty', e.target.value as any)}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-xs cursor-pointer focus:outline-none"
                    >
                      {DIFFICULTY_LEVELS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 rounded-full text-xs font-bold shadow-sm font-poppins">
                    {exp.category}
                  </span>
                  <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-bold shadow-sm font-poppins">
                    {exp.difficulty} Difficulty
                  </span>
                </>
              )}
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
              <div className="relative group shrink-0">
                {exp.guide?.avatar ? (
                  <img
                    src={exp.guide.avatar}
                    alt={exp.guide?.name || 'Guide'}
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-rose-100 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0B0A06] text-white font-extrabold text-lg flex items-center justify-center font-poppins shrink-0 shadow-sm">
                    {exp.guide?.name ? exp.guide.name[0] : 'A'}
                  </div>
                )}
                {isEditMode && (
                  <>
                    <button
                      type="button"
                      disabled={isUploadingGuideAvatar}
                      onClick={() => guideAvatarInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold"
                      title="Upload Guide / Host Photo"
                    >
                      {isUploadingGuideAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={guideAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGuideAvatarUpload(file);
                      }}
                    />
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isEditMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Guide:</span>
                      <input
                        type="text"
                        value={exp.guide?.name || 'Sameer Patil'}
                        onChange={(e) => handleHostChange('name', e.target.value)}
                        placeholder="Guide Name"
                        className="text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Role:</span>
                      <input
                        type="text"
                        value={exp.guide?.role || 'Lead Trek Leader & Naturalist'}
                        onChange={(e) => handleHostChange('role', e.target.value)}
                        placeholder="Role / Title"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Exp:</span>
                      <input
                        type="text"
                        value={(exp.guide as any)?.experience || '8+ Years Expedition Experience'}
                        onChange={(e) => handleHostChange('experience', e.target.value)}
                        placeholder="e.g. 8+ Years Expedition Experience"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Treks:</span>
                      <input
                        type="text"
                        value={(exp.guide as any)?.staysCount || '350+ Treks Guided'}
                        onChange={(e) => handleHostChange('staysCount', e.target.value)}
                        placeholder="e.g. 350+ Treks Guided"
                        className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isUploadingGuideAvatar}
                        onClick={() => guideAvatarInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#ea110d] text-[11px] font-bold border border-rose-200 transition cursor-pointer"
                      >
                        {isUploadingGuideAvatar ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3" />
                            <span>{exp.guide?.avatar ? 'Change Guide Photo / Logo' : 'Upload Guide Photo / Logo'}</span>
                          </>
                        )}
                      </button>
                      {exp.guide?.avatar && (
                        <button
                          type="button"
                          onClick={() => handleHostChange('avatar', '')}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                      <span>Curated &amp; Guided by {exp.guide?.name || 'Sameer Patil'}</span>
                      {((exp.guide as any)?.verified ?? true) && (
                        <span className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0" title="Verified Host">
                          ✓
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                      {exp.guide?.role || 'Lead Trek Leader & Naturalist'} • {(exp.guide as any)?.experience || '8+ Years Expedition Experience'} • {(exp.guide as any)?.staysCount || '350+ Treks Guided'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              {isEditMode ? (
                <div className="flex flex-col gap-1.5 items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Badge:</span>
                    <input
                      type="text"
                      value={(exp.guide as any)?.confirmationBadge || 'Instant Booking Confirmed'}
                      onChange={(e) => handleHostChange('confirmationBadge', e.target.value)}
                      placeholder="Badge"
                      className="text-xs font-semibold text-[#ea110d] border border-red-200 rounded-lg px-2 py-1 w-44"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(exp.guide as any)?.verified ?? true}
                      onChange={(e) => handleHostChange('verified', e.target.checked)}
                      className="accent-[#ea110d]"
                    />
                    <span>Verified Guide</span>
                  </label>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-200/80 text-[#ea110d] text-xs font-semibold font-poppins shadow-2xs">
                  <span className="text-[#ea110d] font-bold">✓</span>
                  <span>{(exp.guide as any)?.confirmationBadge || 'Instant Booking Confirmed'}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Quick Feature Cards Strip (Dynamic: Edit / Remove / Add) ─── */}
          {(((exp as any).keyHighlights && (exp as any).keyHighlights.length > 0) || isEditMode) && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Key Experience Specs &amp; Cards ({(exp as any).keyHighlights?.length ?? 4})
                </span>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddKeyHighlight}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ea110d] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Card</span>
                  </button>
                )}
              </div>
              {!isEditMode ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80">
                    {(((exp as any).keyHighlights && (exp as any).keyHighlights.length > 0)
                      ? (exp as any).keyHighlights
                      : [
                          { name: 'Duration', desc: exp.duration || '3.5 Hours' },
                          { name: 'Difficulty', desc: exp.difficulty || 'Moderate' },
                          { name: 'Group Size', desc: `Max ${exp.maxGroupSize || 15} Explorers` },
                          { name: 'Guide Status', desc: '100% Certified' },
                        ]
                    ).map((hl: any, idx: number) => (
                      <div
                        key={idx}
                        title={hl.desc ? `${hl.name} • ${hl.desc}` : hl.name}
                        className="group flex items-center justify-center sm:justify-start gap-2.5 px-3.5 sm:px-5 py-3 sm:py-3.5 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="relative w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 flex items-center justify-center">
                          <Image
                            src="/brand/mahastays-logo-main.png"
                            alt="Mahastays"
                            width={22}
                            height={22}
                            className="w-full h-full object-contain filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                          />
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#ea110d] transition-colors font-poppins truncate tracking-tight">
                          {hl.name}: {hl.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(((exp as any).keyHighlights && (exp as any).keyHighlights.length > 0)
                    ? (exp as any).keyHighlights
                    : [
                        { name: 'Duration', desc: exp.duration || '3.5 Hours' },
                        { name: 'Difficulty', desc: exp.difficulty || 'Moderate' },
                        { name: 'Group Size', desc: `Max ${exp.maxGroupSize || 15} Explorers` },
                        { name: 'Guide Status', desc: '100% Certified' },
                      ]
                  ).map((hl: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100 relative group"
                    >
                      <div className="relative w-8 h-8 rounded-lg bg-rose-50/70 border border-rose-200/60 flex items-center justify-center shrink-0 p-1 mt-0.5">
                        <Image
                          src="/brand/mahastays-logo-main.png"
                          alt="Mahastays"
                          width={20}
                          height={20}
                          className="w-full h-full object-contain filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 transition-all"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <input
                          type="text"
                          value={hl.name}
                          onChange={(e) => handleKeyHighlightChange(idx, 'name', e.target.value)}
                          placeholder="Spec Name"
                          className="text-xs font-bold text-slate-900 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                        />
                        <input
                          type="text"
                          value={hl.desc}
                          onChange={(e) => handleKeyHighlightChange(idx, 'desc', e.target.value)}
                          placeholder="Spec Value"
                          className="text-[10px] text-slate-500 border-b border-slate-300 w-full p-0 bg-transparent focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyHighlight(idx)}
                        className="text-slate-400 hover:text-[#ea110d] p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Remove this card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                          {isEditMode ? (
                            <div className="flex flex-col gap-1.5">
                              {tier.features.map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-1 rounded-md">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <input
                                    type="text"
                                    value={feat}
                                    onChange={(e) => handleUpdateTierFeature(idx, fIdx, e.target.value)}
                                    className="bg-transparent border-0 p-0 text-xs text-slate-800 focus:outline-none flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTierFeature(idx, fIdx);
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddTierFeature(idx, 'New Feature / Spec');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ea110d] hover:underline self-start pt-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Feature</span>
                              </button>
                            </div>
                          ) : (
                            tier.features.map((feat, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-700">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))
                          )}
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

                    {/* Activity Category Spec Card */}
                    <div className="p-3 mb-3 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📂</span>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Activity Category</div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span>{exp.category}</span>
                          </div>
                        </div>
                      </div>
                      {isEditMode ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-rose-600">Change:</span>
                          <select
                            value={exp.category}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                            className="text-xs font-bold text-slate-900 border border-rose-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-rose-500 cursor-pointer shadow-xs"
                          >
                            {EXPERIENCE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Verified Activity
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => handleFieldChange('duration', e.target.value)}
                            placeholder="e.g. 3 Hours"
                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 w-full mt-0.5"
                          />
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.duration}</div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Difficulty</div>
                        {isEditMode ? (
                          <select
                            value={exp.difficulty}
                            onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 w-full mt-0.5 bg-white"
                          >
                            {DIFFICULTY_LEVELS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.difficulty}</div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Group Size</div>
                        {isEditMode ? (
                          <input
                            type="number"
                            value={exp.maxGroupSize || 15}
                            onChange={(e) => handleFieldChange('maxGroupSize', Number(e.target.value))}
                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 w-full mt-0.5"
                          />
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5">Max {exp.maxGroupSize || 15}</div>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Ideal For</div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={exp.idealFor || 'Couples & Nature Enthusiasts'}
                            onChange={(e) => handleFieldChange('idealFor', e.target.value)}
                            placeholder="e.g. Couples & Nature Enthusiasts"
                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 w-full mt-0.5"
                          />
                        ) : (
                          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{exp.idealFor || 'Couples & Nature Enthusiasts'}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Preview Banner & YouTube Editor */}
                  <div className="md:col-span-5 flex flex-col gap-2">
                    <div
                      onClick={() => setVideoModalOpen(true)}
                      className="relative rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 group cursor-pointer border border-slate-200 shadow-sm"
                    >
                      <Image
                        src={getYouTubeThumbnailUrl(exp.videoUrl, gallery[1] || gallery[0])}
                        alt="Action Video Preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
                      <div className="absolute bottom-3 right-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                          <span className="text-[#ea110d] text-xs">▶</span>
                          <span>Watch Action Preview</span>
                        </div>
                      </div>
                    </div>

                    {isEditMode && (
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                        <Video className="w-3.5 h-3.5 text-[#ea110d] shrink-0" />
                        <input
                          type="text"
                          value={exp.videoUrl || ''}
                          onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                          placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                          className="w-full text-xs bg-transparent border-0 focus:outline-none font-mono text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    )}
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
                        className="px-2.5 py-1 rounded-lg bg-[#ea110d] text-white text-xs font-bold cursor-pointer"
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
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <Sparkles className="w-4 h-4 text-[#ea110d] shrink-0 mt-0.5" />
                        {isEditMode ? (
                          <input
                            type="text"
                            value={h}
                            onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                            className="text-xs text-slate-700 font-medium bg-transparent border-b border-slate-300 w-full focus:outline-none"
                          />
                        ) : (
                          <span className="text-xs text-slate-700 font-medium">{h}</span>
                        )}
                      </div>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => requestDeleteHighlight(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0"
                          title="Remove highlight"
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
            <div id="facilities" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Inclusions */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Included in Adventure</span>
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
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
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
                      {isEditMode ? (
                        <input
                          type="text"
                          value={inc.title}
                          onChange={(e) => handleUpdateInclusion(i, e.target.value)}
                          className="font-medium text-emerald-900 bg-transparent border-0 p-0 text-xs w-full focus:outline-none"
                        />
                      ) : (
                        <span className="font-medium text-emerald-900">{inc.title}</span>
                      )}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => requestDeleteInclusion(i)}
                          className="text-slate-400 hover:text-rose-600 ml-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclusions */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Exclusions</span>
                  </h4>
                </div>

                {isEditMode && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      placeholder="e.g. Transport to base point"
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddExclusion}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  {(exp.exclusions && exp.exclusions.length > 0
                    ? exp.exclusions
                    : ['Personal trekking gear', 'Transportation to base point']
                  ).map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-50/40 border border-rose-100/60 text-xs text-slate-700"
                    >
                      {isEditMode ? (
                        <input
                          type="text"
                          value={ex}
                          onChange={(e) => handleUpdateExclusion(i, e.target.value)}
                          className="text-slate-700 bg-transparent border-0 p-0 text-xs w-full focus:outline-none"
                        />
                      ) : (
                        <span>• {ex}</span>
                      )}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExclusion(i)}
                          className="text-slate-400 hover:text-rose-600 ml-2 cursor-pointer"
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
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>What to Bring</span>
                  </h4>
                </div>

                {isEditMode && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newWhatToBring}
                      onChange={(e) => setNewWhatToBring(e.target.value)}
                      placeholder="e.g. Grip hiking shoes"
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddWhatToBring}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  {(exp.whatToBring && exp.whatToBring.length > 0
                    ? exp.whatToBring
                    : [
                        'Sturdy grip hiking shoes with socks',
                        'Comfortable breathable outdoor clothing',
                        'Light rain jacket / windcheater',
                        'Personal reusable water bottle & sun cap',
                        'Government ID for forest checkpoint',
                      ]
                  ).map((req, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-50/40 border border-amber-100/60 text-xs text-slate-700"
                    >
                      {isEditMode ? (
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => handleUpdateWhatToBring(i, e.target.value)}
                          className="text-slate-700 bg-transparent border-0 p-0 text-xs w-full focus:outline-none"
                        />
                      ) : (
                        <span>• {req}</span>
                      )}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWhatToBring(i)}
                          className="text-slate-400 hover:text-rose-600 ml-2 cursor-pointer"
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

          {/* ─── Tab 5: House Rules & Safety ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'rules') && (
            <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
                  Safety Policies &amp; House Rules
                </h3>
                <p className="text-xs text-slate-500 font-roboto">
                  Review and customize reporting times, weather cancellation terms, and trek safety rules.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Reporting & Briefing */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-poppins">Reporting &amp; Briefing</div>
                    <div className="text-[11px] text-slate-600 mt-2 space-y-1.5">
                      {isEditMode ? (
                        <>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Reporting Time</label>
                            <input
                              type="text"
                              value={(exp as any).policies?.reportingTime || 'Report 15 mins prior to slot time'}
                              onChange={(e) => handlePolicyChange('reportingTime', e.target.value)}
                              className="text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Safety Drill</label>
                            <input
                              type="text"
                              value={(exp as any).policies?.safetyDrill || 'Mandatory 10-min safety drill'}
                              onChange={(e) => handlePolicyChange('safetyDrill', e.target.value)}
                              className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p>{(exp as any).policies?.reportingTime || 'Report 15 mins prior to slot time'}</p>
                          <p>{(exp as any).policies?.safetyDrill || 'Mandatory 10-min safety drill'}</p>
                          <p className="text-slate-400">Late arrivals cannot be refunded</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 2: Weather & Cancellation */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-poppins">Weather &amp; Cancellation</div>
                    <div className="text-[11px] text-slate-600 mt-2 space-y-1.5">
                      <p className="font-semibold text-emerald-700">100% Weather Refund</p>
                      {isEditMode ? (
                        <textarea
                          rows={3}
                          value={
                            (exp as any).cancellationPolicy ||
                            (exp as any).policies?.cancellationPolicy ||
                            'Full refund or free reschedule in case of heavy downpour or forest closure.'
                          }
                          onChange={(e) => {
                            handlePolicyChange('cancellationPolicy', e.target.value);
                            setExp({ ...exp, cancellationPolicy: e.target.value });
                          }}
                          className="text-xs text-slate-700 border border-slate-200 rounded-lg p-2 w-full bg-white focus:outline-rose-500"
                        />
                      ) : (
                        <p>
                          {(exp as any).cancellationPolicy ||
                            (exp as any).policies?.cancellationPolicy ||
                            'Full refund or free reschedule in case of heavy downpour or forest closure.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Fitness & Age Limits */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-slate-900 font-poppins">Fitness &amp; Age Limits</div>
                      </div>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={handleAddSafetyRule}
                          className="text-[11px] font-bold text-[#ea110d] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1.5 mt-2">
                      {((exp as any).policies?.safetyRules || [
                        'Min age: 8 years for moderate trails',
                        'Not recommended for heart patients',
                        '1 Guide per 6 explorers guarantee',
                      ]).map((rule: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-1.5">
                          {isEditMode ? (
                            <>
                              <input
                                type="text"
                                value={rule}
                                onChange={(e) => handleUpdateSafetyRule(idx, e.target.value)}
                                className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 flex-1 bg-white focus:outline-rose-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveSafetyRule(idx)}
                                className="text-slate-400 hover:text-[#ea110d] p-1 rounded-md hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <p>• {rule}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 4: Insurance & Medical */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 mb-2.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-poppins">Insurance &amp; Medical</div>
                    <div className="text-[11px] text-slate-600 mt-2 space-y-1.5">
                      {isEditMode ? (
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Medical Gear Note</label>
                          <input
                            type="text"
                            value={(exp as any).policies?.medicalNote || 'Certified wilderness first-aid kit on-call'}
                            onChange={(e) => handlePolicyChange('medicalNote', e.target.value)}
                            className="text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 w-full bg-white focus:outline-rose-500"
                          />
                        </div>
                      ) : (
                        <>
                          <p>• {(exp as any).policies?.medicalNote || 'Certified wilderness first-aid kit'}</p>
                          <p>• On-call rescue team coordination</p>
                          <p>• Complimentary trek badge</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 6: Location & Basecamp ─── */}
          {(activeDetailTab === 'all' || activeDetailTab === 'location') && (
            <div id="location" className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Location Setup Type:</span>
                    <span className="text-xs text-rose-600 font-bold uppercase">{exp.locationType || 'fixed_location'}</span>
                  </h3>
                  {isEditMode && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setExp((prev) => prev ? { ...prev, locationType: 'fixed_location' } : prev)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                          (exp.locationType || 'fixed_location') === 'fixed_location'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        📍 Host Venue
                      </button>
                      <button
                        type="button"
                        onClick={() => setExp((prev) => prev ? { ...prev, locationType: 'customer_location' } : prev)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                          exp.locationType === 'customer_location'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        🚗 At Customer's Stay
                      </button>
                      <button
                        type="button"
                        onClick={() => setExp((prev) => prev ? { ...prev, locationType: 'both' } : prev)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                          exp.locationType === 'both'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        🔄 Both / Flexible
                      </button>
                    </div>
                  )}
                </div>
                {exp.locationType === 'customer_location' && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex flex-col gap-1.5">
                    <span className="font-bold">🚗 Delivered At Customer's Location / Stay:</span>
                    <span>The host / vendor travels directly to the customer's booked villa, resort, or accommodation with full equipment &amp; setup.</span>
                    {isEditMode && (
                      <div className="pt-2">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Service Area / Coverage:</label>
                        <input
                          type="text"
                          value={exp.serviceArea || 'Across Mahabaleshwar & Panchgani villas/resorts'}
                          onChange={(e) => setExp((prev) => prev ? { ...prev, serviceArea: e.target.value } : prev)}
                          placeholder="e.g. Mahabaleshwar & Panchgani (within 20 km)"
                          className="w-full p-2 rounded-lg bg-white border border-emerald-300 text-xs text-slate-800 font-semibold"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <LocationMapPicker
                propertyName={exp.title}
                locationArea={exp.location || exp.city || 'Old Mahabaleshwar & Panchgani'}
                initialCoordinates={{
                  lat: exp.coordinates?.lat || exp.address?.lat || 17.9242,
                  lng: exp.coordinates?.lng || exp.address?.lng || 73.8015,
                  fullAddress: exp.meetingPoint || exp.address?.fullAddress || exp.location || exp.city,
                  mapLink: exp.address?.mapLink || `https://www.google.com/maps?q=${exp.coordinates?.lat || 17.9242},${exp.coordinates?.lng || 73.8015}`,
                }}
                isEditMode={isEditMode}
                nearbyAttractions={exp.nearbyAttractions || [
                  { name: 'Basecamp Assembly Point', distance: '1.5 km • 5 mins', desc: 'Parking available for cars & bikes' },
                  { name: 'Venna Lake Boating Hub', distance: '4.2 km • 10 mins', desc: 'Nearby activity hotspot' },
                  { name: 'Forest Checkpost', distance: '800 m • 2 mins', desc: 'Permit entry & biometric registration' },
                ]}
                onChange={(coords) => {
                  setExp((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      meetingPoint: coords.fullAddress || prev.meetingPoint,
                      location: coords.fullAddress || prev.location,
                      coordinates: {
                        lat: coords.lat,
                        lng: coords.lng,
                      },
                      address: {
                        lat: coords.lat,
                        lng: coords.lng,
                        fullAddress: coords.fullAddress || prev.location || '',
                        mapLink: coords.mapLink || `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
                      },
                    };
                  });
                }}
                onAttractionsChange={(attractions) => {
                  setExp((prev) => (prev ? { ...prev, nearbyAttractions: attractions } : prev));
                }}
              />
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

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Adult Explorers</div>
                  <div className="text-xs font-bold text-slate-900">
                    {adults} Adult{adults > 1 ? 's' : ''} (₹{pricePerPerson.toLocaleString('en-IN')})
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

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Child Explorers</div>
                  <div className="text-xs font-bold text-slate-900">
                    {children} Child{children > 1 ? 'ren' : ''} {hasChildPrice ? `(₹${effectiveChildPrice.toLocaleString('en-IN')})` : `(₹${pricePerPerson.toLocaleString('en-IN')} adult rate)`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                    className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren((prev) => prev + 1)}
                    className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast.info(`Simulating experience booking for ${exp.title}.`, 'Booking Preview')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Reserve &amp; Book Experience</span>
              <span>→</span>
            </button>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pricing Breakdown</span>
                <button
                  type="button"
                  onClick={() => setShowPricingEdit(!showPricingEdit)}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-1 cursor-pointer"
                >
                  {showPricingEdit ? '✓ Close Edit Rates' : '⚙ Edit Fees & Discounts'}
                </button>
              </div>

              {/* Inline Rates & Fees Customizer */}
              {showPricingEdit && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 mb-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Experience Pricing &amp; Fees</span>
                    <span className="text-[10px] text-amber-600 font-normal">Saves on &ldquo;Save to Backend&rdquo;</span>
                  </div>

                  {/* 0. Pricing Model (Per Person vs Per Activity / Full Setup vs Per Night) */}
                  <div className="space-y-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Price Model</span>
                      <span className="text-[10px] text-rose-600 font-bold uppercase">{exp.priceType || 'per_person'}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExp({ ...exp, priceType: 'per_person' })}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition text-center ${
                          (exp.priceType || 'per_person') === 'per_person'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        👤 Per Person
                      </button>
                      <button
                        type="button"
                        onClick={() => setExp({ ...exp, priceType: 'per_activity' })}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition text-center ${
                          exp.priceType === 'per_activity' || exp.priceType === 'full_setup'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        🎪 Full Setup
                      </button>
                      <button
                        type="button"
                        onClick={() => setExp({ ...exp, priceType: 'per_night' })}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition text-center ${
                          exp.priceType === 'per_night'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        🌙 Per Night
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {exp.priceType === 'per_activity' || exp.priceType === 'full_setup'
                        ? '🎪 Full Setup / Per Activity: Flat rate for the entire activity. Price does NOT increase with guest count.'
                        : exp.priceType === 'per_night'
                        ? '🌙 Per Night: Flat session rate per night.'
                        : '👤 Per Person: Total price multiplies by adult & child participants.'}
                    </p>
                  </div>

                  {/* 0B. Person Limit */}
                  <div className="space-y-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Person Limit (Max Participants)</span>
                      <span className="text-[10px] text-slate-400">Capacity</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={exp.personLimit || 15}
                        onChange={(e) => setExp({ ...exp, personLimit: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">explorers limit</span>
                    </div>
                  </div>

                  {/* 1. Discount Percentage */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Member Discount (%)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{discountPercent}%</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => handlePricingRuleChange('memberDiscountPercent', Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {[0, 8, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handlePricingRuleChange('memberDiscountPercent', pct)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              discountPercent === pct ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {pct === 0 ? 'None' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Gear & Trail Insurance Fee */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Gear &amp; Trail Insurance Fee (₹)</span>
                      <span className={`text-[10px] font-bold ${includeCleaningFee ? 'text-slate-700 dark:text-slate-300' : 'text-red-500 line-through'}`}>
                        {includeCleaningFee ? `₹${gearFee}` : 'Fee Removed'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          disabled={!includeCleaningFee}
                          value={configuredFee}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            handlePricingRuleChange('cleaningFee', val);
                          }}
                          className={`w-full pl-6 pr-2 py-1.5 rounded-xl border text-xs font-bold ${
                            includeCleaningFee ? 'bg-white dark:bg-slate-900 border-slate-200' : 'bg-slate-100 text-slate-400 line-through'
                          }`}
                        />
                      </div>
                      {includeCleaningFee ? (
                        <button
                          type="button"
                          onClick={() => {
                            handlePricingRuleChange('includeCleaningFee', false);
                            handlePricingRuleChange('cleaningFee', 0);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Remove Fee</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handlePricingRuleChange('includeCleaningFee', true);
                            handlePricingRuleChange('cleaningFee', 199);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. GST Rate */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Taxes &amp; GST Rate (%)</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{includeGst ? `${gstPercent}% GST` : 'Exempt'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="28"
                        disabled={!includeGst}
                        value={gstPercent}
                        onChange={(e) => handlePricingRuleChange('gstPercent', Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-xs font-bold"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {[0, 5, 12, 18].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              handlePricingRuleChange('includeGst', g > 0);
                              handlePricingRuleChange('gstPercent', g);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              gstPercent === g && (g === 0 || includeGst) ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {g === 0 ? 'Exempt' : `${g}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Child Pricing Configuration */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Different Child Pricing</span>
                        <span className="text-[10px] text-slate-400">If unchecked, children use default adult rate</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasChildPrice}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setExp((prev) => {
                            if (!prev) return prev;
                            const defaultC = prev.childPrice || Math.round(pricePerPerson * 0.6);
                            return {
                              ...prev,
                              hasChildPrice: val,
                              childPrice: val ? defaultC : undefined,
                              pricingRules: {
                                ...(prev.pricingRules || {}),
                                hasChildPrice: val,
                                childPrice: val ? defaultC : undefined,
                              },
                            };
                          });
                        }}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </div>

                    {hasChildPrice && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">Child Rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="399"
                            value={configuredChildPrice ?? ''}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setExp((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  childPrice: val,
                                  pricingRules: {
                                    ...(prev.pricingRules || {}),
                                    childPrice: val,
                                  },
                                };
                              });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">Child Age Limit</label>
                          <input
                            type="text"
                            placeholder="Below 12 years"
                            value={childPriceLimit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExp((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  childAgeLimit: val,
                                  pricingRules: {
                                    ...(prev.pricingRules || {}),
                                    childAgeLimit: val,
                                  },
                                };
                              });
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Person Limit Exceeded Warning */}
              {adults + children > personLimit && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <span className="font-bold block">⚠️ Participant limit exceeded!</span>
                  <span>This experience is limited to {personLimit} participants ({isPerNight ? 'flat session rate' : 'session capacity'}). You have {adults + children} participants.</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>
                  {isPerNight
                    ? `₹${pricePerPerson.toLocaleString('en-IN')} / session (flat up to ${personLimit} explorers)`
                    : hasChildPrice && children > 0
                    ? `₹${pricePerPerson.toLocaleString('en-IN')} × ${adults} adult${adults > 1 ? 's' : ''} + ₹${effectiveChildPrice.toLocaleString('en-IN')} × ${children} child (${childPriceLimit})`
                    : `₹${pricePerPerson.toLocaleString('en-IN')} × ${adults + children} participant${(adults + children) > 1 ? 's' : ''}`}
                </span>
                <span className="text-slate-900 font-semibold">₹{baseCost.toLocaleString('en-IN')}</span>
              </div>

              {memberDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Mahastays Member Discount ({discountPercent}%)</span>
                  <span>-₹{memberDiscount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Member Discount</span>
                  <span>₹0 (None)</span>
                </div>
              )}

              {includeCleaningFee && gearFee > 0 ? (
                <div className="flex justify-between">
                  <span>Gear &amp; Trail Insurance Fee</span>
                  <span className="text-slate-900 font-semibold">₹{gearFee}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Gear &amp; Trail Insurance Fee</span>
                  <span className="text-emerald-600 font-semibold">₹0 (Removed / Waived)</span>
                </div>
              )}

              {includeGst && gstPercent > 0 ? (
                <div className="flex justify-between">
                  <span>Taxes &amp; GST ({gstPercent}%)</span>
                  <span className="text-slate-900 font-semibold">₹{taxesGst.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Taxes &amp; GST</span>
                  <span>₹0 (GST Exempt)</span>
                </div>
              )}

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

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={exp.videoUrl}
        title={`Action Preview: ${exp.title}`}
        isEditMode={isEditMode}
        onUpdateUrl={(newUrl) => handleFieldChange('videoUrl', newUrl)}
      />
    </div>
  );
}
