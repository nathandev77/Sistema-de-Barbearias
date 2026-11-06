import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { passwordValidator } from '../utils/validators';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: passwordValidator, // Centralized policy: 8+ chars, uppercase, lowercase, number, special
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/portal/:slug/register — Client registration on the portal
router.post('/:slug/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const data = registerSchema.parse(req.body);

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return res.status(404).json({ error: 'Barbershop not found.' });
    if (!tenant.isActive) return res.status(403).json({ error: 'Barbershop inactive.' });

    // Check whether the email is already registered at this barbershop
    const existing = await prisma.client.findFirst({
      where: { tenantId: tenant.id, email: data.email }
    });
    if (existing) return res.status(409).json({ error: 'This email is already registered.' });

    // Cost factor 12, consistent with the admin hash (authController)
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
      }
    });

    // Generate JWT token — 24h (reduced from 7d for security)
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { clientId: client.id, tenantId: tenant.id, slug: tenant.slug },
      secret,
      { expiresIn: '24h' }
    );

    const { password: _, ...clientWithoutPassword } = client;

    res.status(201).json({
      token,
      client: clientWithoutPassword,
      barbershop: { id: tenant.id, name: tenant.name, slug: tenant.slug }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/portal/:slug/login — Client login on the portal
router.post('/:slug/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const data = loginSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return res.status(404).json({ error: 'Barbershop not found.' });

    const client = await prisma.client.findFirst({
      where: { tenantId: tenant.id, email: data.email }
    });

    // Anti-enumeration: same message for invalid email or wrong password
    if (!client || !client.password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(data.password, client.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 24h expiration for the client portal session
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { clientId: client.id, tenantId: tenant.id, slug: tenant.slug },
      secret,
      { expiresIn: '24h' }
    );

    const { password: _, ...clientWithoutPassword } = client;

    res.json({
      token,
      client: clientWithoutPassword,
      barbershop: { id: tenant.id, name: tenant.name, slug: tenant.slug }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
