import pool from '../../../lib/db';
import { verifyPassword, generateToken } from '../../../lib/auth';
import { handleCors } from '../../../lib/cors';

export default async function handler(req, res) {
  handleCors(req, res);
  
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const userQuery = `
      SELECT u.*, t.slug as tenant_slug, t.name as tenant_name, t.subscription_plan 
      FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = $1
    `;
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      tenant_slug: user.tenant_slug
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant: {
          id: user.tenant_id,
          slug: user.tenant_slug,
          name: user.tenant_name,
          subscription_plan: user.subscription_plan
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}