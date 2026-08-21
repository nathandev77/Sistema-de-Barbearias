import { Router } from 'express';
import { registerTenant, registerTrial, login, firstAccessChangePassword } from '../controllers/authController';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit específico para registro (anti-spam de criação de tenants)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 15,
  message: 'Muitos cadastros deste IP. Aguarde alguns instantes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rota de Início Rápido de Teste Grátis (Nome da Barbearia + Email)
router.post('/register-trial', registerLimiter, registerTrial);
router.post('/trial-register', registerLimiter, registerTrial);

// Rota para troca de senha obrigatória no primeiro acesso
router.post('/first-access-password', firstAccessChangePassword);

// Rota para uma nova Barbearia se cadastrar no SaaS (completo)
router.post('/register', registerLimiter, registerTenant);

// Rota pública para buscar dados de uma barbearia pelo slug (usada pelo portal do cliente)
router.get('/tenant/:slug', async (req, res, next) => {
  try {
    const { prisma } = await import('../prisma');
    const tenant = await prisma.tenant.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, name: true, slug: true, isActive: true }
    });
    if (!tenant) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    if (!tenant.isActive) return res.status(403).json({ error: 'Barbearia inativa.' });
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Rota de Login para os usuários acessarem o sistema
router.post('/login', login);

export default router;
