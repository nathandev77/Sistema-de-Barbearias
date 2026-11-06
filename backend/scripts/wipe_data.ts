import 'dotenv/config';
import { prisma } from '../src/prisma';

async function wipeData() {
  console.log('Starting test data cleanup...');
  try {
    // Delete transactional and operational tables
    // Because of the onDelete: Cascade configured in the schema, deleting tenants would delete everything,
    // but we want to keep the Tenants and Users.
    
    await prisma.appointment.deleteMany();
    console.log('- Appointments deleted');
    
    await prisma.sale.deleteMany();
    console.log('- Sales deleted');
    
    await prisma.expense.deleteMany();
    console.log('- Expenses deleted');
    
    await prisma.product.deleteMany();
    console.log('- Products deleted');
    
    await prisma.client.deleteMany();
    console.log('- Clients deleted');
    
    await prisma.service.deleteMany();
    console.log('- Services deleted');
    
    await prisma.barber.deleteMany();
    console.log('- Barbers deleted');

    console.log('✅ Database cleaned successfully! (Tenants and Users preserved)');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeData();
