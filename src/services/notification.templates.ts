import { env } from '../config/env';
import { formatInr } from '../utils/money';

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export const MAHASTAYS_CLOUDINARY_LOGO =
  'https://res.cloudinary.com/vxtop5jd/image/upload/v1793725764/mahastays/brand/mahastays-logo.png';

// Inline SVGs for universal email client compatibility — 100% vector, solid colors, zero gradients
const SVG_ICONS = {
  lock: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea110d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  shieldCheck: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`,
  bed: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:8px;"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>`,
  support: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:8px;"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`,
  instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
  linkedin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
  youtube: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>`,
};

interface LayoutOptions {
  badge?: string;
  badgeType?: 'success' | 'danger' | 'neutral' | 'brand';
  preheader?: string;
}

function layout(title: string, inner: string, options: LayoutOptions = {}): { html: string } {
  const badgeHtml = options.badge
    ? `<span style="display:inline-block;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:0.3px;border-radius:8px;${
        options.badgeType === 'danger'
          ? 'background:#fff1f1;color:#b91c1c;border:1px solid #ffd5d5;'
          : options.badgeType === 'success'
          ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
          : options.badgeType === 'brand'
          ? 'background:#fff1f1;color:#ea110d;border:1px solid #ffd5d5;'
          : 'background:#f8fafc;color:#475569;border:1px solid #e2e8f0;'
      }">${esc(options.badge)}</span>`
    : '';

  return {
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
  ${options.preheader ? `<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${esc(options.preheader)}</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Max 580px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;border:1px solid #edf2f7;box-shadow:0 4px 20px rgba(0,0,0,0.03);overflow:hidden;">
          
          <!-- Header with Cloudinary Brand Logo & Badge -->
          <tr>
            <td style="padding:28px 36px 20px 36px;border-bottom:1px solid #edf2f7;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${esc(env.APP_URL)}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${MAHASTAYS_CLOUDINARY_LOGO}" alt="Mahastays" width="160" height="38" style="display:block;width:160px;height:auto;max-height:40px;border:0;outline:none;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    ${badgeHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px 36px 36px 36px;">
              <h1 style="color:#0f172a;font-size:25px;font-weight:800;line-height:1.25;letter-spacing:-0.4px;margin:0 0 10px 0;">
                ${esc(title)}
              </h1>
              <!-- Solid Red Accent Underline Bar (No Gradient) -->
              <div style="width:44px;height:4px;background-color:#ea110d;border-radius:2px;margin:0 0 24px 0;"></div>

              <div style="font-size:14px;line-height:1.65;color:#334155;">
                ${inner}
              </div>
            </td>
          </tr>

          <!-- Trust & Quality Verification Strip (Solid Colors & Real Icons) -->
          <tr>
            <td style="background-color:#ffffff;padding:18px 24px;border-top:1px solid #edf2f7;border-bottom:1px solid #edf2f7;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" style="width:33.33%;border-right:1px solid #edf2f7;padding:4px 8px;">
                    ${SVG_ICONS.shieldCheck}
                    <span style="font-size:13px;font-weight:600;color:#1e293b;vertical-align:middle;">Verified Stays</span>
                  </td>
                  <td align="center" valign="middle" style="width:33.33%;border-right:1px solid #edf2f7;padding:4px 8px;">
                    ${SVG_ICONS.bed}
                    <span style="font-size:13px;font-weight:600;color:#1e293b;vertical-align:middle;">Quality Properties</span>
                  </td>
                  <td align="center" valign="middle" style="width:33.33%;padding:4px 8px;">
                    ${SVG_ICONS.support}
                    <span style="font-size:13px;font-weight:600;color:#1e293b;vertical-align:middle;">24&times;7 Support</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer with Address & Social Icons -->
          <tr>
            <td style="background-color:#ffffff;padding:26px 36px 24px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="top" style="line-height:1.5;">
                    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;">Mahastays Hospitality Platform</div>
                    <div style="font-size:12px;color:#64748b;">Venna Lake Road, Mahabaleshwar &amp; Panchgani, Maharashtra 412806, India</div>
                  </td>
                  <td align="right" valign="middle" style="white-space:nowrap;padding-left:16px;">
                    <a href="https://instagram.com" target="_blank" style="text-decoration:none;display:inline-block;margin-left:12px;">${SVG_ICONS.instagram}</a>
                    <a href="https://linkedin.com" target="_blank" style="text-decoration:none;display:inline-block;margin-left:12px;">${SVG_ICONS.linkedin}</a>
                    <a href="https://youtube.com" target="_blank" style="text-decoration:none;display:inline-block;margin-left:12px;">${SVG_ICONS.youtube}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Copyright Bar -->
          <tr>
            <td align="center" style="background-color:#f8fafc;padding:16px 24px;border-top:1px solid #edf2f7;font-size:12px;color:#64748b;font-weight:500;">
              &copy; ${new Date().getFullYear()} Mahastays. All rights reserved.
            </td>
          </tr>

        </table>

        <!-- Small transactional note below card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;margin-top:16px;">
          <tr>
            <td align="center" style="font-size:11px;color:#94a3b8;">
              This is an official transactional notification sent to your registered account.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

const button = (href: string, label: string) =>
  `<div style="margin:24px 0;">
    <a href="${esc(href)}" target="_blank" style="background-color:#ea110d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:10px;display:inline-block;letter-spacing:0.2px;text-align:center;">
      ${esc(label)} &rarr;
    </a>
  </div>`;

export const templates = {
  adminLoginOtp(name: string, otp: string) {
    const spacedOtp = otp.split('').join(' ');
    return {
      subject: `Your Mahastays Admin Verification Code: ${otp}`,
      ...layout(
        'Admin Portal Verification',
        `<p style="margin:0 0 12px;font-size:14px;color:#0f172a;">Dear <strong>${esc(name)}</strong>,</p>
        <p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.6;">A sign-in attempt was initiated for your Mahastays Admin Operations account. Use the one-time verification code below to complete your authentication.</p>
        
        <!-- Code Box (Solid Colors, Zero Gradient) -->
        <div style="background-color:#fff5f5;border:1px solid #fed7d7;border-radius:14px;padding:26px 20px 22px;margin:22px 0;text-align:center;">
          <div style="font-size:13px;font-weight:600;color:#4a5568;margin-bottom:12px;letter-spacing:0.2px;">Your 6-Digit One-Time Code</div>
          <div style="font-size:38px;font-weight:900;letter-spacing:14px;color:#c53030;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:4px 0 14px 0;padding-left:14px;line-height:1;">${spacedOtp}</div>
          <div style="font-size:12px;color:#718096;font-weight:500;">Valid for 10 minutes &nbsp;|&nbsp; Do not share this code with anyone.</div>
        </div>

        <!-- Security Warning Box with Lock Icon and Divider (No Gradient) -->
        <div style="background-color:#fff5f5;border:1px solid #fed7d7;border-radius:10px;margin:22px 0;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" valign="middle" style="width:54px;padding:14px 0;border-right:1px solid #fed7d7;">
                ${SVG_ICONS.lock}
              </td>
              <td valign="middle" style="padding:14px 18px;font-size:12px;line-height:1.55;">
                <strong style="color:#c53030;">Security Warning:</strong> <span style="color:#4a5568;">If you did not initiate this login request, your account password may be compromised. Please change your password immediately or contact support.</span>
              </td>
            </tr>
          </table>
        </div>`,
        { badge: 'Admin Security 2FA', badgeType: 'danger', preheader: `Your one-time login verification code is ${otp}` }
      ),
    };
  },

  verifyEmail(name: string, token: string) {
    const link = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
    return {
      subject: 'Verify your Mahastays account email',
      ...layout(
        'Verify your Email Address',
        `<p style="margin:0 0 12px;">Dear <strong>${esc(name)}</strong>,</p>
        <p style="margin:0 0 16px;">Thank you for registering with Mahastays. Please confirm your email address to secure your account and activate your member privileges.</p>
        ${button(link, 'Verify Email Address')}
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin:20px 0;font-size:12px;color:#64748b;">
          <strong>Security Note:</strong> This verification link will expire in 24 hours. If you did not create a Mahastays account, you can safely ignore this email.
        </div>`,
        { badge: 'Account Security', badgeType: 'brand', preheader: 'Please verify your email address to complete your registration.' }
      ),
    };
  },

  passwordReset(name: string, token: string, role: string) {
    const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}&role=${encodeURIComponent(role)}`;
    return {
      subject: 'Reset your Mahastays password',
      ...layout(
        'Reset your Password',
        `<p style="margin:0 0 12px;">Dear <strong>${esc(name)}</strong>,</p>
        <p style="margin:0 0 16px;">We received an authorized request to reset the password for your Mahastays account. Please click the button below to select a new secure password.</p>
        ${button(link, 'Choose New Password')}
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin:20px 0;font-size:12px;color:#991b1b;">
          <strong>Notice:</strong> For your security, this password reset link expires in 30 minutes. If you did not make this request, please contact our support team immediately.
        </div>`,
        { badge: 'Password Reset', badgeType: 'danger', preheader: 'Instructions to reset your Mahastays account password.' }
      ),
    };
  },

  welcomeUser(input: { name: string; email: string }) {
    return {
      subject: `Welcome to Mahastays, ${input.name}`,
      ...layout(
        'Welcome to Mahastays',
        `<p style="margin:0 0 12px;">Dear <strong>${esc(input.name)}</strong>,</p>
        <p style="margin:0 0 16px;">We are pleased to welcome you to <strong>Mahastays</strong> &mdash; Maharashtra's premier hospitality platform for standalone cliff villas, boutique heritage resorts, and curated adventure tours across Mahabaleshwar and Panchgani.</p>
        
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #ea110d;border-radius:12px;padding:18px 20px;margin:22px 0;">
          <h3 style="margin:0 0 10px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Your Member Privileges Are Active</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#475569;line-height:1.7;">
            <tr>
              <td style="padding:4px 0;"><span style="color:#ea110d;font-weight:bold;margin-right:8px;">&#10003;</span> <strong>Instant 8% Club Member Discount</strong> on all bookings</td>
            </tr>
            <tr>
              <td style="padding:4px 0;"><span style="color:#ea110d;font-weight:bold;margin-right:8px;">&#10003;</span> <strong>100% Quality Inspected Properties</strong> with certified amenities</td>
            </tr>
            <tr>
              <td style="padding:4px 0;"><span style="color:#ea110d;font-weight:bold;margin-right:8px;">&#10003;</span> <strong>Priority Early Check-in</strong> subject to availability</td>
            </tr>
            <tr>
              <td style="padding:4px 0;"><span style="color:#ea110d;font-weight:bold;margin-right:8px;">&#10003;</span> <strong>Dedicated 24x7 On-Ground Concierge</strong> at +91 7741002157 (WhatsApp: +91 94054 19021)</td>
            </tr>
          </table>
        </div>

        <p style="font-size:14px;color:#334155;margin:0 0 8px;">Explore verified stays and plan your upcoming getaway:</p>
        ${button(`${env.APP_URL}/explore`, 'Explore Luxury Stays &amp; Villas')}

        <div style="border-top:1px solid #f1f5f9;padding-top:16px;margin-top:24px;font-size:12px;color:#64748b;">
          Need assistance? Our concierge desk is available at <a href="mailto:${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}" style="color:#ea110d;text-decoration:none;font-weight:600;">${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}</a> or call <strong>+91 7741002157</strong> (WhatsApp: <strong>+91 94054 19021</strong>).
        </div>`,
        { badge: 'Member Welcome', badgeType: 'brand', preheader: 'Welcome to Mahastays. Your member privileges are now active.' }
      ),
    };
  },

  bookingConfirmed(input: {
    name: string;
    reference: string;
    title: string;
    when: string;
    totalInr: number;
    guests?: string;
    invoiceNumber?: string;
  }) {
    const invoiceDisplay = input.invoiceNumber || input.reference.replace('MHA-', 'INV-');

    return {
      subject: `Booking Confirmed &mdash; ${input.reference}`,
      ...layout(
        'Your Booking is Confirmed & Guaranteed',
        `<p style="margin:0 0 12px;">Dear <strong>${esc(input.name)}</strong>,</p>
        <p style="margin:0 0 20px;color:#475569;">Thank you for choosing Mahastays. Your reservation has been confirmed and verified in our central reservation system. Below is your reservation summary.</p>
        
        <!-- Reservation Summary Card -->
        <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:20px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.6;">
            <tr>
              <td style="padding:7px 0;color:#64748b;font-weight:500;">Booking Reference</td>
              <td style="padding:7px 0;text-align:right;color:#ea110d;font-weight:700;font-size:14px;">${esc(input.reference)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#64748b;font-weight:500;">GST Tax Invoice #</td>
              <td style="padding:7px 0;text-align:right;color:#0f172a;font-weight:600;">${esc(invoiceDisplay)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#64748b;font-weight:500;">Property / Experience</td>
              <td style="padding:7px 0;text-align:right;color:#0f172a;font-weight:700;">${esc(input.title)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#64748b;font-weight:500;">Dates / Schedule</td>
              <td style="padding:7px 0;text-align:right;color:#0f172a;font-weight:600;">${esc(input.when)}</td>
            </tr>
            ${
              input.guests
                ? `<tr>
                    <td style="padding:7px 0;color:#64748b;font-weight:500;">Travelers</td>
                    <td style="padding:7px 0;text-align:right;color:#0f172a;font-weight:600;">${esc(input.guests)}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding:7px 0;color:#64748b;font-weight:500;">Reservation Status</td>
              <td style="padding:7px 0;text-align:right;color:#15803d;font-weight:700;">Confirmed &amp; Guaranteed</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 0 4px;color:#0f172a;font-weight:700;font-size:15px;">Grand Total (INR)</td>
              <td style="padding:14px 0 4px;text-align:right;color:#ea110d;font-size:18px;font-weight:800;">${formatInr(input.totalInr)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size:13px;color:#475569;margin:0 0 16px;">Your verified check-in voucher is now ready. You can view, print, or download your official reservation voucher and GST tax invoice anytime from your account.</p>

        <!-- CTA Buttons -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 26px;">
          <tr>
            <td style="padding-right:12px;">
              <a href="${esc(env.APP_URL)}/profile?tab=bookings" target="_blank" style="background-color:#ea110d;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;letter-spacing:0.2px;box-shadow:0 4px 12px rgba(234,17,13,0.22);text-align:center;">
                View Booking Voucher &rarr;
              </a>
            </td>
            <td>
              <a href="${esc(env.APP_URL)}/invoice/${encodeURIComponent(input.reference)}" target="_blank" style="background-color:#f8fafc;color:#0f172a;font-size:13px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:10px;border:1px solid #cbd5e1;display:inline-block;text-align:center;">
                GST Tax Invoice (PDF)
              </a>
            </td>
          </tr>
        </table>

        <!-- Check-in Guidance Box -->
        <div style="background-color:#f1f5f9;border-radius:10px;padding:14px 18px;margin:22px 0;font-size:12px;color:#475569;line-height:1.6;">
          <strong style="color:#0f172a;">Important Check-in Information:</strong><br>
          Please carry a valid government-issued photo ID (Aadhaar, Passport, or Driving License) for all adult guests at the time of arrival.
        </div>

        <div style="border-top:1px solid #f1f5f9;padding-top:16px;margin-top:20px;font-size:12px;color:#64748b;">
          Need assistance or custom arrangements? Reach our 24x7 Mahabaleshwar Concierge at <strong>+91 7741002157</strong> (WhatsApp: <strong>+91 94054 19021</strong>) or email <a href="mailto:${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}" style="color:#ea110d;text-decoration:none;font-weight:600;">${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}</a>.
        </div>`,
        {
          badge: 'Confirmed &amp; Guaranteed',
          badgeType: 'success',
          preheader: `Your booking for ${input.title} (${input.reference}) is officially confirmed.`,
        }
      ),
    };
  },

  bookingCancelled(input: {
    name: string;
    reference: string;
    title: string;
    refundInr: number;
    penaltyInr: number;
  }) {
    return {
      subject: `Booking Cancelled &mdash; ${input.reference}`,
      ...layout(
        'Booking Cancellation Notice',
        `<p style="margin:0 0 12px;">Dear <strong>${esc(input.name)}</strong>,</p>
        <p style="margin:0 0 16px;color:#475569;">Your reservation <strong>${esc(input.reference)}</strong> for <strong>${esc(input.title)}</strong> has been cancelled in accordance with our transparent cancellation policy.</p>

        <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:20px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;line-height:1.6;">
            <tr>
              <td style="padding:6px 0;color:#64748b;">Booking Reference</td>
              <td style="padding:6px 0;text-align:right;color:#0f172a;font-weight:700;">${esc(input.reference)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;">Refund Amount (INR)</td>
              <td style="padding:6px 0;text-align:right;color:#15803d;font-weight:700;font-size:15px;">${formatInr(input.refundInr)}</td>
            </tr>
            ${
              input.penaltyInr > 0
                ? `<tr>
                    <td style="padding:6px 0;color:#64748b;">Cancellation Fee</td>
                    <td style="padding:6px 0;text-align:right;color:#b91c1c;font-weight:600;">${formatInr(input.penaltyInr)}</td>
                  </tr>`
                : ''
            }
          </table>
        </div>

        <p style="font-size:13px;color:#475569;line-height:1.6;">Refunds are processed automatically to your original payment method. Depending on your bank or card issuer, funds typically reflect in your account within 5 to 7 business days.</p>
        
        <div style="border-top:1px solid #f1f5f9;padding-top:16px;margin-top:24px;font-size:12px;color:#64748b;">
          If you have questions regarding this cancellation or need refund assistance, please contact us at <a href="mailto:${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}" style="color:#ea110d;text-decoration:none;font-weight:600;">${esc(env.MAIL_FROM_EMAIL || 'support@mahastays.com')}</a>.
        </div>`,
        { badge: 'Cancellation Notice', badgeType: 'danger', preheader: `Your reservation ${input.reference} has been cancelled.` }
      ),
    };
  },

  vendorDecision(input: { name: string; approved: boolean; reason?: string | null }) {
    return {
      subject: input.approved
        ? 'Your Mahastays Partner Application is Approved'
        : 'Update regarding your Mahastays Partner Application',
      ...layout(
        input.approved ? 'Partner Application Approved' : 'Partner Application Update',
        input.approved
          ? `<p style="margin:0 0 12px;">Dear <strong>${esc(input.name)}</strong>,</p>
            <p style="margin:0 0 16px;color:#475569;">Congratulations! Your KYC credentials and business documentation have been verified by the Mahastays quality &amp; compliance desk. Your vendor partner account is now active.</p>
            <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;font-size:13px;color:#166534;">
              <strong>&#10003; Verification Completed:</strong> You can now list properties, villas, tour packages, or adventure experiences and start receiving bookings.
            </div>
            ${button(`${env.APP_URL}/vendor`, 'Access Vendor Dashboard')}`
          : `<p style="margin:0 0 12px;">Dear <strong>${esc(input.name)}</strong>,</p>
            <p style="margin:0 0 16px;color:#475569;">Thank you for submitting your partner application to Mahastays. After reviewing your submitted documents, our compliance desk requires additional details before we can activate your account.</p>
            ${
              input.reason
                ? `<div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin:18px 0;font-size:13px;color:#991b1b;">
                    <strong>Reason:</strong> ${esc(input.reason)}
                  </div>`
                : ''
            }
            <p style="font-size:13px;color:#475569;">Please update your business documentation through your vendor portal for expedited re-verification.</p>
            ${button(`${env.APP_URL}/vendor`, 'Update Verification Documents')}`,
        {
          badge: input.approved ? 'Partner Approved' : 'Verification Update',
          badgeType: input.approved ? 'success' : 'neutral',
          preheader: input.approved ? 'Your partner account has been approved.' : 'Update on your partner application.',
        }
      ),
    };
  },

  listingDecision(input: { name: string; listing: string; approved: boolean; reason?: string | null }) {
    return {
      subject: input.approved
        ? `Listing Approved: ${input.listing}`
        : `Listing Update Required: ${input.listing}`,
      ...layout(
        input.approved ? 'Listing is Now Live' : 'Listing Needs Revision',
        `<p style="margin:0 0 12px;">Dear <strong>${esc(input.name)}</strong>,</p>
        <p style="margin:0 0 16px;color:#475569;">
          ${
            input.approved
              ? `Your listing <strong>${esc(input.listing)}</strong> has successfully passed our inspection standards and is now published live on the Mahastays customer marketplace.`
              : `Your listing <strong>${esc(input.listing)}</strong> could not be approved in its current state.`
          }
        </p>
        ${
          !input.approved && input.reason
            ? `<div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin:18px 0;font-size:13px;color:#991b1b;">
                <strong>Quality Feedback:</strong> ${esc(input.reason)}
              </div>`
            : ''
        }
        ${button(`${env.APP_URL}/vendor`, 'Manage Listings')}`,
        {
          badge: input.approved ? 'Published Live' : 'Action Required',
          badgeType: input.approved ? 'success' : 'neutral',
          preheader: input.approved ? `Listing ${input.listing} is now live.` : `Listing ${input.listing} requires updates.`,
        }
      ),
    };
  },
};
