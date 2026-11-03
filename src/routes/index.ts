import { Router } from 'express';
import { adminRouter } from '../modules/admin/admin.routes';
import { superAdminRouter } from '../modules/admin/superadmin.routes';
import { publicAdRouter } from '../modules/ads/ad.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { bookingRouter } from '../modules/bookings/booking.routes';
import { publicConfigRouter } from '../modules/config/config.routes';
import { couponRouter } from '../modules/coupons/coupon.routes';
import { publicExperienceRouter } from '../modules/experiences/experience.routes';
import { publicHeroSlideRouter } from '../modules/hero-slides/hero-slide.routes';
import { healthRouter } from '../modules/health/health.routes';
import { publicLocationsRouter } from '../modules/locations/locations.routes';
import { notificationRouter } from '../modules/notifications/notification.routes';
import { publicPackageRouter } from '../modules/packages/package.routes';
import { paymentRouter } from '../modules/payments/payment.routes';
import { publicPropertyRouter } from '../modules/properties/property.routes';
import { reviewRouter } from '../modules/reviews/review.routes';
import { supportRouter } from '../modules/support/support.routes';
import { uploadRouter } from '../modules/uploads/upload.routes';
import { userRouter } from '../modules/users/user.routes';
import { vendorRouter } from '../modules/vendors/vendor.routes';
import { wishlistRouter } from '../modules/wishlist/wishlist.routes';

/** Mounted at /api/v1 */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/config', publicConfigRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/vendor', vendorRouter);

apiRouter.use('/locations', publicLocationsRouter);
apiRouter.use('/coupons', couponRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/notifications', notificationRouter);

apiRouter.use('/properties', publicPropertyRouter);
apiRouter.use('/packages', publicPackageRouter);
apiRouter.use('/experiences', publicExperienceRouter);

apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/wishlist', wishlistRouter);
apiRouter.use('/ads', publicAdRouter);
apiRouter.use('/hero-slides', publicHeroSlideRouter);
apiRouter.use('/uploads', uploadRouter);

apiRouter.use('/admin', adminRouter);
apiRouter.use('/superadmin', superAdminRouter);

