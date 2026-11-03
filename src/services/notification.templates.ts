import { env } from '../config/env';
import { formatInr } from '../utils/money';

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

function layout(title: string, inner: string): { html: string } {
  return {
    html: `<!doctype html><html><body style="margin:0;background:#f4f6f7;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:14px;padding:28px">
<h2 style="color:#173e45;margin:0 0 16px">${esc(title)}</h2>${inner}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="color:#6b7280;font-size:12px;margin:0">Mahastays — stays, packages & experiences in Mahabaleshwar and Panchgani.</p>
</div></body></html>`,
  };
}

const button = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${esc(href)}" style="background:#173e45;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${esc(label)}</a></p>`;

export const templates = {
  verifyEmail(name: string, token: string) {
    const link = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
    return { subject: 'Verify your Mahastays email', ...layout('Verify your email', `<p>Hi ${esc(name)},</p><p>Please confirm your email address to secure your account.</p>${button(link, 'Verify email')}<p style="color:#6b7280;font-size:13px">This link expires in 24 hours.</p>`) };
  },

  passwordReset(name: string, token: string, role: string) {
    const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}&role=${encodeURIComponent(role)}`;
    return { subject: 'Reset your Mahastays password', ...layout('Reset your password', `<p>Hi ${esc(name)},</p><p>We received a request to reset your password. If this was you, use the button below. If not, you can ignore this email.</p>${button(link, 'Choose a new password')}<p style="color:#6b7280;font-size:13px">This link expires in 30 minutes.</p>`) };
  },

  welcomeUser(input: { name: string; email: string }) {
    return {
      subject: `Welcome to Mahastays, ${input.name}! 🌄`,
      ...layout(
        'Welcome to Mahastays! 🌄',
        `<p>Hi <b>${esc(input.name)}</b>,</p>
<p>We're thrilled to welcome you to <b>Mahastays</b> — Maharashtra's premier platform for standalone cliff villas, boutique resorts, and curated hill-station adventures across Mahabaleshwar and Panchgani.</p>
<div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:12px;padding:16px;margin:20px 0">
  <h4 style="margin:0 0 8px;color:#ea110d">👑 Your Member Privileges Are Now Active</h4>
  <ul style="margin:0;padding-left:18px;color:#4a5568;font-size:13px;line-height:1.6">
    <li><b>Instant 8% Member Discount</b> automatically unlocked on every booking</li>
    <li><b>100% Verified Stays &amp; Activities</b> with clean sanitation standards</li>
    <li><b>Priority Early Check-in / Late Check-out</b> upon request</li>
    <li><b>Dedicated 24x7 WhatsApp Concierge</b> at +91 99999 00000</li>
  </ul>
</div>
<p style="font-size:14px;color:#334155">Ready to plan your next scenic getaway?</p>
${button(`${env.APP_URL}/explore`, 'Explore Stays &amp; Villas')}
<p style="color:#6b7280;font-size:12px;margin-top:20px">If you ever need help, feel free to reply directly to this email or contact us at <a href="mailto:${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}" style="color:#ea110d">${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}</a>.</p>`,
      ),
    };
  },

  bookingConfirmed(input: { name: string; reference: string; title: string; when: string; totalInr: number; guests?: string; invoiceNumber?: string }) {
    return {
      subject: `Booking Confirmed — ${input.reference} 🎉`,
      ...layout(
        'Your Booking is Confirmed & Guaranteed 🎉',
        `<p>Hi <b>${esc(input.name)}</b>,</p>
<p>Thank you for choosing Mahastays! Your reservation has been officially saved into the system and confirmed.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:20px 0">
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr><td style="padding:7px 0;color:#64748b">Booking Reference</td><td style="text-align:right;color:#ea110d"><b>${esc(input.reference)}</b></td></tr>
${input.invoiceNumber ? `<tr><td style="padding:7px 0;color:#64748b">GST Invoice #</td><td style="text-align:right"><b>${esc(input.invoiceNumber)}</b></td></tr>` : ''}
<tr><td style="padding:7px 0;color:#64748b">Property / Experience</td><td style="text-align:right"><b>${esc(input.title)}</b></td></tr>
<tr><td style="padding:7px 0;color:#64748b">Dates / Schedule</td><td style="text-align:right">${esc(input.when)}</td></tr>
${input.guests ? `<tr><td style="padding:7px 0;color:#64748b">Travelers</td><td style="text-align:right">${esc(input.guests)}</td></tr>` : ''}
<tr style="border-top:1px solid #e2e8f0"><td style="padding:9px 0 0;color:#1e293b;font-weight:bold">Grand Total</td><td style="text-align:right;padding:9px 0 0;color:#ea110d;font-size:16px"><b>${formatInr(input.totalInr)}</b></td></tr>
</table>
</div>
<p style="font-size:13px;color:#475569">Your verified check-in voucher is now available. You can view or download it anytime from your Mahastays account.</p>
${button(`${env.APP_URL}/profile?tab=bookings`, 'View Booking Voucher')}
<p style="color:#6b7280;font-size:12px">Need assistance? Reach our 24x7 Mahabaleshwar Concierge at +91 99999 00000 or email <a href="mailto:${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}" style="color:#ea110d">${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}</a>.</p>`,
      ),
    };
  },

  bookingCancelled(input: { name: string; reference: string; title: string; refundInr: number; penaltyInr: number }) {
    return {
      subject: `Booking cancelled — ${input.reference}`,
      ...layout(
        'Your booking was cancelled',
        `<p>Hi ${esc(input.name)},</p><p>Your booking <b>${esc(input.reference)}</b> (${esc(input.title)}) has been cancelled.</p>
<p>Refund: <b>${formatInr(input.refundInr)}</b>${input.penaltyInr > 0 ? ` &nbsp;·&nbsp; Cancellation charge: ${formatInr(input.penaltyInr)}` : ''}</p>
<p style="color:#6b7280;font-size:13px">Refunds are returned to the original payment method; banks usually take 5–7 working days.</p>`,
      ),
    };
  },

  vendorDecision(input: { name: string; approved: boolean; reason?: string | null }) {
    return {
      subject: input.approved ? 'Your Mahastays vendor account is approved' : 'Update on your Mahastays vendor application',
      ...layout(
        input.approved ? 'Welcome aboard! 🎉' : 'Application update',
        input.approved
          ? `<p>Hi ${esc(input.name)},</p><p>Your KYC has been verified and your vendor account is now active. You can start publishing listings.</p>${button(`${env.APP_URL}/vendor`, 'Open vendor dashboard')}`
          : `<p>Hi ${esc(input.name)},</p><p>We could not approve your application yet.</p>${input.reason ? `<p><b>Reason:</b> ${esc(input.reason)}</p>` : ''}<p>Please update your documents and resubmit.</p>`,
      ),
    };
  },

  listingDecision(input: { name: string; listing: string; approved: boolean; reason?: string | null }) {
    return {
      subject: `${input.approved ? 'Approved' : 'Needs changes'}: ${input.listing}`,
      ...layout(
        input.approved ? 'Your listing is live' : 'Your listing needs changes',
        `<p>Hi ${esc(input.name)},</p><p>${input.approved ? `<b>${esc(input.listing)}</b> has been approved and is now visible to travellers.` : `<b>${esc(input.listing)}</b> was not approved.${input.reason ? ` Reason: ${esc(input.reason)}` : ''}`}</p>`,
      ),
    };
  },
};
