import { Router } from 'express';
import { registerTenant, registerTrial, login, firstAccessChangePassword } from '../controllers/authController';
import rateLimit from 'express-rate-limit';

const router = Router();

// Specific rate limit for registration (anti-spam for tenant creation)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: 'Too many sign-ups from this IP. Please wait a moment.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Free Trial Quick Start route (Barbershop Name + Email)
router.post('/register-trial', registerLimiter, registerTrial);
router.post('/trial-register', registerLimiter, registerTrial);

// Route for the mandatory password change on first access
router.post('/first-access-password', firstAccessChangePassword);

// Route for a new Barbershop to sign up for the SaaS (full)
router.post('/register', registerLimiter, registerTenant);

// Public route to fetch a barbershop's data by slug (used by the client portal)
router.get('/tenant/:slug', async (req, res, next) => {
  try {
    const { prisma } = await import('../prisma');
    const tenant = await prisma.tenant.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, name: true, slug: true, isActive: true }
    });
    if (!tenant) return res.status(404).json({ error: 'Barbershop not found.' });
    if (!tenant.isActive) return res.status(403).json({ error: 'Barbershop inactive.' });
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Login route for users to access the system
router.post('/login', login);

export default router;
