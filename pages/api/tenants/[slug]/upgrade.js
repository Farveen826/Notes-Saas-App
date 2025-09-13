import pool from '../../../../lib/db';
import { authMiddleware } from '../../../../lib/auth';
import { handleCors } from '../../../../lib/cors';

export default async function handler(req, res) {
  handleCors(req, res);
  
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decoded = await authMiddleware(req, res);
  if (!decoded) return;

  const { slug } = req.query;

  // Check if user is admin
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Check if the tenant slug matches the user's tenant
  if (decoded.tenant_slug !== slug) {
    return res.status(403).json({ error: 'Unauthorized tenant access' });
  }

  try {
    const upgradeQuery = `
      UPDATE tenants 
      SET subscription_plan = 'pro' 
      WHERE slug = $1 AND id = $2
      RETURNING *
    `;
    const result = await pool.query(upgradeQuery, [slug, decoded.tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.status(200).json({ 
      message: 'Tenant upgraded to Pro plan successfully',
      tenant: result.rows[0]
    });
  } catch (error) {
    console.error('Upgrade tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}