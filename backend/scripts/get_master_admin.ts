import 'dotenv/config';
import { prisma } from '../src/prisma';

async function getMasterAdmin() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'admin' },
      include: { tenant: true }
    });

    console.log('=== MASTER ADMIN CREDENTIALS ===');
    if (users.length === 0) {
      console.log('Nenhum usuário administrador encontrado.');
    } else {
      users.forEach(u => {
        console.log(`- Email: ${u.email}`);
        console.log(`- Nome: ${u.name}`);
        console.log(`- Role: ${u.role}`);
        console.log(`- Tenant (Barbearia Atrelada): ${u.tenant.name} (Slug: ${u.tenant.slug})`);
      });
      console.log('NOTA: A senha do administrador é a que você definiu no cadastro (geralmente salva no seu gerenciador de senhas).');
      console.log(`Você também tem uma Super Admin Key: ${process.env.SUPER_ADMIN_KEY}`);
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getMasterAdmin();
