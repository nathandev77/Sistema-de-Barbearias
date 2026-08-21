import { prisma } from '../prisma';

async function main() {
  try {
    console.log('Querying database...');
    const count = await prisma.user.count();
    console.log('✅ DB SUCCESS! Total users:', count);
  } catch (err: any) {
    console.error('❌ DB ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
