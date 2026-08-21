import 'dotenv/config';
import { prisma } from '../src/prisma';

async function wipeData() {
  console.log('Iniciando limpeza de dados de teste...');
  try {
    // Apaga tabelas transacionais e operacionais
    // Por conta do onDelete: Cascade configurado no schema, se a gente quisesse apagar tenants apagaria tudo,
    // mas queremos manter os Tenants e Users.
    
    await prisma.appointment.deleteMany();
    console.log('- Appointments apagados');
    
    await prisma.sale.deleteMany();
    console.log('- Sales apagados');
    
    await prisma.expense.deleteMany();
    console.log('- Expenses apagados');
    
    await prisma.product.deleteMany();
    console.log('- Products apagados');
    
    await prisma.client.deleteMany();
    console.log('- Clients apagados');
    
    await prisma.service.deleteMany();
    console.log('- Services apagados');
    
    await prisma.barber.deleteMany();
    console.log('- Barbers apagados');

    console.log('✅ Banco de dados limpo com sucesso! (Tenants e Users preservados)');
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeData();
