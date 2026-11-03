import { env } from '../config/env';
import { formatInr } from '../utils/money';

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export const MAHASTAYS_CLOUDINARY_LOGO =
  'https://res.cloudinary.com/vxtop5jd/image/upload/v1793725764/mahastays/brand/mahastays-logo.png';

interface LayoutOptions {
  badge?: string;
  badgeType?: 'success' | 'danger' | 'neutral' | 'brand';
  preheader?: string;
}

function layout(title: string, inner: string, options: LayoutOptions = {}): { html: string } {
  const badgeHtml = options.badge
    ? `<span style="display:inline-block;padding:4px 10px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;border-radius:20px;${
        options.badgeType === 'danger'
          ? 'background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;'
          : options.badgeType === 'success'
          ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
          : options.badgeType === 'brand'
          ? 'background:#fff1f1;color:#ea110d;border:1px solid #ffcdd2;'
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
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
  ${options.preheader ? `<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${esc(options.preheader)}</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Max 600px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 10px 25px rgba(0,0,0,0.04);overflow:hidden;">
          
          <!-- Red Brand Accent Bar -->
          <tr>
            <td style="height:4px;background-color:#ea110d;line-height:4px;font-size:4px;">&nbsp;</td>
          </tr>

          <!-- Header with Cloudinary Brand Logo -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${esc(env.APP_URL)}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${MAHASTAYS_CLOUDINARY_LOGO}" alt="Mahastays" width="155" height="38" style="display:block;width:155px;height:auto;max-height:40px;border:0;outline:none;" />
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
            <td style="padding:28px 32px 32px;">
              <h1 style="color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;letter-spacing:-0.3px;margin:0 0 16px;">
                ${esc(title)}
              </h1>
              <div style="font-size:14px;line-height:1.65;color:#334155;">
                ${inner}
              </div>
            </td>
          </tr>

          <!-- Trust & Safe Guarantee Strip -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;color:#475569;line-height:1.5;">
                    <span style="display:inline-block;margin-right:16px;">
                      <strong style="color:#0f172a;">&#10003; 100% Verified Quality</strong>
                    </span>
                    <span style="display:inline-block;margin-right:16px;">
                      <strong style="color:#0f172a;">&#10003; Safe Stay Guarantee</strong>
                    </span>
                    <span style="display:inline-block;">
                      <strong style="color:#0f172a;">&#10003; 24x7 Local Concierge</strong>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px;text-align:center;">
              <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0 0 8px;">
                <strong>Mahastays Hospitality Platform</strong><br>
                Venna Lake Road, Mahabaleshwar &amp; Panchgani, Maharashtra 412806, India
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                &copy; ${new Date().getFullYear()} Mahastays. All rights reserved. Direct transparent rates with zero hidden markups.
              </p>
            </td>
          </tr>

        </table>

        <!-- Small unsubscribe/help text below card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin-top:16px;">
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
  `<div style="margin:26px 0;">
    <a href="${esc(href)}" target="_blank" style="background-color:#ea110d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:10px;display:inline-block;letter-spacing:0.2px;box-shadow:0 4px 12px rgba(234,17,13,0.22);text-align:center;">
      ${esc(label)} &rarr;
    </a>
  </div>`;

export const templates = {
  adminLoginOtp(name: string, otp: string) {
    return {
      subject: `Your Mahastays Admin Verification Code: ${otp}`,
      ...layout(
        'Admin Portal Verification',
        `<p style="margin:0 0 12px;">Dear <strong>${esc(name)}</strong>,</p>
        <p style="margin:0 0 16px;">A sign-in attempt was initiated for your Mahastays Admin Operations account. Use the one-time verification code below to complete your authentication:</p>
        
        <div style="background:#f8fafc;border:2px dashed #ea110d;border-radius:14px;padding:24px;margin:22px 0;text-align:center;">
          <div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your 6-Digit One-Time Code</div>
          <div style="font-size:38px;font-weight:900;letter-spacing:8px;color:#ea110d;font-family:monospace;padding:6px 0;">${otp}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Valid for 10 minutes &bull; Do not share this code with anyone</div>
        </div>

        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin:20px 0;font-size:12px;color:#991b1b;">
          <strong>Security Warning:</strong> If you did not initiate this login request, your account password may be compromised. Please change your password immediately or contact technical operations.
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
