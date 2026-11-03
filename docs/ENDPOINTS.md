# Mahastays API — endpoint reference

> **Generated from the source code** by `npm run docs:generate` — do not edit by hand.
> 184 endpoints · base URL `/api/v1` · every response is `{ "success": true, "data": ..., "meta"?: ... }` or `{ "success": false, "error": { code, message, details?, requestId } }`.

**Access column** — who may call the endpoint:
- `public` — no token. `public (personalised when signed in)` — optional `Authorization: Bearer <token>`.
- `user`, `vendor`, `vendor (KYC-approved)` — role guards.
- `super_admin | admin[flag] | sub_admin[flag]` — staff routes: the super-admin always passes; admins / sub-admins need that **permission flag** to be true on their record (`admin` / `sub_admin` without brackets = any active member).
- `+ master PIN (x-master-pin)` — additionally requires the super-admin's secondary PIN.

## Health

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/health` | public — liveness probe |
| `GET` | `/api/v1/health/ready` | public — readiness probe (checks MongoDB / Redis) |

## Public pricing config

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/config/public` | public |

## Authentication

| Method | Path | Access |
| :-- | :-- | :-- |
| `POST` | `/api/v1/auth/user/signup` | public |
| `POST` | `/api/v1/auth/user/login` | public |
| `POST` | `/api/v1/auth/user/otp/request` | public |
| `POST` | `/api/v1/auth/user/otp/verify` | public |
| `POST` | `/api/v1/auth/user/google` | public |
| `POST` | `/api/v1/auth/vendor/register` | public |
| `POST` | `/api/v1/auth/vendor/login` | public |
| `POST` | `/api/v1/auth/admin/login` | public |
| `POST` | `/api/v1/auth/admin/login/2fa` | public |
| `POST` | `/api/v1/auth/admin/2fa/setup` | super_admin \| admin |
| `POST` | `/api/v1/auth/admin/2fa/enable` | super_admin \| admin |
| `POST` | `/api/v1/auth/admin/2fa/disable` | super_admin \| admin |
| `POST` | `/api/v1/auth/refresh` | public |
| `POST` | `/api/v1/auth/logout` | public |
| `POST` | `/api/v1/auth/logout-all` | any signed-in user |
| `GET` | `/api/v1/auth/me` | any signed-in user |
| `POST` | `/api/v1/auth/change-password` | any signed-in user |
| `POST` | `/api/v1/auth/password/forgot` | public |
| `POST` | `/api/v1/auth/password/reset` | public |
| `POST` | `/api/v1/auth/email/verify/request` | any signed-in user |
| `POST` | `/api/v1/auth/email/verify/confirm` | public |

