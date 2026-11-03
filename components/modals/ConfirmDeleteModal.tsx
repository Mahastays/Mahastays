'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  itemType?: string;
  message?: React.ReactNode;
  confirmText?: string;
  confirmButtonText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName,
  itemType,
  message,
  confirmText,
  confirmButtonText,
  cancelText = 'Cancel',
  isDeleting,
  isLoading,
}: ConfirmDeleteModalProps) {
  const effectiveConfirmText = confirmButtonText || confirmText || 'Delete Permanently';
  const effectiveIsDeleting = Boolean(isLoading || isDeleting);
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !effectiveIsDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, effectiveIsDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop click */}
      <div
        className="absolute inset-0"
        onClick={() => !effectiveIsDeleting && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 z-10"
      >
        {/* Close "X" Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={effectiveIsDeleting}
          className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-xl mx-auto shadow-inner">
          <Trash2 className="w-6 h-6 animate-pulse" />
        </div>

        {/* Title and Message */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-poppins">
            {title}
          </h3>
          {message ? (
            <div className="text-xs text-slate-500 leading-relaxed font-roboto">
              {message}
            </div>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed font-roboto">
              Are you sure you want to permanently delete{' '}
              {itemName ? (
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  &ldquo;{itemName}&rdquo;
                </strong>
              ) : itemType ? (
                `this ${itemType}`
              ) : (
                'this item'
              )}
              ? This action cannot be undone and will permanently remove all associated data.
            </p>
          )}
        </div>

        {/* Caution Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-2.5 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-[11px]">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Warning: This change is irreversible once confirmed.</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={effectiveIsDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={effectiveIsDeleting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ea110d] hover:bg-[#d00f0c] text-white transition shadow-sm shadow-red-500/20 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 active:scale-95"
          >
            {effectiveIsDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{effectiveConfirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
