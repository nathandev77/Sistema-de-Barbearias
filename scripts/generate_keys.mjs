#!/usr/bin/env node
import crypto from 'crypto';

console.log('\n🔐 ========================================================');
console.log('       CRYPTOGRAPHIC KEY GENERATOR — SAAS BARBER           ');
console.log('========================================================\n');

function generateSecureKey(prefix = 'sk_master') {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

const ownerKey = generateSecureKey('sk_owner');
const adminKey1 = generateSecureKey('sk_admin');
const adminKey2 = generateSecureKey('sk_admin');
const jwtSecret = crypto.randomBytes(48).toString('hex');

console.log('📌 SUGGESTED SECURE KEYS FOR THE BACKEND .env:\n');
console.log(`SUPER_ADMIN_KEYS="${ownerKey},${adminKey1}"`);
console.log(`JWT_SECRET="${jwtSecret}"\n`);

console.log('--------------------------------------------------------');
console.log('🔑 INDIVIDUAL ACCESS DETAILS:');
console.log(`• Owner Key (You):       ${ownerKey}`);
console.log(`• Aux Admin Key:         ${adminKey1}`);
console.log(`• Backup Key:            ${adminKey2}`);
console.log('--------------------------------------------------------\n');
console.log('💡 Tip: Paste SUPER_ADMIN_KEYS into your backend/.env file');
console.log('Each administrator can use their respective key to log in to /saas-admin.\n');
