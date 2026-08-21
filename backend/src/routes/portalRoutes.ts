import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { passwordValidator } from '../utils/validators';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: passwordValidator, // Política centralizada: 8+ chars, maiúsc, minúsc, número, especial
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

// POST /api/portal/:slug/register — Registro de cliente no portal
router.post('/:slug/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const data = registerSchema.parse(req.body);

    // Busca o tenant pelo slug
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    if (!tenant.isActive) return res.status(403).json({ error: 'Barbearia inativa.' });

    // Verifica se email já está cadastrado nesta barbearia
    const existing = await prisma.client.findFirst({
      where: { tenantId: tenant.id, email: data.email }
    });
    if (existing) return res.status(409).json({ error: 'Este email já está cadastrado.' });

    // Fator 12, consistente com o hash do admin (authController)
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

    // Gera token JWT — 24h (reduzido de 7d por segurança)
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

// POST /api/portal/:slug/login — Login de cliente no portal
router.post('/:slug/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const data = loginSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return res.status(404).json({ error: 'Barbearia não encontrada.' });

    const client = await prisma.client.findFirst({
      where: { tenantId: tenant.id, email: data.email }
    });

    // Anti-enumeração: mesma mensagem para email inválido ou senha errada
    if (!client || !client.password) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isValid = await bcrypt.compare(data.password, client.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 24h de expiração para sessão do portal do cliente
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
