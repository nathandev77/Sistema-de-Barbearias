import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import { sanitizeMiddleware } from './middlewares/sanitize';
import authRoutes from './routes/authRoutes';
import portalRoutes from './routes/portalRoutes';
import clientRoutes from './routes/clientRoutes';
import barberRoutes from './routes/barberRoutes';
import serviceRoutes from './routes/serviceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import productRoutes from './routes/productRoutes';
import saleRoutes from './routes/saleRoutes';
import expenseRoutes from './routes/expenseRoutes';
import planRoutes from './routes/planRoutes';
import saasRoutes from './routes/saasRoutes';
import productReservationRoutes from './routes/productReservationRoutes';
import botRoutes from './routes/botRoutes';
import tenantRoutes from './routes/tenantRoutes';
import otpRoutes from './routes/otpRoutes';
import subscriptionCheckoutRoutes from './routes/subscriptionCheckoutRoutes';

const app = express();
app.set('trust proxy', 1);

// ── Segurança ──────────────────────────────────────────────
app.use(helmet());
app.use(sanitizeMiddleware); // Global input sanitization — Zero Trust

// CORS: Em produção, define FRONTEND_URL no .env para restringir a origem
const allowedOrigin = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));

// Rate limiting: apenas em rotas de auth para evitar brute-force.
// Rotas do bot (/api/bot/*) são isentas — N8N faz múltiplas chamadas legítimas.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,                   // 50 tentativas por IP a cada 15 min
  message: { error: 'Muitas tentativas. Por favor, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// ── Middlewares básicos ────────────────────────────────────
app.use(express.json());
app.use(morgan('dev'));

// ── Health check & Root ─────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Backend SaaS Barber API ativa',
    frontend: 'http://localhost:5173',
    health: '/health'
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'API SaaS Barber operante e segura.' });
});

// ── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/subscription', subscriptionCheckoutRoutes);
app.use('/api/product-reservations', productReservationRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/otp', otpRoutes);

// ── Tratamento global de erros (deve ser o último middleware) ──
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[🚀] Backend rodando na porta ${PORT}`);
  console.log(`[🔒] Security: Helmet, CORS (${allowedOrigin}), Rate-Limit ENABLED.`);
});// 1