## Customer profile

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/users/me` | user |
| `PUT` | `/api/v1/users/me` | user |
| `DELETE` | `/api/v1/users/me` | user |

## Vendor portal

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/vendor/me` | vendor |
| `PUT` | `/api/v1/vendor/me` | vendor |
| `PUT` | `/api/v1/vendor/me/kyc` | vendor |
| `PUT` | `/api/v1/vendor/me/banking` | vendor |
| `GET` | `/api/v1/vendor/dashboard` | vendor |
| `GET` | `/api/v1/vendor/wallet` | vendor |
| `GET` | `/api/v1/vendor/payouts` | vendor |
| `POST` | `/api/v1/vendor/payouts/request` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/payouts/:id` | vendor |
| `GET` | `/api/v1/vendor/reviews` | vendor |
| `POST` | `/api/v1/vendor/reviews/:id/reply` | vendor |
| `POST` | `/api/v1/vendor/vouchers/redeem` | vendor |
| `GET` | `/api/v1/vendor/properties` | vendor |
| `POST` | `/api/v1/vendor/properties` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/properties/:id` | vendor |
| `PUT` | `/api/v1/vendor/properties/:id` | vendor (KYC-approved) |
| `PATCH` | `/api/v1/vendor/properties/:id/status` | vendor (KYC-approved) |
| `DELETE` | `/api/v1/vendor/properties/:id` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/properties/:id/calendar` | vendor |
| `GET` | `/api/v1/vendor/properties/:id/blocks` | vendor |
| `POST` | `/api/v1/vendor/properties/:id/blocks` | vendor (KYC-approved) |
| `DELETE` | `/api/v1/vendor/properties/:id/blocks/:blockId` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/packages` | vendor |
| `POST` | `/api/v1/vendor/packages` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/packages/:id` | vendor |
| `PUT` | `/api/v1/vendor/packages/:id` | vendor (KYC-approved) |
| `PATCH` | `/api/v1/vendor/packages/:id/status` | vendor (KYC-approved) |
| `DELETE` | `/api/v1/vendor/packages/:id` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/experiences` | vendor |
| `POST` | `/api/v1/vendor/experiences` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/experiences/:id` | vendor |
| `PUT` | `/api/v1/vendor/experiences/:id/slots` | vendor (KYC-approved) |
| `PUT` | `/api/v1/vendor/experiences/:id` | vendor (KYC-approved) |
| `PATCH` | `/api/v1/vendor/experiences/:id/status` | vendor (KYC-approved) |
| `DELETE` | `/api/v1/vendor/experiences/:id` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/experiences/:id/blocks` | vendor |
| `POST` | `/api/v1/vendor/experiences/:id/blocks` | vendor (KYC-approved) |
| `DELETE` | `/api/v1/vendor/experiences/:id/blocks/:blockId` | vendor (KYC-approved) |
| `GET` | `/api/v1/vendor/bookings` | vendor |
| `GET` | `/api/v1/vendor/bookings/:type/:id` | vendor |
| `PATCH` | `/api/v1/vendor/bookings/stays/:id/status` | vendor |
| `PATCH` | `/api/v1/vendor/bookings/packages/:id/status` | vendor |
| `PATCH` | `/api/v1/vendor/bookings/experiences/:id/status` | vendor |
| `POST` | `/api/v1/vendor/bookings/:type/:id/cancel` | vendor |
| `GET` | `/api/v1/vendor/ads` | vendor |
| `POST` | `/api/v1/vendor/ads` | vendor (KYC-approved) |
| `PUT` | `/api/v1/vendor/ads/:id` | vendor (KYC-approved) |
| `PATCH` | `/api/v1/vendor/ads/:id/active` | vendor |
| `DELETE` | `/api/v1/vendor/ads/:id` | vendor |

## Stays (public)

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/properties` | public |
| `GET` | `/api/v1/properties/nearby` | public |
| `GET` | `/api/v1/properties/:idOrSlug` | public |

## Packages (public)

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/packages` | public |
| `GET` | `/api/v1/packages/:idOrSlug` | public |

## Experiences (public)

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/experiences` | public |
| `GET` | `/api/v1/experiences/nearby` | public |
| `GET` | `/api/v1/experiences/:idOrSlug` | public |
| `GET` | `/api/v1/experiences/:idOrSlug/slots` | public |

## Bookings & checkout

| Method | Path | Access |
| :-- | :-- | :-- |
| `POST` | `/api/v1/bookings/stays/quote` | public (personalised when signed in) |
| `POST` | `/api/v1/bookings/packages/quote` | public (personalised when signed in) |
| `POST` | `/api/v1/bookings/experiences/quote` | public (personalised when signed in) |
| `POST` | `/api/v1/bookings/stays/reserve` | user |
| `POST` | `/api/v1/bookings/packages/reserve` | user |
| `POST` | `/api/v1/bookings/experiences/reserve` | user |
| `GET` | `/api/v1/bookings/user/history` | user |
| `GET` | `/api/v1/bookings/lookup/:reference` | user |
| `GET` | `/api/v1/bookings/:type/:id` | user |
| `GET` | `/api/v1/bookings/:type/:id/cancellation-preview` | user |
| `POST` | `/api/v1/bookings/:type/:id/cancel` | user |

## Payments & invoices

| Method | Path | Access |
| :-- | :-- | :-- |
| `POST` | `/api/v1/payments/verify` | user |
| `POST` | `/api/v1/payments/verify-webhook` | public — authenticated by the gateway's HMAC signature (raw body) |
| `POST` | `/api/v1/payments/mock/capture` | user — DEV ONLY (PAYMENT_GATEWAY=mock, disabled in production) |
| `GET` | `/api/v1/payments/my` | user |
| `GET` | `/api/v1/payments/:id` | any signed-in user |
| `GET` | `/api/v1/payments/:id/invoice` | any signed-in user |

## Reviews

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/reviews` | public (personalised when signed in) |
| `GET` | `/api/v1/reviews/mine` | user |
| `POST` | `/api/v1/reviews` | user |
| `POST` | `/api/v1/reviews/:id/helpful` | user |

