import 'dotenv/config';
console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');