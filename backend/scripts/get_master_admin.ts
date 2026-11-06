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
      console.log('No admin user found.');
    } else {
      users.forEach(u => {
        console.log(`- Email: ${u.email}`);
        console.log(`- Name: ${u.name}`);
        console.log(`- Role: ${u.role}`);
        console.log(`- Tenant (Linked Barbershop): ${u.tenant.name} (Slug: ${u.tenant.slug})`);
      });
      console.log('NOTE: The admin password is the one you set during sign-up (usually saved in your password manager).');
      console.log(`You also have a Super Admin Key: ${process.env.SUPER_ADMIN_KEY}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getMasterAdmin();