## Wishlist

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/wishlist` | user |
| `POST` | `/api/v1/wishlist/toggle` | user |

## Ads (public serving + tracking)

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/ads/active` | public (personalised when signed in) |
| `POST` | `/api/v1/ads/track/impression` | public |
| `POST` | `/api/v1/ads/track/click` | public |
| `POST` | `/api/v1/ads/track/conversion` | user |

## Uploads

| Method | Path | Access |
| :-- | :-- | :-- |
| `POST` | `/api/v1/uploads/sign` | any signed-in user |

## Admin / Sub-admin operations

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/admin/dashboard` | super_admin \| admin \| sub_admin |
| `GET` | `/api/v1/admin/vendors` | super_admin \| admin \| sub_admin |
| `GET` | `/api/v1/admin/vendors/pending` | super_admin \| admin \| sub_admin |
| `GET` | `/api/v1/admin/vendors/:id` | super_admin \| admin \| sub_admin |
| `POST` | `/api/v1/admin/vendors/:id/verify` | super_admin \| admin[canApproveVendors] |
| `POST` | `/api/v1/admin/vendors/:id/bank/verify` | super_admin \| admin[canApproveVendors] |
| `PATCH` | `/api/v1/admin/vendors/:id/status` | super_admin \| admin[canBlockListings] |
| `GET` | `/api/v1/admin/users` | super_admin \| admin \| sub_admin[canViewBookings] |
| `GET` | `/api/v1/admin/users/:id` | super_admin \| admin \| sub_admin[canViewBookings] |
| `PATCH` | `/api/v1/admin/users/:id/status` | super_admin \| admin[canProcessOverridesAndDisputes] |
| `PATCH` | `/api/v1/admin/users/:id/membership` | super_admin \| admin[canProcessOverridesAndDisputes] |
| `POST` | `/api/v1/admin/users/:id/notify` | super_admin \| admin \| sub_admin[canTriggerCustomerNotifications] |
| `GET` | `/api/v1/admin/properties` | super_admin \| admin \| sub_admin |
| `GET` | `/api/v1/admin/properties/:id` | super_admin \| admin \| sub_admin |
| `PATCH` | `/api/v1/admin/properties/:id/status` | super_admin \| admin \| sub_admin[canFlagFraudulentListings] |
| `PATCH` | `/api/v1/admin/properties/:id/featured` | super_admin \| admin[canApproveProperties] |
| `PATCH` | `/api/v1/admin/properties/:id/content` | super_admin \| admin \| sub_admin[canEditListingDescriptions] |
| `GET` | `/api/v1/admin/packages` | super_admin \| admin \| sub_admin |
| `GET` | `/api/v1/admin/packages/:id` | super_admin \| admin \| sub_admin |
| `PATCH` | `/api/v1/admin/packages/:id/status` | super_admin \| admin \| sub_admin[canFlagFraudulentListings] |
| `PATCH` | `/api/v1/admin/packages/:id/featured` | super_admin \| admin[canApprovePackages] |
| `PATCH` | `/api/v1/admin/packages/:id/content` | super_admin \| admin \| sub_admin[canEditListingDescriptions] |
| `GET` | `/api/v1/admin/experiences` | super_admin \| admin \| sub_admin |
| `GET` | `/api/v1/admin/experiences/:id` | super_admin \| admin \| sub_admin |
| `PATCH` | `/api/v1/admin/experiences/:id/status` | super_admin \| admin \| sub_admin[canFlagFraudulentListings] |
| `PATCH` | `/api/v1/admin/experiences/:id/featured` | super_admin \| admin[canApproveExperiences] |
| `PATCH` | `/api/v1/admin/experiences/:id/content` | super_admin \| admin \| sub_admin[canEditListingDescriptions] |
| `GET` | `/api/v1/admin/bookings` | super_admin \| admin \| sub_admin[canViewBookings] |
| `GET` | `/api/v1/admin/bookings/:type/:id` | super_admin \| admin \| sub_admin[canViewBookings] |
| `GET` | `/api/v1/admin/bookings/:type/:id/cancellation-preview` | super_admin \| admin[canProcessOverridesAndDisputes] \| sub_admin[canInitiateCustomerRefunds] |
| `POST` | `/api/v1/admin/bookings/:type/:id/cancel` | super_admin \| admin[canProcessOverridesAndDisputes] \| sub_admin[canInitiateCustomerRefunds] |
| `GET` | `/api/v1/admin/reviews` | super_admin \| admin \| sub_admin[canApproveReviews] |
| `PATCH` | `/api/v1/admin/reviews/:id/moderate` | super_admin \| admin \| sub_admin[canApproveReviews] |
| `DELETE` | `/api/v1/admin/reviews/:id` | super_admin \| admin |
| `GET` | `/api/v1/admin/ads` | super_admin \| admin[canApproveAdCampaigns] |
| `POST` | `/api/v1/admin/ads` | super_admin \| admin[canApproveAdCampaigns] |
| `PUT` | `/api/v1/admin/ads/:id` | super_admin \| admin[canApproveAdCampaigns] |
| `PATCH` | `/api/v1/admin/ads/:id/approval` | super_admin \| admin[canApproveAdCampaigns] |
| `PATCH` | `/api/v1/admin/ads/:id/active` | super_admin \| admin[canApproveAdCampaigns] |
| `DELETE` | `/api/v1/admin/ads/:id` | super_admin \| admin[canApproveAdCampaigns] |
| `GET` | `/api/v1/admin/finance/settlements` | super_admin \| admin[canExportFinancialReports] |
| `GET` | `/api/v1/admin/finance/settlements/:id` | super_admin \| admin[canExportFinancialReports] |
| `POST` | `/api/v1/admin/finance/settlements/:id/audit` | super_admin \| admin[canExportFinancialReports] |
| `POST` | `/api/v1/admin/finance/settlements/:id/reject` | super_admin \| admin[canExportFinancialReports] |
| `GET` | `/api/v1/admin/subadmins` | super_admin \| admin[canManageSubAdmins] |
| `POST` | `/api/v1/admin/subadmins` | super_admin \| admin[canManageSubAdmins] |
| `GET` | `/api/v1/admin/subadmins/:id` | super_admin \| admin[canManageSubAdmins] |
| `PUT` | `/api/v1/admin/subadmins/:id` | super_admin \| admin[canManageSubAdmins] |
| `POST` | `/api/v1/admin/subadmins/:id/reset-password` | super_admin \| admin[canManageSubAdmins] |

## Super-admin

| Method | Path | Access |
| :-- | :-- | :-- |
| `GET` | `/api/v1/superadmin/dashboard` | super_admin |
| `GET` | `/api/v1/superadmin/config` | super_admin |
| `PUT` | `/api/v1/superadmin/config` | super_admin  ·  + master PIN (x-master-pin) |
| `PUT` | `/api/v1/superadmin/vendors/:id/commission` | super_admin  ·  + master PIN (x-master-pin) |
| `GET` | `/api/v1/superadmin/finance/payouts` | super_admin |
| `GET` | `/api/v1/superadmin/finance/payouts/:id` | super_admin |
| `POST` | `/api/v1/superadmin/finance/payouts/release` | super_admin  ·  + master PIN (x-master-pin) |
| `POST` | `/api/v1/superadmin/finance/payouts/:id/complete` | super_admin  ·  + master PIN (x-master-pin) |
| `POST` | `/api/v1/superadmin/finance/payouts/:id/fail` | super_admin  ·  + master PIN (x-master-pin) |
| `GET` | `/api/v1/superadmin/audit-logs` | super_admin |
| `POST` | `/api/v1/superadmin/master-pin/change` | super_admin |
| `GET` | `/api/v1/superadmin/subadmins` | super_admin |
| `POST` | `/api/v1/superadmin/subadmins` | super_admin |
| `GET` | `/api/v1/superadmin/subadmins/:id` | super_admin |
| `PUT` | `/api/v1/superadmin/subadmins/:id` | super_admin |
| `POST` | `/api/v1/superadmin/subadmins/:id/reset-password` | super_admin |
| `GET` | `/api/v1/superadmin/admins` | super_admin |
| `POST` | `/api/v1/superadmin/admins` | super_admin  ·  + master PIN (x-master-pin) |
| `GET` | `/api/v1/superadmin/admins/:id` | super_admin |
| `PUT` | `/api/v1/superadmin/admins/:id` | super_admin  ·  + master PIN (x-master-pin) |
| `POST` | `/api/v1/superadmin/admins/:id/reset-password` | super_admin  ·  + master PIN (x-master-pin) |
| `POST` | `/api/v1/superadmin/admins/:id/reset-2fa` | super_admin  ·  + master PIN (x-master-pin) |

