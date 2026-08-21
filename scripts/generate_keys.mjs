#!/usr/bin/env node
import crypto from 'crypto';

console.log('\n🔐 ========================================================');
console.log('       GERADOR DE CHAVES CRIPTOGRÁFICAS — SAAS BARBER      ');
console.log('========================================================\n');

function generateSecureKey(prefix = 'sk_master') {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

const ownerKey = generateSecureKey('sk_owner');
const adminKey1 = generateSecureKey('sk_admin');
const adminKey2 = generateSecureKey('sk_admin');
const jwtSecret = crypto.randomBytes(48).toString('hex');

console.log('📌 SUGESTÕES DE CHAVES SEGURAS PARA O .env DO BACKEND:\n');
console.log(`SUPER_ADMIN_KEYS="${ownerKey},${adminKey1}"`);
console.log(`JWT_SECRET="${jwtSecret}"\n`);

console.log('--------------------------------------------------------');
console.log('🔑 DETALHES DE ACESSO INDIVIDUAL:');
console.log(`• Chave do Dono (Você):  ${ownerKey}`);
console.log(`• Chave de Admin Aux:    ${adminKey1}`);
console.log(`• Chave Reserva:         ${adminKey2}`);
console.log('--------------------------------------------------------\n');
console.log('💡 Dica: Cole SUPER_ADMIN_KEYS no seu arquivo backend/.env');
console.log('Cada administrador pode usar sua respectiva chave para logar no /saas-admin.\n');
