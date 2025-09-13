import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// DEBUG: Check what we're reading
console.log('DEBUG - DATABASE_URL first 60 chars:', process.env.DATABASE_URL?.substring(0, 60));
console.log('DEBUG - Full DATABASE_URL:', process.env.DATABASE_URL);

import pool from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
// ... rest of your code

// ... rest of your init-db.js code
async function initDatabase() {
  try {
    console.log('Starting database initialization...');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created tenants table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created users table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created notes table');

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notes_tenant_id ON notes(tenant_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');
    console.log('✓ Created database indexes');

    // Insert tenants
    const tenantInsertQuery = `
      INSERT INTO tenants (name, slug, subscription_plan) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `;

    let acmeTenantId, globexTenantId;

    const acmeResult = await pool.query(tenantInsertQuery, ['Acme Corporation', 'acme', 'free']);
    if (acmeResult.rows.length > 0) {
      acmeTenantId = acmeResult.rows[0].id;
      console.log('✓ Created Acme tenant');
    } else {
      const existingAcme = await pool.query('SELECT id FROM tenants WHERE slug = $1', ['acme']);
      acmeTenantId = existingAcme.rows[0].id;
      console.log('✓ Acme tenant already exists');
    }

    const globexResult = await pool.query(tenantInsertQuery, ['Globex Corporation', 'globex', 'free']);
    if (globexResult.rows.length > 0) {
      globexTenantId = globexResult.rows[0].id;
      console.log('✓ Created Globex tenant');
    } else {
      const existingGlobex = await pool.query('SELECT id FROM tenants WHERE slug = $1', ['globex']);
      globexTenantId = existingGlobex.rows[0].id;
      console.log('✓ Globex tenant already exists');
    }

    // Hash the password
    const hashedPassword = await hashPassword('password');

    // Insert test users
    const userInsertQuery = `
      INSERT INTO users (tenant_id, email, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
    `;

    const testUsers = [
      [acmeTenantId, 'admin@acme.test', hashedPassword, 'admin'],
      [acmeTenantId, 'user@acme.test', hashedPassword, 'member'],
      [globexTenantId, 'admin@globex.test', hashedPassword, 'admin'],
      [globexTenantId, 'user@globex.test', hashedPassword, 'member']
    ];

    for (const user of testUsers) {
      await pool.query(userInsertQuery, user);
    }
    console.log('✓ Created all test users');

    console.log('\nDatabase initialization completed successfully!');
    console.log('\nTest accounts created:');
    console.log('- admin@acme.test (password: password) - Admin at Acme');
    console.log('- user@acme.test (password: password) - Member at Acme');
    console.log('- admin@globex.test (password: password) - Admin at Globex');
    console.log('- user@globex.test (password: password) - Member at Globex');

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();