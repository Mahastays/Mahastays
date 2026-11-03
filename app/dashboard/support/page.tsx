'use client';

import React from 'react';
import { Headphones, Mail, Phone, MessageSquare, ExternalLink } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Operations & Partner Support Desk
          </h2>
          <p className="text-xs text-slate-400">
            Dedicated assistance for property listing queries, dispute resolution, and platform operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Direct Operations Email</div>
            <p className="text-slate-500 mt-1">Direct inquiries for urgent listing escalations.</p>
          </div>
          <a
            href="mailto:support@mahastays.com"
            className="inline-block text-rose-600 dark:text-rose-400 font-semibold underline text-xs"
          >
            support@mahastays.com
          </a>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Partner Priority Helpline</div>
            <p className="text-slate-500 mt-1">Available 9:00 AM - 9:00 PM IST daily.</p>
          </div>
          <div className="text-emerald-600 font-semibold text-xs">+91 (020) 2567-8900</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">MTDC Knowledge Base</div>
            <p className="text-slate-500 mt-1">Maharashtra Tourism regulatory documentation.</p>
          </div>
          <div className="text-sky-600 font-semibold text-xs">mahatourism.gov.in/guidelines</div>
        </div>
      </div>
    </div>
  );
}
