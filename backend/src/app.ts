import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import { sanitizeMiddleware } from './middlewares/sanitize';
import authRouter from './routes/authRoutes';
import barberRouter from './routes/barberRoutes';
import clientRouter from './routes/clientRoutes';
import serviceRouter from './routes/serviceRoutes';
import appointmentRouter from './routes/appointmentRoutes';
import productRouter from './routes/productRoutes';
import saleRouter from './routes/saleRoutes';
import expenseRouter from './routes/expenseRoutes';
import saasRouter from './routes/saasRoutes';
import portalRouter from './routes/portalRoutes';
import botRouter from './routes/botRoutes';
import planRouter from './routes/planRoutes';
import tenantRouter from './routes/tenantRoutes';
import otpRouter from './routes/otpRoutes';

const app = express();
app.set('trust proxy', 1);

// ── Security Middlewares ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' })); // Adjust to the frontend domain in production
app.use(sanitizeMiddleware); // Global input sanitization — Zero Trust

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit of 100 requests per IP
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.originalUrl.startsWith('/api/bot/'),
});
app.use('/api/', limiter);

// ── Basic Middlewares ───────────────────────────────────────────────────────
app.use(express.json());
app.use(morgan('dev'));

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'SaaS Barber API operational and secure.' });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/barbers', barberRouter);
app.use('/api/clients', clientRouter);
app.use('/api/services', serviceRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/products', productRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/sales', saleRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/saas', saasRouter);
app.use('/api/portal', portalRouter);
app.use('/api/bot', botRouter);
app.use('/api/plans', planRouter);
app.use('/api/otp', otpRouter);

// ── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
