import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Module routers
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import panditRoutes from './modules/pandits/pandits.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import kitRoutes from './modules/kits/kits.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/orders/orders.routes';
import paymentRoutes from './modules/payments/payments.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';
import videoRoutes from './modules/video/video.routes';
import astroRoutes from './modules/astro/astro.routes';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes';
import referralRoutes from './modules/referrals/referrals.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import festivalRoutes from './modules/festivals/festivals.routes';
import payoutRoutes from './modules/payouts/payouts.routes';
import searchRoutes from './modules/search/search.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import recommendationRoutes from './modules/recommendations/recommendations.routes';
import reportRoutes from './modules/reports/reports.routes';
import supportRoutes from './modules/support/support.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'pranam-backend' }));

  // Phase 1
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/poojas', catalogRoutes);
  app.use('/pandits', panditRoutes);
  app.use('/bookings', bookingRoutes);
  app.use('/kits', kitRoutes);
  app.use('/cart', cartRoutes);
  app.use('/orders', orderRoutes);
  app.use('/payments', paymentRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/admin', adminRoutes);
  // Phase 2
  app.use('/video', videoRoutes);
  app.use('/astro', astroRoutes);
  app.use('/subscriptions', subscriptionRoutes);
  app.use('/referrals', referralRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/festivals', festivalRoutes);
  app.use('/payouts', payoutRoutes);
  // Phase 3
  app.use('/search', searchRoutes);
  app.use('/analytics', analyticsRoutes);
  app.use('/recommendations', recommendationRoutes);
  app.use('/reports', reportRoutes);
  app.use('/support', supportRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Pranam backend listening on :${env.port} (${env.nodeEnv})`);
  });
}
