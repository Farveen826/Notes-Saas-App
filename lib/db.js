import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

// Parse the connection URL manually
const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString?.substring(0, 50) + '...');

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Add these explicit settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;