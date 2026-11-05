'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetKind: 'property' | 'package' | 'experience' | 'vendor' | null;
  targetId: string;
  targetName: string;
}

export default function RejectReasonModal({
  isOpen,
  onClose,
  targetKind,
  targetId,
  targetName,
}: RejectReasonModalProps) {
  const { rejectProperty, rejectPackage, rejectExperience, verifyVendorKYC } = useData();
  const [reason, setReason] = useState('Missing MTDC tourism license or valid safety certification.');

  if (!isOpen || !targetKind) return null;

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    if (targetKind === 'property') {
      rejectProperty(targetId, reason.trim());
    } else if (targetKind === 'package') {
      rejectPackage(targetId, reason.trim());
    } else if (targetKind === 'experience') {
      rejectExperience(targetId, reason.trim());
    } else if (targetKind === 'vendor') {
      verifyVendorKYC(targetId, false, reason.trim());
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Reject Submission
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleReject} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Please provide constructive feedback for{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{targetName}</span>.
            The vendor partner will see this explanation in their portal.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Rejection Reason & Required Changes
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
