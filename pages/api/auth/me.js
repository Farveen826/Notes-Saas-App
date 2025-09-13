import pool from '../../../lib/db';
import { authMiddleware } from '../../../lib/auth';
import { handleCors } from '../../../lib/cors';

export default async function handler(req, res) {
  handleCors(req, res);
  
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decoded = await authMiddleware(req, res);
  if (!decoded) return;

  try {
    const userQuery = `
      SELECT u.*, t.slug as tenant_slug, t.name as tenant_name, t.subscription_plan 
      FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.id = $1 AND u.tenant_id = $2
    `;
    const userResult = await pool.query(userQuery, [decoded.id, decoded.tenant_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    res.status(200).json({
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
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}